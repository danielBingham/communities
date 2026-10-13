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
 * LOCAL DEVELOPMENT ONLY.
 *
 * Creates the `app` role, with the password the local configuration uses
 * (see .env.local.example), and the `communities` database, owned by it.
 *
 * Staging and production create their own role and database by hand, with
 * their own password, and skip this file: they run only permissions.sql,
 * extensions.sql and schema.sql (see database/README.md).
 *
 * Run it connected to any other database on the server, e.g. `postgres`.
 ******************************************************************************/

CREATE ROLE app WITH LOGIN PASSWORD 'local-development';

CREATE DATABASE communities OWNER app;
