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

const UserDAO = require('../../daos/UserDAO')
const UserRelationshipDAO = require('../../daos/UserRelationshipDAO')

const { util, permissions } = require('@communities/shared')

const ServiceError = require('../../errors/ServiceError')

module.exports = class UserPermissions {

    constructor(core, permissionService) {
        this.core = core

        this.permissionService = permissionService

        this.userDAO = new UserDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)
    }

    async ensureContext(user, context, required, optional) {
        if ( ( required?.includes('user') || optional?.includes('user') )
            && ( ! util.objectHas(context, 'user') || context.user === null )
        ) {

            // If it's already set to null, then we don't want to load it.
            // It's absent.
            if ( context.user !== null ) {
                if ( util.objectHas(context, 'userId') ) {
                    context.user = await this.userDAO.getUserById(context.userId)
                } else {
                    context.user = null
                }
            }

            if ( required?.includes('user')
                && ( ! util.objectHas(context, 'user') || context.user === null )
            ) {
                throw new ServiceError('missing-context', `'user' missing from context.`)
            }
        }

        if ( ( required?.includes('userRelationship') || optional?.includes('userRelationship') )
            && ( ! util.objectHas(context, 'userRelationship') || context.userRelationship === null )
        ) {

            if ( context.userRelationship !== null ) {
                if ( util.objectHas(context, 'user') ) {
                    if ( user.id !== context.user.id ) {
                        context.userRelationship = await this.userRelationshipDAO.getUserRelationshipByUserAndRelation(user.id, context.user.id)
                    } else {
                        context.userRelationship = null
                    }
                } else {
                    context.userRelationship = null
                }
            }

            if ( required?.includes('userRelationship')
                && ( ! util.objectHas(context, 'userRelationship') || context.userRelationship === null)
            ) {
                throw new ServiceError('missing-context', `'userRelationship' missing from context`)
            }

        }
    }

    async canQueryUser(user, context) {
        return true
    }

    async canCreateUser(user, context) {
        return true
    }

    async canViewUser(user, context) {
        // There may or may not be a relationship.
        await this.ensureContext(user, context, [ 'user' ], [ 'userRelationship' ])

        // Users can always view themselves.
        if ( user.id === context.user.id ) {
            return true
        }

        // Moderators can always view users.
        const canModerateSite = await this.permissionService.can(user, 'moderate', 'Site')
        if ( canModerateSite === true ) {
            return true
        }

        // If they aren't blocked they can view the user.
        if ( context.userRelationship === null || context.userRelationship?.status !== 'blocked' ) {
            return true
        }

        return false
    }

    async canUpdateUser(user, context) {
        await this.ensureContext(user, context, [ 'user' ])

        if ( user.id === context.user.id ) {
            return true
        }

        const canModerateSite = await this.permissionService.can(user, 'moderate', 'Site')
        if ( canModerateSite === true ) {
            return true
        }

        return false
    }

    async canDeleteUser(user, context) {
        await this.ensureContext(user, context, [ 'user' ])

        if ( user.id === context.user.id ) {
            return true
        }

        const canModerateSite = await this.permissionService.can(user, 'moderate', 'Site')
        if ( canModerateSite === true ) {
            return true
        }

        return false
    }
}
