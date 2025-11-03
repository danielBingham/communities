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
const BaseMigration = require('./BaseMigration')

const UUID = require('uuid')

module.exports = class UsernameMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() {}

    async initBack() { }

    // ***WARNING***: This is a potentially destructive migration.  We need to
    // test it up the wazoo.
    async migrateForward(targets) { 
        const usernameResults = await this.core.database.query(`SELECT id, username FROM users`, [])

        for(const row of usernameResults.rows) {
            this.core.logger.info(`Examining User(${row.id}) with username: '${row.username}'...`)
            let username = row.username

            if ( ! username || username.length <= 0 ) {
                continue
            }

            // Clean out any invalid characters.
            username = username.replace(/[^a-zA-Z0-9\.\-_]/g, "")

            // Replace periods with dashes.
            username = username.replaceAll(".", "-")

            username = username.toLowerCase().trim()

            if ( username.length < 2 ) {
                username = 'a' + UUID.v4()
            }

            // If the username changed, update it.
            if ( username !== row.username ) {

                // If the resulting username is taken, then start adding numbers to
                // it until we find one that isn't taken.
                const existingResults = await this.core.database.query(`SELECT id, username FROM users WHERE username = $1`, [ username ])
                if ( existingResults.rows.length > 0 ) {
                    for(let index = 1;; index++) {
                        const indexedUsername = username + index
                        const indexedResults = await this.core.database.query(`SELECT id, username FROM users WHERE username = $1`, [ indexedUsername ])

                        if ( indexedResults.rows.length <= 0 ) {
                            username = indexedUsername
                            break
                        }
                    }
                }

                this.core.logger.info(`Migrating username from '${row.username}' to '${username}'...`)
                await this.core.database.query(`UPDATE users SET username = $1 WHERE id = $2`, [ username, row.id ])

                this.core.logger.info(`Finding mentions in posts...`)
                // Now we need to update any mentions in posts.
                const postResults = await this.core.database.query(`SELECT id, content FROM posts WHERE content LIKE $1`, [ `%${row.username}%` ])
                if ( postResults.rows.length > 0 ) {
                    for(const postRow of postResults.rows) {
                        const inMiddleRegex = new RegExp(`(\\s)@${row.username}(\\s)`, 'g')
                        let newContent = postRow.content.replaceAll(inMiddleRegex, `$1@${username}$2`)

                        const wholeContentRegex = new RegExp(`^@${row.username}$`, 'g')
                        newContent = newContent.replaceAll(wholeContentRegex, `@${username}`)

                        const atBeginningRegex = new RegExp(`^@${row.username}(\\s)`, 'g')
                        newContent = newContent.replaceAll(atBeginningRegex, `@${username}$1`)

                        const atEndRegex = new RegExp(`(\\s)@${row.username}$`, 'g')
                        newContent = newContent.replaceAll(atEndRegex, `$1@${username}`)

                        this.core.logger.info(`Migrating Post(${postRow.id}). \n\tContent: ${postRow.content}\n\tUpdated: ${newContent}`)
                        await this.core.database.query(`UPDATE posts SET content = $1 WHERE id = $2`, [ newContent, postRow.id ])
                    }
                }
               
                this.core.logger.info(`Finding mentions in comments...`)
                // And then we need to update any mentions in comments.
                const postCommentResults = await this.core.database.query(`SELECT id, content FROM post_comments WHERE content LIKE $1`, [ `%${row.username}%`])
                if ( postCommentResults.rows.length > 0 ) {
                    for(const postCommentRow of postCommentResults.rows) {
                        const inMiddleRegex = new RegExp(`(\\s)@${row.username}(\\s)`, 'g')
                        let newContent = postCommentRow.content.replaceAll(inMiddleRegex, `$1@${username}$2`)

                        const wholeContentRegex = new RegExp(`^@${row.username}$`, 'g')
                        newContent = newContent.replaceAll(wholeContentRegex, `@${username}`)

                        const atBeginningRegex = new RegExp(`^@${row.username}(\\s)`, 'g')
                        newContent = newContent.replaceAll(atBeginningRegex, `@${username}$1`)

                        const atEndRegex = new RegExp(`(\\s)@${row.username}$`, 'g')
                        newContent = newContent.replaceAll(atEndRegex, `$1@${username}`)

                        this.core.logger.info(`Migrating PostComment(${postCommentRow.id}). \n\tContent: ${postCommentRow.content}\n\tUpdated: ${newContent}`)
                        await this.core.database.query(`UPDATE post_comments SET content = $1 WHERE id = $2`, [ newContent, postCommentRow.id ])
                    }
                }


            }
        }


    }

    async migrateBack(targets) { }
}
