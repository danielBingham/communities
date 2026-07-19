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

const dns = require('node:dns')
const { Agent, fetch: undiciFetch } = require('undici')
const { isPrivateHost, LinkpeekError } = require('linkpeek')

// A filtering lookup function that checks the result of a DNS lookup to ensure
// its not asking for a private IP.
const lookup = (hostname, options, callback) => {
    // `options` can be either an options object or the callback.  In the
    // latter case, initialize a blank options object.
    const optionsInternal = typeof options === 'function' ? {} : options

    // If `options` is a function, then that's the callback.  Otherwise,
    // `callback` is.
    const callbackInternal = typeof options === 'function' ? options: callback

    // Family is the IP family.  Valid values are: 4,6, and 0.
    // 4 indicates ipv4, 6 indicates ipv6, and 0 indicates either.
    let family = 0
    // Boolean controlling whether to resolve all associated addresses.
    let wantAll = false
    if ( optionsInternal && typeof optionsInternal === 'object' ) {
        if ( 'family' in optionsInternal && optionsInternal.family !== undefined) {
            console.log(`family: `, optionsInternal.family)
            const parsedFamily = parseInt(optionsInternal.family, 10)

            const validFamilies = [0,4,6]
            if ( ! validFamilies.includes(parsedFamily) ) {
                throw new Error('Invalid family.')
            }

            family = parsedFamily
        }

        if ( 'all' in optionsInternal ) {
            if ( optionsInternal.all === true ) {
                wantAll = true
            } else if (optionsInternal.all === false ) {
                wantAll = false
            } else {
                throw new Error('Invalid all.')
            }
        }
    }

    dns.lookup(hostname, { all: true, family: family, verbatim: true}, (error, addresses) => {
        if ( error ) {
            return callbackInternal(error)
        }

        if ( ! addresses || addresses.length === 0 ) {
            return callbackInternal(new LinkpeekError('INVALID_URL', 'No addresses found for URL.'))
        }

        const privateAddress = addresses.find((a) => isPrivateHost(a.address))
        if ( privateAddress ) {
            return callbackInternal(new LinkpeekError('PRIVATE_NETWORK_BLOCKED', `${hostname} resolves to a private/restricted address. (${privateAddress.address})`))
        }

        if ( wantAll ) {
            return callbackInternal(null, addresses)
        } else {
            return callbackInternal(null, addresses[0].address, addresses[0].family)
        }
    })
}

// Make an agent with our lookup function embedded.
//
// NOTE: We are using an API here that is only documented by example, and not
// fully documented. It's a passthrough API. You can find it documented here,
// under the Client definition in example 'ESM (4)':
// https://undici.nodejs.org/api/Client
const agent = new Agent({ connect: { lookup: lookup } })

// SSRF Safe Fetch function that blocks private addresses either before or
// after DNS lookup.
const ssrfSafeFetch = function(url, init = {}) {
    try {
        const host = new URL(url).hostname
        if ( isPrivateHost(host) ) {
            return Promise.reject(new LinkpeekError('PRIVATE_NETWORK_BLOCKED', `${host} is a private/restricted address.`))
        }
    } catch (error) {
        return Promise.reject(new LinkpeekError('INVALID_URL', `Invalid url: ${url}`))
    }


    return undiciFetch(url, { ...init, dispatcher: agent })
}

module.exports = {
    ssrfSafeFetch: ssrfSafeFetch
}
