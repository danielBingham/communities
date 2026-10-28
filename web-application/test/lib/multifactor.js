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

/******************************************************************************
 * TOTP tokens for a fixture with multi-factor authentication enabled,
 * generated as an authenticator app would, from the secret POST /test/user
 * handed back: getFixture('user-mfa').multifactorSecret.
 ******************************************************************************/

const { generate } = require('otplib')

// The server only accepts the token for the current 30-second step, so a
// token made in the last few seconds of a step can arrive after it's over.
// Rather than risk that, wait for the next step.
const STEP_SECONDS = 30
const MARGIN_SECONDS = 5

const waitForFreshStep = async function() {
    const secondsLeft = STEP_SECONDS - ((Date.now() / 1000) % STEP_SECONDS)
    if ( secondsLeft < MARGIN_SECONDS ) {
        await new Promise((resolve) => setTimeout(resolve, secondsLeft * 1000 + 250))
    }
}

/**
 * The token an authenticator app would show now.
 */
const currentToken = async function(secret) {
    await waitForFreshStep()
    return await generate({ secret: secret })
}

/**
 * A well-formed six-digit token that isn't the current one.
 */
const wrongToken = async function(secret) {
    const token = await currentToken(secret)
    return String((Number(token) + 1) % 1000000).padStart(6, '0')
}

module.exports = {
    currentToken: currentToken,
    wrongToken: wrongToken
}
