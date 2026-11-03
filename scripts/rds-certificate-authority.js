#!/usr/bin/env node
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
 * Prints the Amazon RDS root certificate authority the apps trust for their
 * database connections, for storing in Parameter Store at
 * /<environment>/database/certificate-authorities (see
 * packages/backend/lib/database-tls.js).
 *
 * It downloads the region's bundle from AWS
 * (https://truststore.pki.rds.amazonaws.com/<region>/<region>-bundle.pem),
 * picks out the root certificate authority for each `--ca` (by default
 * rds-ca-rsa2048-g1, which the infrastructure sets on our database
 * instances), checks it's valid now, and prints it. Only the root: AWS's
 * advice is to trust root certificate authorities alone, and the whole
 * bundle wouldn't fit in a parameter anyway.
 *
 *   node scripts/rds-certificate-authority.js > rds-ca.pem
 *   aws ssm put-parameter --name /staging/database/certificate-authorities \
 *     --type String --value file://rds-ca.pem
 *
 * Options:
 *   --region REGION   The region the databases are in (default us-east-1).
 *   --ca ID           An RDS certificate authority to include: rds-ca-rsa2048-g1,
 *                     rds-ca-rsa4096-g1 or rds-ca-ecc384-g1. Repeat it to
 *                     include more than one, as when moving the databases
 *                     from one to another (default rds-ca-rsa2048-g1).
 *
 * The certificates go to standard output; what it found, with each one's
 * SHA-256 fingerprint and expiry, goes to standard error. It refuses
 * anything it can't find, or that's expired, and a result too big for a
 * standard parameter (4 KB).
 ******************************************************************************/

const { readCertificates, commonName, isCurrent } = require('../packages/backend/lib/database-tls')

/** A standard Parameter Store parameter holds up to 4 KB. */
const STANDARD_PARAMETER_LIMIT = 4096

const fail = function(message) {
    console.error(message)
    process.exit(1)
}

const options = function(argv) {
    const result = { region: 'us-east-1', ca: [] }
    for (let i = 0; i < argv.length; i++) {
        const value = argv[i + 1]
        if ( argv[i] === '--region' && value ) {
            result.region = value
            i++
        } else if ( argv[i] === '--ca' && value ) {
            result.ca.push(value)
            i++
        } else {
            fail(`Unknown argument '${argv[i]}'. See the comment at the top of ${__filename}.`)
        }
    }
    if ( result.ca.length === 0 ) {
        result.ca.push('rds-ca-rsa2048-g1')
    }
    return result
}

/**
 * rds-ca-rsa2048-g1 in us-east-1 is "Amazon RDS us-east-1 Root CA RSA2048 G1".
 */
const rootCommonName = function(region, ca) {
    const match = /^rds-ca-(rsa2048|rsa4096|ecc384)-(g\d+)$/.exec(ca)
    if ( ! match ) {
        fail(`'${ca}' isn't an RDS certificate authority this knows: rds-ca-rsa2048-g1, rds-ca-rsa4096-g1 or rds-ca-ecc384-g1.`)
    }
    return `Amazon RDS ${region} Root CA ${match[1].toUpperCase()} ${match[2].toUpperCase()}`
}

const main = async function() {
    const { region, ca } = options(process.argv.slice(2))
    const url = `https://truststore.pki.rds.amazonaws.com/${region}/${region}-bundle.pem`

    console.error(`Fetching ${url}...`)
    const response = await fetch(url)
    if ( ! response.ok ) {
        fail(`Fetching ${url} failed: ${response.status} ${response.statusText}`)
    }
    const bundle = await response.text()

    let certificates
    try {
        certificates = readCertificates(bundle)
    } catch (error) {
        fail(`A certificate in the bundle doesn't parse: ${error.message}`)
    }
    console.error(`The bundle has ${certificates.length} certificates.`)

    const now = new Date()
    const chosen = []
    for (const id of ca) {
        const name = rootCommonName(region, id)
        const found = certificates.filter((certificate) => commonName(certificate) === name && isCurrent(certificate, now))
        if ( found.length === 0 ) {
            fail(`The bundle has no currently valid '${name}' (${id}).`)
        }
        for (const certificate of found) {
            console.error(`  ${id}: ${name}`)
            console.error(`    valid ${certificate.validFrom} to ${certificate.validTo}`)
            console.error(`    SHA-256 ${certificate.fingerprint256}`)
            chosen.push(certificate.toString().trim())
        }
    }

    const pem = chosen.join('\n') + '\n'
    if ( Buffer.byteLength(pem) > STANDARD_PARAMETER_LIMIT ) {
        fail(`That's ${Buffer.byteLength(pem)} bytes, more than a standard parameter holds (${STANDARD_PARAMETER_LIMIT}). `
            + `Include fewer certificate authorities.`)
    }
    console.error(`${Buffer.byteLength(pem)} bytes.`)

    process.stdout.write(pem)
}

main().catch((error) => fail(error.stack ?? String(error)))
