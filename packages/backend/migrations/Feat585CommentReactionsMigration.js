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

/**
 * Adds CommentReactions: reactions (for now, only 'like') on PostComments.
 *
 * This only adds a new enum, a new table, and its indexes, so it is entirely
 * in the initialization phase.  There is no data to migrate.
 */
module.exports = class Feat585CommentReactionsMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() {
        await this.core.database.query(`CREATE TYPE comment_reaction_type AS ENUM('like')`, [])

        // A user may react to a comment only once, which the unique
        // constraint enforces. Its index (comment_id, user_id) also serves
        // lookups by comment_id, so comment_id doesn't need its own index.
        await this.core.database.query(`
            CREATE TABLE IF NOT EXISTS comment_reactions (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                post_id uuid REFERENCES posts (id) ON DELETE CASCADE NOT NULL,
                comment_id uuid REFERENCES post_comments (id) ON DELETE CASCADE NOT NULL,
                user_id uuid REFERENCES users (id) ON DELETE CASCADE NOT NULL,

                reaction comment_reaction_type NOT NULL,

                created_date timestamptz,
                updated_date timestamptz,

                CONSTRAINT comment_reactions__comment_id_user_id_unique UNIQUE (comment_id, user_id)
            )
        `, [])

        await this.core.database.query(`CREATE INDEX IF NOT EXISTS comment_reactions__post_id ON comment_reactions (post_id)`, [])
        await this.core.database.query(`CREATE INDEX IF NOT EXISTS comment_reactions__user_id ON comment_reactions (user_id)`, [])
    }

    async initBack() {
        await this.core.database.query(`DROP INDEX IF EXISTS comment_reactions__user_id`, [])
        await this.core.database.query(`DROP INDEX IF EXISTS comment_reactions__post_id`, [])

        await this.core.database.query(`DROP TABLE IF EXISTS comment_reactions`, [])

        await this.core.database.query(`DROP TYPE IF EXISTS comment_reaction_type`, [])
    }

    async migrateForward(targets) { }

    async migrateBack(targets) { }
}
