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

const { isProduction, refuseProduction } = require('../../lib/production')

describe('The test suites\' production guard', function() {

    it.each([
        'https://communities.social/api/0.0.0/',
        'http://communities.social/api/0.0.0/',
        'https://communities.social:443/',
        'https://COMMUNITIES.SOCIAL/',
        'https://communities.social./',
        'https://www.communities.social/',
        'https://api.communities.social/api/0.0.0/'
    ])('Should treat %s as production', function(url) {
        expect(isProduction(url)).toBe(true)
        expect(isProduction(new URL(url))).toBe(true)
    })

    it.each([
        'https://staging.communities.social/api/0.0.0/',
        'https://localhost:3000/api/0.0.0/',
        'https://127.0.0.1:3000/',
        'https://[::1]:3000/',
        'https://communities.social.example.com/',
        'https://notcommunities.social/'
    ])('Should not treat %s as production', function(url) {
        expect(isProduction(url)).toBe(false)
    })

    it('Should refuse something that is not a URL', function() {
        expect(() => isProduction('communities.social')).toThrow()
    })

    it('Should name what it refused', function() {
        expect(() => refuseProduction('https://communities.social/', 'BASE_URL'))
            .toThrow('Tests may not be run against production! BASE_URL is https://communities.social/.')
        expect(() => refuseProduction('https://staging.communities.social/', 'BASE_URL')).not.toThrow()
    })
})
