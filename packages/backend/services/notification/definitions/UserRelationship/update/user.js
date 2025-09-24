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
const fs = require('fs')
const path = require('path')

const emailBodyTemplate = fs.readFileSync(path.resolve(__dirname, './user.hbs'), 'utf8')

module.exports = {
    type: 'UserRelationship:update:user',
    email: {
        subject: Handlebars.compile('[Communities] {{{friend.name}}} accepted your Friend Request'),
        body: Handlebars.compile(emailBodyTemplate)
    },
    web: {
        text: Handlebars.compile(`{{{friend.name}}} accepted your friend request.`),
        path: Handlebars.compile(`{{{ path }}}`)
    }
}
