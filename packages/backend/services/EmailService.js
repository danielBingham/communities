/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
const Handlebars = require('handlebars')

const ServiceError = require('../errors/ServiceError')

module.exports = class EmailService {

    constructor(core) {
        this.core = core 

        this.logger = core.logger
        this.config = core.config
    }

    async sendEmail(data) {
        try {
            await this.core.postmarkClient.sendEmail(data)
        } catch (error) {
            this.logger.error(error)

            // Inactive recipients error.  The message bounced because that
            // email address doesn't exist or isn't valid.
            if ( error.code === 406 ) {
                throw new ServiceError('invalid-email',
                    `Message bounced.  That email doesn't exist or isn't valid.`)
            } else {
                throw new ServiceError('email-failed', 
                    `Attempt to send an email failed with message: ${error.message}.`)
            }
        }
    }

    async sendNotificationEmail(address, subject, body) {
        await this.sendEmail({
            "From": "no-reply@communities.social",
            "To": address,
            "Subject": subject,
            "HtmlBody": body,
            "MessageStream": "notifications"
        })
    }

    async sendEmailConfirmation(user, token) {
        const searchParams = new URLSearchParams({ token: token })
        const relativeUrl = `email-confirmation?${searchParams.toString()}`
        const confirmationLink = new URL(relativeUrl, this.config.host).href


        const bodyTemplateString = `
<html>
<head></head>
<body>
<div>
<p>Hello {{ user.name }}!</p>
<p>Your confirmation token is:</p>
<p>{{ token }}</p>
<p>You can confirm your email address by following this link: <a href="{{ confirmationLink }}">Confirm Email</a></p>
<p>Cheers,</p>
<p>The Communities Team</p>
</div>
</body>
</html>
`
        const bodyTemplate = Handlebars.compile(bodyTemplateString)
        const body = bodyTemplate({
            user: user,
            token: token,
            confirmationLink: confirmationLink
        })

        const subjectTemplateString = `[Communities] Please confirm your email, {{ user.name }}!`
        const subjectTemplate = Handlebars.compile(subjectTemplateString)
        const subject = subjectTemplate({ user: user })



        await this.sendEmail({
            "From": "no-reply@communities.social",
            "To": user.email,
            "Subject": subject,
            "HtmlBody": body,
            "MessageStream": "email-confirmation"
        })
    }

    async sendPasswordReset(user, token) {
        const searchParams = new URLSearchParams({ token: token })
        const relativeUrl = `reset-password?${searchParams.toString()}`
        const resetLink = new URL(relativeUrl, this.config.host).href

        const bodyTemplateString = `
<html>
<head></head>
<body>
<div>
<p>Hello {{ user.name }},</p>
<p>Someone requested a password reset for your Communities account.</p>
<p>If this was you, please use the following link to reset your password: <a href="{{ resetLink }}">Reset Password</a></p>
<p>Cheers,</p>
<p>The Communities Team</p>
</div>
</body>
</html>
`
        const bodyTemplate = Handlebars.compile(bodyTemplateString)
        const body = bodyTemplate({ user: user, resetLink: resetLink })


        await this.sendEmail({
            "From": "no-reply@communities.social",
            "To": user.email,
            "Subject": "[Communities] Please reset your password",
            "HtmlBody": body,
            "MessageStream": "password-reset"
        })
    }

    async sendInvitation(inviter, user, token) {
        const searchParams = new URLSearchParams({ token: token })
        const relativeUrl = `accept-invitation?${searchParams.toString()}`
        const invitationLink = new URL(relativeUrl, this.config.host).href

        const bodyTemplateString = `
<html>
<head></head>
<body>
<div>
<p>Hello {{ name }},</p>
<p>You have been invited to join Communities by {{ inviter.name }}!</p>
<p>Communities is a non-profit, cooperative social media platform built to help users build community, connect, and organize.</p>
<p>We're currently in public beta.  If you'd like to join, click the following link: <a href="{{ invitationLink }}">Accept Invitation</a></p>
<p>Cheers!</p>
<p>The Communities Team</p>
</div>
</body>
</html>`
        const bodyTemplate = Handlebars.compile(bodyTemplateString)
        const body = bodyTemplate({ 
            name: user.email.substring(0, user.email.indexOf('@')),
            inviter: inviter,
            invitationLink: invitationLink
        })

        const subjectTemplateString = `[Communities] ${inviter.name} invites you to join Communities`
        const subjectTemplate = Handlebars.compile(subjectTemplateString)
        const subject = subjectTemplate({ inviter: inviter })

        await this.sendEmail({
            "From": "no-reply@communities.social",
            "To": user.email,
            "Subject": subject,
            "HtmlBody": body,
            "MessageStream": "invitation"
        })
    }

    /**
     * Sends an alert to the user that a recovery code has been used.  Since
     * this is a security alert, it shouldn't go through NotificationService.
     * We don't want the user to be able to turn this off.
     */
    async sendRecoveryCodeUsageAlert(user) {
        const bodyTemplateString = `
<html>
<head></head>
<body>
<div>
<p>Your account has been accessed using one of your MFA Recovery Codes.</p>
<p>If this was you, no further action is necessary.</p>
<p>If this was not you, then your account is likely compromised.  We recommend you change your password.</p>
</div>
</body>
</html>
`
        const bodyTemplate = Handlebars.compile(bodyTemplateString)
        const body = bodyTemplate()

        await this.sendEmail({
            "From": "no-reply@communities.social",
            "To": user.email,
            "Subject": `[Communities] Your Account has been Accessed with an MFA Recovery Code`,
            "HtmlBody": body,
            "MessageStream": "security"
        })
    }

    /**
     * Sends an alert to the user notifying them that their MFA state has
     * changed.  Since this is a security alert, it shouldn't go through
     * NotificationService.  We don't want them to be able to turn this off.
     */
    async sendMFAAlert(user, state) {
        const bodyTemplateString = `
<html>
<head></head>
<body>
<div>
<p>Multifactor Authentication has been {{ state }} on your account.</p>
<p>If this was you, no further action is necessary.</p>
<p>If this wasn't you, your account has probably been compromised.  We recommend changing your password.</p>
</div>
</body>
</html>
`
        const bodyTemplate = Handlebars.compile(bodyTemplateString)
        const body = bodyTemplate({ state: state })

        const subjectTemplateString = `[Communities] Multifactor Authentication has been {{ state }}`
        const subjectTemplate = Handlebars.compile(subjectTemplateString)
        const subject = subjectTemplate({ state: state })

        await this.sendEmail({
            "From": "no-reply@communities.social",
            "To": user.email,
            "Subject": subject,
            "HtmlBody": body,
            "MessageStream": "security"
        })
    }

    /**
     * Sends an alert to the user notifying them that their password has
     * changed. Since this is a security alert, it shouldn't go through
     * NotificationService.  We don't want them to be able to turn this off.
     */
    async sendPasswordChangeAlert(user) {
        const bodyTemplateString = `
<html>
<head></head>
<body>
<div>
<p>Your password on Communities has been changed.</p>
<p>If this was you, no further action is necessary.</p>
<p>If this wasn't you, your account has probably been compromised. Please reach out to <a href="contact@communities.social">support</a>!</p>
</div>
</body>
</html>
`
        const bodyTemplate = Handlebars.compile(bodyTemplateString)
        const body = bodyTemplate()

        await this.sendEmail({
            "From": "no-reply@communities.social",
            "To": user.email,
            "Subject": `[Communities] Your password has been changed`,
            "HtmlBody": body,
            "MessageStream": "security"
        })
    }
}


