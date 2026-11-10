const Core = require('../core')
const Events = require('../events')

describe('Core', function() {

    const QUEUE_NAMES = [
        'process-video',
        'resize-image',
        'send-notifications',
        'add-mutuals-for-relationship',
        'remove-mutuals-for-relationship'
    ]

    /**
     * A core whose dependencies are fakes that record, in `calls`, the order
     * they're closed in.
     */
    const coreWithFakes = function(calls) {
        const core = new Core('worker', {})
        core.logger = { info: jest.fn(), error: jest.fn() }

        const closer = (name) => jest.fn(async () => { calls.push(name) })
        core.queues = Object.fromEntries(QUEUE_NAMES.map((name) => [ name, { close: closer(`queue:${name}`) } ]))
        core.events = { shutdown: closer('events') }
        core.redis = { close: closer('redis') }
        core.database = { end: closer('database') }
        return core
    }

    describe('shutdown()', function() {
        it('Should close every queue', async function() {
            const calls = []
            const core = coreWithFakes(calls)
            const queues = core.queues

            await core.shutdown()

            for (const name of QUEUE_NAMES) {
                expect(queues[name].close).toHaveBeenCalledTimes(1)
            }
            expect(core.queues).toEqual({})
        })

        it('Should close the queues first, then Redis, then the database', async function() {
            const calls = []
            const core = coreWithFakes(calls)

            await core.shutdown()

            // A worker's queue waits for its running jobs when it closes, and
            // those jobs still need Redis and the database.
            expect(calls.slice(0, QUEUE_NAMES.length).sort())
                .toEqual(QUEUE_NAMES.map((name) => `queue:${name}`).sort())
            expect(calls.slice(QUEUE_NAMES.length)).toEqual([ 'events', 'redis', 'database' ])
            expect(core.events).toBe(null)
            expect(core.redis).toBe(null)
            expect(core.database).toBe(null)
        })

        it('Should close everything else when something fails to close, and report it', async function() {
            const calls = []
            const core = coreWithFakes(calls)
            core.queues['resize-image'].close = jest.fn(async () => { throw new Error('Connection is closed.') })
            core.events.shutdown = jest.fn(async () => { throw new Error('The client is closed') })

            await core.shutdown()

            expect(calls).toContain('queue:process-video')
            expect(calls).toContain('redis')
            expect(calls[calls.length - 1]).toBe('database')
            expect(core.logger.error).toHaveBeenCalledWith(`Couldn't close the 'resize-image' queue: Connection is closed.`)
            expect(core.logger.error).toHaveBeenCalledWith(`Couldn't close the events subscriber: The client is closed`)
        })

        it('Should only shut down once', async function() {
            const calls = []
            const core = coreWithFakes(calls)
            jest.spyOn(console, 'error').mockImplementation(() => {})

            await core.shutdown()
            await core.shutdown()

            expect(calls.filter((call) => call === 'database')).toHaveLength(1)
            jest.restoreAllMocks()
        })
    })

    describe('Events.shutdown()', function() {
        it('Should close the subscriber\'s connection, and leave the shared one to Core', async function() {
            const subscriber = { close: jest.fn(async () => {}) }
            const redis = { duplicate: jest.fn(() => subscriber), close: jest.fn() }
            const events = new Events(redis, { error: jest.fn() })

            await events.shutdown()

            expect(subscriber.close).toHaveBeenCalledTimes(1)
            expect(redis.close).not.toHaveBeenCalled()
        })
    })
})
