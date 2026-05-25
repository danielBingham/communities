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

module.exports = class Feat15PostImageGalleriesMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() { 
        await this.core.database.query(`CREATE TYPE file_usage as ENUM('post', 'post-comment', 'user-profile', 'group-profile')`, [])

        await this.core.database.query(`ALTER TABLE files ADD COLUMN IF NOT EXISTS usage file_usage NOT NULL DEFAULT 'post' `, [])
        await this.core.database.query(`ALTER TABLE files ALTER COLUMN variants SET DEFAULT '{}'`, [])


        await this.core.database.query(`
CREATE TABLE IF NOT EXISTS post_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    file_id uuid REFERENCES files(id) ON DELETE CASCADE NOT NULL,

    position int NOT NULL DEFAULT 1,
    UNIQUE(post_id, file_id)
)
        `, [])

        await this.core.database.query(`
            CREATE INDEX IF NOT EXISTS post_files__post_id ON post_files (post_id)
        `, [])

        await this.core.database.query(`
            CREATE INDEX IF NOT EXISTS post_files__file_id ON post_files (file_id)
        `, [])
    }

    async initBack() { 
        await this.core.database.query(`ALTER TABLE files DROP COLUMN IF EXISTS usage`, [])

        await this.core.database.query(`DROP TYPE IF EXISTS file_usage`, [])

        await this.core.database.query(`DROP INDEX IF EXISTS post_files__post_id`, [])
        await this.core.database.query(`DROP INDEX IF EXISTS post_files__file_id`, [])

        await this.core.database.query(`DROP TABLE IF EXISTS post_files`, [])
    }

    async migrateForward(targets) { 
        await this.core.database.query(`
            INSERT INTO post_files (post_id, file_id)
                (SELECT id, file_id FROM posts WHERE file_id IS NOT NULL)
        `, [])
    }

    async migrateBack(targets) { 
        await this.core.database.query(`DELETE FROM post_files`, [])
    }
}
