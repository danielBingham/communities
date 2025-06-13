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

const UserRelationshipDAO = require('../../daos/UserRelationshipDAO')

const { util } = require('@communities/shared')

const ServiceError = require('../../errors/ServiceError')

module.exports = class GroupMemberPermissions {

    constructor(core, permissionService) {
        this.core 

        this.permissionService = permissionService 

        this.userRelationshipDAO = new UserRelationshipDAO(core)
    }

    async ensureContext(user, context, required, optional) { }

    async canViewUserRelationship(user, context) {
        // UserRelationship.userId is the creator of the relationship.
        // UserRelationship.relationId is the reciever of the relationship request.
        //
        // Either User in the relationship may delete the UserRelationship.
        if ( user.id === context.userId || user.id === context.relationId) {
            return true 
        }

        return false 
    }

    async canCreateUserRelationship(user, context) {
        // UserRelationship.userId is the creator of the relationship.
        // UserRelationship.relationId is the reciever of the relationship request.
        //
        // Only the creator can... create the request...
        if ( user.id === context.userId ) {
            return true 
        }
        
        return false 
    }

    async canUpdateUserRelationship(user, context) {
        // UserRelationship.userId is the creator of the relationship.
        // UserRelationship.relationId is the reciever of the relationship request.
        //
        // Only the reciever can accept the request.
        if ( user.id === context.relationId ) {
            return true
        }

        return false
    }

    async canDeleteUserRelationship(user, context) {
        // UserRelationship.userId is the creator of the relationship.
        // UserRelationship.relationId is the reciever of the relationship request.
        //
        // Either User in the relationship may delete the UserRelationship.
        if ( user.id === context.userId || user.id === context.relationId) {
            return true 
        }

        return false
    }
}
