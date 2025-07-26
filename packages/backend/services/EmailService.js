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
            console.error(error)
            throw new ServiceError('email-failed', 
                `Attempt to send an email failed with message: ${error.message}.`)
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
        const confirmationLink = this.config.host + `email-confirmation?token=${token.token}`


        const emailTextBody = `
Hello ${user.name}!

Please confirm your email address by following this link: ${confirmationLink}

Cheers,
The Communities Team
`



        await this.sendEmail({
            "From": "no-reply@communities.social",
            "To": user.email,
            "Subject": `[Communities] Please confirm your email, ${user.name}!`,
            "TextBody": emailTextBody,
            "MessageStream": "email-confirmation"
        })
    }

    async sendPasswordReset(user, token) {
        const resetLink = this.config.host + `reset-password?token=${token.token}`

        const emailTextBody = `
Hello ${user.name},

Someone requested a password reset for your Communities account.

If this was you, please use the following link to reset your password: ${resetLink}

Cheers,
The Communities Team
`


        await this.sendEmail({
            "From": "no-reply@communities.social",
            "To": user.email,
            "Subject": "[Communities] Please reset your password",
            "TextBody": emailTextBody,
            "MessageStream": "password-reset"
        })
    }

    async sendInvitation(inviter, user, token) {
        const invitationLink = this.config.host + `accept-invitation?token=${token.token}`

        const emailTextBody = `
Hello ${user.email.substring(0, user.email.indexOf('@'))},

You have been invited to join Communities by ${inviter.name}!  

Communities is a non-profit, user supported social media platform built to help users build community, connect, and organize. We're on a mission to de-enshitify the internet.

We're currently in invite only private beta.  If you'd like to join and come kick the tires, click the following link: ${invitationLink}

Cheers!
The Communities Team`


        await this.sendEmail({
            "From": "no-reply@communities.social",
            "To": user.email,
            "Subject": `[Communities] ${inviter.name} invites you to join Communities`,
            "TextBody": emailTextBody,
            "MessageStream": "invitation"
        })
    }



}


