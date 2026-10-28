const crypto = require('crypto')

const Logger = require('../../logger')
const NotificationWorker = require('../../services/notification/NotificationWorker')
const { createPushDrivers, AndroidPushDriver, IOSPushDriver, LogPushDriver } = require('../../services/push')

describe('Push notifications', function() {

    const ios = {
        privateCert: '-----BEGIN PRIVATE KEY-----',
        publicCert: '-----BEGIN CERTIFICATE-----',
        applicationBundleID: 'social.communities',
        endpoint: 'https://api.sandbox.push.apple.com'
    }

    // A service account in the shape Firebase checks; nothing is sent.
    const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
    const android = {
        firebaseServiceAccount: JSON.stringify({
            project_id: 'communities-test',
            client_email: 'push@communities-test.iam.gserviceaccount.com',
            private_key: privateKey.export({ type: 'pkcs8', format: 'pem' })
        })
    }

    const coreWith = function(notifications, environment) {
        const logger = new Logger()
        logger.level = -1
        return {
            config: { environment: environment ?? 'development', host: 'https://localhost:3000', notifications: notifications },
            logger: logger
        }
    }

    describe('validateConfig()', function() {
        it('Should require the iOS settings', function() {
            expect(() => IOSPushDriver.validateConfig(ios, 'production')).not.toThrow()
            for (const key of Object.keys(ios)) {
                expect(() => IOSPushDriver.validateConfig({ ...ios, [key]: '' }, 'production')).toThrow(`notifications.ios.${key}`)
            }
        })

        it('Should require the Android service account, as JSON', function() {
            expect(() => AndroidPushDriver.validateConfig(android, 'production')).not.toThrow()
            expect(() => AndroidPushDriver.validateConfig({}, 'production')).toThrow('notifications.android.firebaseServiceAccount')
            expect(() => AndroidPushDriver.validateConfig({ firebaseServiceAccount: 'not-configured' }, 'production')).toThrow(/must be the service account's JSON/)
            // The old local placeholder: JSON, but not a service account.
            expect(() => AndroidPushDriver.validateConfig({ firebaseServiceAccount: '{}' }, 'production')).toThrow(`needs its 'project_id'`)
        })

        it('Should only allow the log driver in development', function() {
            expect(() => LogPushDriver.validateConfig({}, 'development')).not.toThrow()
            for (const environment of [ 'staging', 'production', undefined ]) {
                expect(() => LogPushDriver.validateConfig({}, environment)).toThrow('The log push driver may only be used in development.')
            }
        })
    })

    describe('createPushDrivers()', function() {
        it('Should turn push notifications off without a notifications block, or with an empty one', function() {
            expect(createPushDrivers(coreWith(undefined))).toEqual([])
            expect(createPushDrivers(coreWith({}))).toEqual([])
        })

        it('Should turn on the driver for each block, with that block as its settings', function() {
            expect(createPushDrivers(coreWith({ ios: ios }))).toEqual([ expect.any(IOSPushDriver) ])
            expect(createPushDrivers(coreWith({ android: android }))).toEqual([ expect.any(AndroidPushDriver) ])
            expect(createPushDrivers(coreWith({ log: {} }))).toEqual([ expect.any(LogPushDriver) ])

            const all = createPushDrivers(coreWith({ ios: ios, android: android, log: {} }))
            expect(all).toEqual([ expect.any(IOSPushDriver), expect.any(AndroidPushDriver), expect.any(LogPushDriver) ])
            expect(all[0].settings).toBe(ios)
        })

        it('Should only allow the log driver in development', function() {
            for (const environment of [ 'staging', 'production' ]) {
                expect(() => createPushDrivers(coreWith({ log: {} }, environment))).toThrow(/only be used in development/)
                expect(() => createPushDrivers(coreWith({ ios: ios, log: {} }, environment))).toThrow(/only be used in development/)
            }
            expect(createPushDrivers(coreWith({ ios: ios, android: android }, 'production'))).toHaveLength(2)
        })

        it('Should reject a block that isn\'t a push driver', function() {
            for (const name of [ 'apns', 'constructor', 'firebase' ]) {
                expect(() => createPushDrivers(coreWith({ [name]: {} }))).toThrow(`notifications.${name}`)
            }
        })

        it('Should require each driver\'s settings', function() {
            for (const key of Object.keys(ios)) {
                expect(() => createPushDrivers(coreWith({ ios: { ...ios, [key]: undefined } }))).toThrow(`notifications.ios.${key}`)
            }
            expect(() => createPushDrivers(coreWith({ android: {} }))).toThrow('notifications.android.firebaseServiceAccount')
        })
    })

    describe('LogPushDriver', function() {
        it('Should log the notification instead of sending it', async function() {
            const core = coreWith({ log: {} })
            const info = jest.spyOn(core.logger, 'info').mockImplementation(() => {})

            await new LogPushDriver(core, {}).send('user-1', {
                id: 'notification-1',
                type: 'UserRelationship:create:relation',
                description: 'Bob sent you a friend request.',
                path: '/bob'
            })

            expect(info).toHaveBeenCalledWith(
                'Push notification not sent (log driver): UserRelationship:create:relation to User(user-1): "Bob sent you a friend request."'
                + '\n    path: /bob')
        })
    })

    describe('NotificationWorker', function() {
        const workerWith = function(notifications, settings) {
            const core = coreWith(notifications)
            core.database = { query: jest.fn(async () => ({ rows: [ { email: 'alice@example.com', settings: settings ?? {}, status: 'confirmed' } ] })) }
            core.events = { trigger: jest.fn(async () => {}) }

            const worker = new NotificationWorker(core)
            worker.notificationDAO = {
                insertNotifications: jest.fn(async (notification) => { notification.id = 'notification-1' }),
                selectNotifications: jest.fn(async () => ({ dictionary: {} }))
            }
            worker.emailService = { sendNotificationEmail: jest.fn(async () => {}) }
            return worker
        }

        const notify = (worker) => worker.createNotification('alice', 'UserRelationship:create:relation', { requester: { name: 'Bob' }, path: '/bob' })

        it('Should send nothing when push notifications are off, and still notify on the web and by email', async function() {
            const worker = workerWith({})
            expect(worker.pushDrivers).toEqual([])

            await notify(worker)

            expect(worker.notificationDAO.insertNotifications).toHaveBeenCalled()
            expect(worker.emailService.sendNotificationEmail).toHaveBeenCalled()
        })

        it('Should send through every driver that\'s on, even when one fails', async function() {
            const worker = workerWith({ log: {} })
            const failing = { send: jest.fn(async () => { throw new Error('APNs is down') }) }
            const working = { send: jest.fn(async () => {}) }
            worker.pushDrivers = [ failing, working ]

            await notify(worker)

            expect(failing.send).toHaveBeenCalledWith('alice', expect.objectContaining({ type: 'UserRelationship:create:relation', path: '/bob' }))
            expect(working.send).toHaveBeenCalled()
        })

        it('Should skip push when the user turned mobile notifications off', async function() {
            const worker = workerWith({ log: {} }, { notifications: { 'UserRelationship:create:relation': { web: true, email: true, desktop: true, mobile: false } } })
            const driver = { send: jest.fn(async () => {}) }
            worker.pushDrivers = [ driver ]

            await notify(worker)

            expect(driver.send).not.toHaveBeenCalled()
        })
    })
})
