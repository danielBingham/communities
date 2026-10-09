const fs = require('fs')
const os = require('os')
const path = require('path')

const Logger = require('../../logger')
const ServiceError = require('../../errors/ServiceError')
const EmailService = require('../../services/EmailService')
const { createEmailDriver } = require('../../services/email')
const LogEmailDriver = require('../../services/email/LogEmailDriver')
const PostmarkEmailDriver = require('../../services/email/PostmarkEmailDriver')

describe('Email', function() {

    const message = {
        From: 'no-reply@communities.social',
        To: 'someone@example.com',
        Subject: '[Communities] Please confirm your email, Someone!',
        // Handlebars escapes `=` in the link as `&#x3D;`.
        HtmlBody: '<p>Follow this link: <a href="https://localhost:3000/email-confirmation?token&#x3D;abc&amp;x&#61;1">Confirm Email</a></p>',
        MessageStream: 'email-confirmation'
    }

    const coreWith = function(email) {
        const logger = new Logger()
        logger.level = -1
        return { config: { email: email }, logger: logger }
    }

    describe('createEmailDriver()', function() {
        it('Should create the driver email.driver names, with its block', function() {
            const core = coreWith({ driver: 'postmark', postmark: { api_token: 'token' } })
            expect(createEmailDriver(core)).toBeInstanceOf(PostmarkEmailDriver)

            const logCore = coreWith({ driver: 'log', log: { directory: 'tmp/email' } })
            const driver = createEmailDriver(logCore)
            expect(driver).toBeInstanceOf(LogEmailDriver)
            expect(driver.directory).toBe('tmp/email')
        })

        it('Should reject a missing or unknown driver', function() {
            for (const email of [ undefined, {}, { driver: 'smtp' }, { driver: 'constructor' } ]) {
                expect(() => createEmailDriver(coreWith(email))).toThrow(/email\.driver/)
            }
        })

        it('Should require an API token for the postmark driver', function() {
            expect(() => createEmailDriver(coreWith({ driver: 'postmark' }))).toThrow(/email\.postmark\.api_token/)
            expect(() => createEmailDriver(coreWith({ driver: 'postmark', postmark: {} }))).toThrow(/email\.postmark\.api_token/)
        })
    })

    describe('PostmarkEmailDriver', function() {
        it('Should send the message to Postmark unchanged', async function() {
            const client = { sendEmail: jest.fn(async () => ({ MessageID: 'x' })) }
            const driver = new PostmarkEmailDriver(coreWith(), { api_token: 'token' }, client)

            await driver.send(message)

            expect(client.sendEmail).toHaveBeenCalledWith(message)
        })

        it('Should report an inactive recipient as invalid-email and anything else as email-failed', async function() {
            const inactive = Object.assign(new Error('Inactive recipient'), { code: 406 })
            const driver = new PostmarkEmailDriver(coreWith(), { api_token: 'token' }, { sendEmail: jest.fn(async () => { throw inactive }) })
            await expect(driver.send(message)).rejects.toMatchObject({ type: 'invalid-email' })

            const failing = new PostmarkEmailDriver(coreWith(), { api_token: 'token' }, { sendEmail: jest.fn(async () => { throw new Error('Timeout') }) })
            await expect(failing.send(message)).rejects.toMatchObject({ type: 'email-failed' })
        })
    })

    describe('LogEmailDriver', function() {
        let directory = null

        beforeEach(function() {
            directory = fs.mkdtempSync(path.join(os.tmpdir(), 'communities-email-'))
        })

        afterEach(function() {
            fs.rmSync(directory, { recursive: true, force: true })
        })

        it('Should log the message with its links and save it as JSON in the directory', async function() {
            const core = coreWith()
            const info = jest.spyOn(core.logger, 'info').mockImplementation(() => {})
            const target = path.join(directory, 'email')
            const driver = new LogEmailDriver(core, { directory: target })

            await driver.send(message)

            const files = fs.readdirSync(target)
            expect(files).toHaveLength(1)
            expect(files[0]).toMatch(/-email-confirmation-[0-9a-f]{6}\.json$/)
            const saved = JSON.parse(fs.readFileSync(path.join(target, files[0]), 'utf8'))
            expect(saved).toMatchObject(message)
            expect(saved.Date).toEqual(expect.any(String))

            const entry = info.mock.calls[0][0]
            expect(entry).toContain('email-confirmation to someone@example.com')
            expect(entry).toContain('link: https://localhost:3000/email-confirmation?token=abc&x=1')
            expect(entry).toContain(`saved to ${path.join(target, files[0])}`)
            expect(entry).not.toContain('<p>')
        })

        it('Should log the whole body when no directory is set', async function() {
            const core = coreWith()
            const info = jest.spyOn(core.logger, 'info').mockImplementation(() => {})
            const driver = new LogEmailDriver(core, undefined)

            await driver.send(message)

            expect(info.mock.calls[0][0]).toContain(message.HtmlBody)
        })
    })

    describe('EmailService.sendEmail()', function() {
        it('Should send through the core email driver', async function() {
            const core = coreWith()
            core.emailDriver = { send: jest.fn(async () => {}) }

            await new EmailService(core).sendEmail(message)

            expect(core.emailDriver.send).toHaveBeenCalledWith(message)
        })

        it('Should pass driver ServiceErrors through and wrap anything else as email-failed', async function() {
            const core = coreWith()
            const service = new EmailService(core)

            core.emailDriver = { send: jest.fn(async () => { throw new ServiceError('invalid-email', 'Bounced') }) }
            await expect(service.sendEmail(message)).rejects.toMatchObject({ type: 'invalid-email' })

            core.emailDriver = { send: jest.fn(async () => { throw new Error('ENOSPC') }) }
            await expect(service.sendEmail(message)).rejects.toMatchObject({ type: 'email-failed' })
        })
    })
})
