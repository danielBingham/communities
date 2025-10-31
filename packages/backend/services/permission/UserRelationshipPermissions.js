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

module.exports = class UserRelationshipPermissions {

    constructor(core, permissionService) {
        this.core 

        this.permissionService = permissionService 

        this.userRelationshipDAO = new UserRelationshipDAO(core)
    }

    async ensureContext(user, context, required, optional) { 
        if ( ! ('userId' in context) ) {
            throw new ServiceError('missing-context', `Missing context 'userId'.`)
        }

        if ( ! ('relationId' in context) ) {
            throw new ServiceError('missing-context', `Missing context 'relationId'.`)
        }

        if ( (required.includes('relationship') || optional.includes('relationship')) && ! ('relationship' in context) ) {
            context.relationship = await this.userRelationshipDAO.getUserRelationshipByUserAndRelation(context.userId, context.relationId)
            if ( required.includes('relationship') && context.relationship === undefined ) {
                throw new ServiceError('missing-context', `'relationship' is missing from context.`)
            }
        }
    }

    async canQueryUserRelationship(user, context) {
        await this.ensureContext(user, context, [ 'relationship'])

        // Users can always view their own relationships.
        if ( user.id === context.userId && user.id === context.relationId ) {
            return true
        }

        // You can only view the relationships of your friends.
        if ( context.relationship === null ) {
            return false
        }

        // If one of the users has blocked the other, then neither may query
        // the other's relationships. 
        if ( context.relationship !== null && context.relationship.status === 'blocked' ) {
            return false 
        }

        // UserRelationship.userId is the creator of the relationship.
        // UserRelationship.relationId is the reciever of the relationship request.
        //
        // Either User in the relationship may query the UserRelationships of the other.
        if ( user.id === context.relationship.userId || user.id === context.relationship.relationId) {
            if ( context.relationship.status === 'confirmed' ) {
                return true 
            } else {
                return false
            }
        }

        return false 
    }

    async canViewUserRelationship(user, context) {
        await this.ensureContext(user, context, [ 'relationship'])

        if ( context.relationship === null ) {
            return false
        }

        // Only the blocker can view the blocking relationship.
        if ( context.relationship.status === 'blocked' ) {
            return user.id === context.relationship.userId
        }

        // UserRelationship.userId is the creator of the relationship.
        // UserRelationship.relationId is the reciever of the relationship request.
        //
        // Either User in the relationship may view the UserRelationship.
        if ( user.id === context.relationship.userId || user.id === context.relationship.relationId) {
            return true 
        }

        return false 
    }

    async canCreateUserRelationship(user, context) {
        // Relationship may exist, if, for example, we're blocking.
        await this.ensureContext(user, context, [], [ 'relationship' ])

        // Can't create if already blocked.
        if ( context.relationship !== null && context.relationship.status === 'blocked' ) {
            return false 
        }

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
        await this.ensureContext(user, context, [ 'relationship' ])

        if ( context.relationship === null ) {
            return false
        }

        // A block relationship can't be updated, only deleted.
        if ( context.relationship.status === 'blocked' ) {
            return false
        }

        // UserRelationship.userId is the creator of the relationship.
        // UserRelationship.relationId is the reciever of the relationship request.
        //
        // Only the reciever can accept the request.
        if ( user.id === context.relationship.relationId ) {
            return true
        }

        return false
    }

    async canDeleteUserRelationship(user, context) {
        await this.ensureContext(user, context, [ 'relationship' ])

        // The relationship doesn't exist, so allow the deletion.
        if ( context.relationship === null ) {
            return true 
        }

        // Only the blocker can delete the blocking relationship.
        if ( context.relationship.status === 'blocked' ) {
            return user.id === context.relationship.userId
        }

        // UserRelationship.userId is the creator of the relationship.
        // UserRelationship.relationId is the reciever of the relationship request.
        //
        // Either User in the relationship may delete the UserRelationship.
        if ( user.id === context.relationship.userId || user.id === context.relationship.relationId) {
            return true 
        }

        return false
    }
}
