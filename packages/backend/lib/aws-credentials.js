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

const ConfigError = require('../errors/ConfigError')

/**
 * The AWS credentials the app's SDK clients are made with: the same for
 * Parameter Store (Config.awsCredentials()) and S3 (S3Storage, unless its
 * configuration has keys of its own), chosen from the environment. So each
 * environment reaches AWS as one identity: its IAM user locally, its pods'
 * role on staging and production. There are only two kinds:
 *
 * - Access keys, when AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are both
 *   set. Local environments use these: the keys of an IAM user made for the
 *   environment (`local-<username>`), so the app runs with that user's
 *   permissions rather than the developer's.
 * - EKS Pod Identity, when AWS_CONTAINER_CREDENTIALS_FULL_URI and
 *   AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE are set. EKS sets them in a pod
 *   whose ServiceAccount has a Pod Identity association, which is how
 *   staging and production run. The SDK's container credential provider then
 *   gets the role's credentials from the Pod Identity agent, and refreshes
 *   them.
 *
 * Keys win when a pod has both, so a pod moves to Pod Identity when its keys
 * are taken away. Anything else is refused rather than left to the SDK's
 * default chain, which would go on to a profile or login in ~/.aws, or to
 * the instance's role: the app never runs as whoever happens to be signed in
 * to AWS. (Pod Identity goes through that chain, which tries the keys and a
 * ~/.aws profile first; the app's images have no ~/.aws.)
 *
 * @param {Object} env  The environment, e.g. `process.env`.
 * @param {string} purpose  What the credentials are for, for messages: e.g.
 * `read Parameter Store`.
 *
 * @return {Object} `{ source, credentials }`: what the credentials are, for
 * the log, and the `credentials` to give the SDK client. That's the key
 * pair, or undefined for Pod Identity, which the SDK finds itself.
 *
 * @throws {ConfigError} When only one of the keys is set, or there are
 * neither keys nor Pod Identity.
 */
const chooseAWSCredentials = function(env, purpose) {
    const accessKeyId = env.AWS_ACCESS_KEY_ID || undefined
    const secretAccessKey = env.AWS_SECRET_ACCESS_KEY || undefined

    if ( accessKeyId && secretAccessKey ) {
        return {
            source: 'the access keys in AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY',
            credentials: { accessKeyId: accessKeyId, secretAccessKey: secretAccessKey }
        }
    }

    if ( accessKeyId || secretAccessKey ) {
        throw new ConfigError(`Only one of AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY is set. `
            + `Set both to ${purpose} with access keys, or neither in a pod with EKS Pod Identity.`)
    }

    if ( env.AWS_CONTAINER_CREDENTIALS_FULL_URI && env.AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE ) {
        return { source: 'EKS Pod Identity', credentials: undefined }
    }

    throw new ConfigError(`There are no AWS credentials to ${purpose} with. Set `
        + `AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to an access key for the environment's IAM user, `
        + `or run in a pod whose ServiceAccount has an EKS Pod Identity association. `
        + `AWS profiles and logins aren't used.`)
}

module.exports = {
    chooseAWSCredentials: chooseAWSCredentials
}
