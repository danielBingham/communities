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

const { util, validation } = require('@communities/shared')

const GroupDAO = require('../../daos/GroupDAO')
const GroupMemberDAO = require('../../daos/GroupMemberDAO')

const PermissionService = require('../PermissionService')

const ServiceError = require('../../errors/ServiceError')

module.exports = class GroupMemberValidation {
    constructor(core, validationService) {
        this.core = core
        this.validationService = validationService

        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)

        this.permissionService = new PermissionService(core)
    }

    async validateGroupMember(currentUser, groupMember, existing) {
        const errors = []

        // ================== Validate Field Presence =========================
        // Before we validate the content of the fields, we're going to validate
        // whether they can be set or changed at all.

        // These are fields the user is never allowed to set.
        const alwaysDisallowedFields = [
            'createdDate', 'updatedDate', 'entranceAnswers'
        ]

        for(const disallowedField of alwaysDisallowedFields ) {
            if ( util.objectHas(groupMember, disallowedField) ) {
                errors.push({
                    type: `${disallowedField}:not-allowed`,
                    log: `${disallowedField} is not allowed.`,
                    message: `You may not set '${disallowedField}'.`
                })
            }
        }

        // If we have invalid fields set, then we don't need to go any further.
        if ( errors.length > 0 ) {
            return errors
        }

        // We're creating a GroupMember.
        if ( existing === null || existing === undefined ) {
            const requiredFields = [
                'userId', 'groupId', 'status' 
                
            ]

            for(const requiredField of requiredFields) {
                if ( ! util.objectHas(groupMember, requiredField) || groupMember[requiredField] === null ) {
                    errors.push({
                        type: `${requiredField}:missing`,
                        log: `${requiredField} is required.`,
                        message: `${requiredField} is required.`
                    })
                }
            }
        } 
        // We're editing a GroupMember.
        else {
            if ( util.objectHas(groupMember, 'id') && groupMember.id !== existing.id ) {
                throw new ServiceError('entity-mismatch',
                    `Wrong 'existing' entity.`)
            }

            const disallowedFields = [
                'groupId', 'userId' 
            ]

            for(const disallowedField of disallowedFields) {
                if ( util.objectHas(groupMember, disallowedField) && groupMember[disallowedField] !== existing[disallowedField]) {
                    errors.push({
                        type: `${disallowedField}:not-allowed`,
                        log: `${disallowedField} may not be updated.`,
                        message: `${disallowedField} may not be updated.`
                    })
                }
            }
        }

        // If we have invalid fields set, then we don't need to go any further.
        if ( errors.length > 0 ) {
            return errors
        }

        // Do basic validation the fields.
        const validationErrors = validation.GroupMember.validate(groupMember)
        if ( validationErrors.all.length > 0 ) {
            errors.push(...validationErrors.all)
        }

        // If we have invalid fields set, then we don't need to go any further.
        if ( errors.length > 0 ) {
            return errors
        }

        if ( util.objectHas(groupMember, 'userId' ) ) {
            const userResults = await this.core.database.query(`
                SELECT id FROM users WHERE id = $1
            `, [ groupMember.userId ])

            if ( userResults.rows.length <= 0 || userResults.rows[0].id !== groupMember.userId) {
                errors.push({
                    type: `userId:not-found`,
                    log: `User(${groupMember.userId}) not found.`,
                    message: `User not found for that userId.`
                })
            }
        }

        if ( util.objectHas(groupMember, 'groupId') ) {
            const groupResults = await this.core.database.query(`
                SELECT id FROM groups WHERE id = $1
            `, [ groupMember.groupId ])

            if ( groupResults.rows.length <= 0 || groupResults.rows[0].id !== groupMember.groupId ) {
                errors.push({
                    type: `groupId:not-found`,
                    log: `Group(${groupMember.groupId}) not found.`,
                    message: `Group not found for that groupId.`
                })
            } 
        }

        if ( errors.length > 0 ) {
            return errors
        }

        // Validate the changes.  Only certain combinations of fields are
        // allowed.
        if ( existing === null || existing === undefined ) {
            // ============== Creating a new member. ==========================

            const group = await this.groupDAO.getGroupById(groupMember.groupId)
            const userMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(group.id, currentUser.id)

            let parentGroup = null
            let parentMember = null
            if ( group.parentId ) {
                parentGroup = await this.groupDAO.getGroupById(group.parentId)
                parentMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(group.parentId, currentUser.id)
            }

            const context = {
                group: group,
                userMember: userMember,
                parentGroup: parentGroup,
                parentMember: parentMember
            }

            const canModerateGroup = await this.permissionService.can(currentUser, 'moderate', 'Group', context)
            const canAdminGroup = await this.permissionService.can(currentUser, 'admin', 'Group', context)

            if ( group.type === 'open' ) {

                // If you are an admin on a parent group, you can add yourself
                // to the child groups as an admin.
                //
                // Role will be 'admin', status will be 'member', and the user
                // can only add themselves.
                if ( userMember === null && parentMember !== null && canAdminGroup === true ) {
                    if ( groupMember.role !== 'admin' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `Parent Group admin attempting to add themselves to a group with invalid role '${groupMember.role}'.`,
                            message: `You my not add yourself with role '${groupMember.role}'.  You are an admin on a parent group, you can only add your self as an 'admin'.`
                        })
                    }

                    if ( groupMember.status !== 'member' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `User attempting to add themselves to a group with invalid status '${groupMember.status}'.`,
                            message: `You may not add yourself with status '${groupMember.status}'.  You may only add yourself as a 'member'.`
                        })
                    }

                    if ( groupMember.userId !== currentUser.id ) {
                        errors.push({
                            type: `userId:invalid`,
                            log: `Non-member user attempting to add User(${groupMember.userId}) to Group(${groupMember.groupId}).`,
                            message: `You may only request access to a private Group for yourself.`
                        })
                    }

                }

                // Non members can add themselves in which case role is
                // 'member' and status is 'member'.
                else if ( userMember === null ) {

                    if ( groupMember.role !== 'member' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `User(${currentUser.id}) attempted to create GroupMember with role '${groupMember.role}'.`,
                            message: `You may not add yourself with role '${groupMember.role}'.`
                        })
                    }

                    if ( groupMember.status !== 'member' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `User attempting to add themselves to a Group with a invalid status '${groupMember.status}'.`,
                            message: `You may only add yourself to an open group, you may not invite yourself.`
                        })
                    }

                    if ( groupMember.userId !== currentUser.id ) {
                        errors.push({
                            type: `userId:invalid`,
                            log: `Non-member user attempting to add User(${groupMember.userId}) to Open Group(${groupMember.groupId}).`,
                            message: `You may only add yourself to an open Group.`
                        })
                    }
                } 

                // Moderators can invite users in which case role is 'member'
                // and status is 'pending-invited'.
                else if ( userMember !== null && canModerateGroup === true ) {
                    
                    if ( groupMember.role !== 'member' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `Attempt to add a user to a Group with invalid role '${groupMember.role}'.`,
                            message: `You may only invite members to a group.`
                        })
                    }

                    if ( groupMember.status !== 'pending-invited' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `Attempt to add a user to a Group with invalid status '${groupMember.status}'.`,
                            message: `You may only invite members to a group.`
                        })
                    }
                } 

                // Otherwise, it's an existing user who doesn't have moderator
                // permissions. We shouldn't ever get here.  We should do
                // permissions checks first.
                else {
                    throw new ServiceError('invalid-permissions',
                        `Non-moderator member attempting to create a new member.`)
                }
            } else if ( group.type === 'private' ) {

                // If you can admin a group that you are not a member
                // of, it's because you're an admin of a parent or
                // ancestor group.  You can only be added as an admin!
                if ( userMember === null && parentMember !== null && canAdminGroup === true ) {
                    if ( groupMember.role !== 'admin' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `Parent Group admin attempting to add themselves to a group with invalid role '${groupMember.role}'.`,
                            message: `You my not add yourself with role '${groupMember.role}'.  You are an admin on a parent group, you can only add your self as an 'admin'.`
                        })
                    }

                    if ( groupMember.status !== 'member' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `User attempting to add themselves to a group with invalid status '${groupMember.status}'.`,
                            message: `You may not add yourself with status '${groupMember.status}'.  You may only add yourself as a 'member'.`
                        })
                    }

                    if ( groupMember.userId !== currentUser.id ) {
                        errors.push({
                            type: `userId:invalid`,
                            log: `Non-member user attempting to add User(${groupMember.userId}) to Group(${groupMember.groupId}).`,
                            message: `You may only request access to a private Group for yourself.`
                        })
                    }
                }

                // Non-members can request access in which case role is
                // 'member' and status is 'pending-requested'.
                else if ( userMember === null ) {
                    if ( groupMember.role !== 'member' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `User attempting to add themselves to a group with invalid role '${groupMember.role}'.`,
                            message: `You my not add yourself with role '${groupMember.role}'.`
                        })
                    } 

                    if ( groupMember.status !== 'pending-requested' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `User attempting to add themselves to a group with invalid status '${groupMember.status}'.`,
                            message: `You may not add yourself with status '${groupMember.status}'.`
                        })
                    }

                    if ( groupMember.userId !== currentUser.id ) {
                        errors.push({
                            type: `userId:invalid`,
                            log: `Non-member user attempting to add User(${groupMember.userId}) to Group(${groupMember.groupId}).`,
                            message: `You may only request access to a private Group for yourself.`
                        })
                    }
                } 

                // Moderators can invite users in which case role is 'member' and status is 'pending-invited'.
                else if ( userMember !== null && canModerateGroup === true ) {
                    
                    if ( groupMember.role !== 'member' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `Moderator attempting to add a member with invalid role '${groupMember.role}'.`,
                            message: `You may not add a member with role '${groupMember.role}'.`
                        })
                    }

                    if ( groupMember.status !== 'pending-invited' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `Moderator attempting to add a member with invalid status '${groupMember.status}'.`,
                            message: `You may not add a member with status '${groupMember.status}'.`
                        })
                    }
                } 

                // We shouldn't be able to get here.
                else {
                    throw new ServiceError('invalid-permissions',
                        `Non-moderator member attempting to create a new member in a private Group.`)
                }

            } else if ( group.type === 'hidden' ) {

                // If the user isn't a member of this group, but is a member of
                // the parent group and can admin this group, then they can add
                // themselves as an admin.
                //
                // Role will be 'admin' and status 'member'.  They may only add
                // themselves.
                if ( userMember === null && parentMember !== null && canAdminGroup === true ) {
                    if ( groupMember.role !== 'admin' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `Parent Group admin attempting to add themselves to a group with invalid role '${groupMember.role}'.`,
                            message: `You my not add yourself with role '${groupMember.role}'. You are an admin on a parent group, you can only add your self as an 'admin'.`
                        })
                    }

                    if ( groupMember.status !== 'member' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `User attempting to add themselves to a group with invalid status '${groupMember.status}'.`,
                            message: `You may not add yourself with status '${groupMember.status}'.  You may only add yourself as a 'member'.`
                        })
                    }

                    if ( groupMember.userId !== currentUser.id ) {
                        errors.push({
                            type: `userId:invalid`,
                            log: `Non-member user attempting to add User(${groupMember.userId}) to Group(${groupMember.groupId}).`,
                            message: `You may only request access to a private Group for yourself.`
                        })
                    }
                }

                // If the user is a group moderator, then they can invite
                // people to the group, in which case role is 'member' and
                // status is 'pending-invited'.
                else if ( userMember !== null && canModerateGroup === true ) {
                    if ( groupMember.role !== 'member' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `Moderator attempting to add a member with invalid role '${groupMember.role}'.`,
                            message: `You may not add a member with role '${groupMember.role}'.`
                        })
                    }

                    if ( groupMember.status !== 'pending-invited' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `Moderator attempting to add a member with invalid status '${groupMember.status}'.`,
                            message: `You may not add a member with status '${groupMember.status}'.`
                        })
                    }
                } 

                // We shouldn't be able to get here.
                else {
                    throw new ServiceError('invalid-permissions',
                        `Non-moderator member attempting to create a new member in a hidden Group.`)
                }
            } else if ( group.type === 'private-open' ) {

                // If you are an admin of the parent group and not a member of
                // this group, you may add yourself to it as an admin.
                //
                // Role will be 'admin', status will be 'member' and users can
                // only add themselves.
                if ( userMember === null && parentMember !== null && canAdminGroup === true ) {
                    if ( groupMember.role !== 'admin' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `Parent Group admin attempting to add themselves to a group with invalid role '${groupMember.role}'.`,
                            message: `You my not add yourself with role '${groupMember.role}'.  You are an admin on a parent group, you can only add your self as an 'admin'.`
                        })
                    }

                    if ( groupMember.status !== 'member' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `User attempting to add themselves to a group with invalid status '${groupMember.status}'.`,
                            message: `You may not add yourself with status '${groupMember.status}'.  You may only add yourself as a 'member'.`
                        })
                    }

                    if ( groupMember.userId !== currentUser.id ) {
                        errors.push({
                            type: `userId:invalid`,
                            log: `Non-member user attempting to add User(${groupMember.userId}) to Group(${groupMember.groupId}).`,
                            message: `You may only request access to a private Group for yourself.`
                        })
                    }
                }

                // Non-members of this group who are members of the parent
                // group can add themselves. 
                //
                // In that case, role is 'member' and status is 'member'.
                else if ( userMember === null && parentMember !== null ) {
                    if ( groupMember.role !== 'member' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `User(${currentUser.id}) attempted to create GroupMember with role '${groupMember.role}'.`,
                            message: `You may not add yourself with role '${groupMember.role}'.`
                        })
                    }

                    if ( groupMember.status !== 'member' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `User attempting to add themselves to a Group with a invalid status '${groupMember.status}'.`,
                            message: `You may only add yourself to an open group, you may not invite yourself.`
                        })
                    }

                    if ( groupMember.userId !== currentUser.id ) {
                        errors.push({
                            type: `userId:invalid`,
                            log: `Non-member user attempting to add User(${groupMember.userId}) to Open Group(${groupMember.groupId}).`,
                            message: `You may only add yourself to an open Group.`
                        })
                    }
                } 

                // Non-members of this group who are also not members of the
                // parent group can request access.
                //
                // In that case, role will be 'member' and status
                // 'pending-requested'.
                else if ( userMember === null && parentMember === null ) {
                    if ( groupMember.role !== 'member' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `User attempting to add themselves to a group with invalid role '${groupMember.role}'.`,
                            message: `You my not add yourself with role '${groupMember.role}'.`
                        })
                    } 

                    if ( groupMember.status !== 'pending-requested' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `User attempting to add themselves to a group with invalid status '${groupMember.status}'.`,
                            message: `You may not add yourself with status '${groupMember.status}'.`
                        })
                    }

                    if ( groupMember.userId !== currentUser.id ) {
                        errors.push({
                            type: `userId:invalid`,
                            log: `Non-member user attempting to add User(${groupMember.userId}) to Group(${groupMember.groupId}).`,
                            message: `You may only request access to a private Group for yourself.`
                        })
                    }

                } 

                // Moderators can invite users in which case role is 'member'
                // and status is 'pending-invited'.
                else if ( userMember !== null && canModerateGroup === true ) {
                    
                    if ( groupMember.role !== 'member' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `Attempt to add a user to a Group with invalid role '${groupMember.role}'.`,
                            message: `You may only invite members to a group.`
                        })
                    }

                    if ( groupMember.status !== 'pending-invited' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `Attempt to add a user to a Group with invalid status '${groupMember.status}'.`,
                            message: `You may only invite members to a group.`
                        })
                    }
                } 

                // Otherwise, it's an existing user who doesn't have moderator permissions.
                // We shouldn't ever get here.  We should do permissions checks first.
                else {
                    throw new ServiceError('invalid-permissions',
                        `Non-moderator member attempting to create a new member.`)
                }

            } else if ( group.type === 'hidden-open' ) {

                // If you are an admin of the parent group and not a member of
                // this group, you may add yourself to it as an admin.
                //
                // Role will be 'admin', status will be 'member' and users can
                // only add themselves.
                if ( userMember === null && parentMember !== null && canAdminGroup === true ) {
                    if ( groupMember.role !== 'admin' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `Parent Group admin attempting to add themselves to a group with invalid role '${groupMember.role}'.`,
                            message: `You my not add yourself with role '${groupMember.role}'.  You are an admin on a parent group, you can only add your self as an 'admin'.`
                        })
                    }

                    if ( groupMember.status !== 'member' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `User attempting to add themselves to a group with invalid status '${groupMember.status}'.`,
                            message: `You may not add yourself with status '${groupMember.status}'.  You may only add yourself as a 'member'.`
                        })
                    }

                    if ( groupMember.userId !== currentUser.id ) {
                        errors.push({
                            type: `userId:invalid`,
                            log: `Non-member user attempting to add User(${groupMember.userId}) to Group(${groupMember.groupId}).`,
                            message: `You may only request access to a private Group for yourself.`
                        })
                    }
                }

                // Non-members of this group who are members of the parent
                // group can add themselves. 
                //
                // In that case, role is 'member' and status is 'member'.
                else if ( userMember === null && parentMember !== null ) {
                    if ( groupMember.role !== 'member' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `User(${currentUser.id}) attempted to create GroupMember with role '${groupMember.role}'.`,
                            message: `You may not add yourself with role '${groupMember.role}'.`
                        })
                    }

                    if ( groupMember.status !== 'member' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `User attempting to add themselves to a Group with a invalid status '${groupMember.status}'.`,
                            message: `You may only add yourself to an open group, you may not invite yourself.`
                        })
                    }

                    if ( groupMember.userId !== currentUser.id ) {
                        errors.push({
                            type: `userId:invalid`,
                            log: `Non-member user attempting to add User(${groupMember.userId}) to Open Group(${groupMember.groupId}).`,
                            message: `You may only add yourself to an open Group.`
                        })
                    }
                } 

                // Moderators can invite users in which case role is 'member'
                // and status is 'pending-invited'.
                else if ( userMember !== null && canModerateGroup === true ) {
                    
                    if ( groupMember.role !== 'member' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `Attempt to add a user to a Group with invalid role '${groupMember.role}'.`,
                            message: `You may only invite members to a group.`
                        })
                    }

                    if ( groupMember.status !== 'pending-invited' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `Attempt to add a user to a Group with invalid status '${groupMember.status}'.`,
                            message: `You may only invite members to a group.`
                        })
                    }
                } 

                // Otherwise, it's an existing user who doesn't have moderator permissions.
                // We shouldn't ever get here.  We should do permissions checks first.
                else {
                    throw new ServiceError('invalid-permissions',
                        `Non-moderator member attempting to create a new member.`)
                }
            } else if ( group.type === 'hidden-private' ) {

                // If you are an admin of the parent group and not a member of
                // this group, you may add yourself to it as an admin.
                //
                // Role will be 'admin', status will be 'member' and users can
                // only add themselves.
                if ( userMember === null && parentMember !== null && canAdminGroup === true ) {
                    if ( groupMember.role !== 'admin' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `Parent Group admin attempting to add themselves to a group with invalid role '${groupMember.role}'.`,
                            message: `You my not add yourself with role '${groupMember.role}'.  You are an admin on a parent group, you can only add your self as an 'admin'.`
                        })
                    }

                    if ( groupMember.status !== 'member' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `User attempting to add themselves to a group with invalid status '${groupMember.status}'.`,
                            message: `You may not add yourself with status '${groupMember.status}'.  You may only add yourself as a 'member'.`
                        })
                    }

                    if ( groupMember.userId !== currentUser.id ) {
                        errors.push({
                            type: `userId:invalid`,
                            log: `Non-member user attempting to add User(${groupMember.userId}) to Group(${groupMember.groupId}).`,
                            message: `You may only request access to a private Group for yourself.`
                        })
                    }
                }

                // Non-members who are members of the parent group can request
                // access in which case role is 'member' and status is
                // 'pending-requested'.
                else if ( userMember === null && parentMember !== null) {
                    if ( groupMember.role !== 'member' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `User attempting to add themselves to a group with invalid role '${groupMember.role}'.`,
                            message: `You my not add yourself with role '${groupMember.role}'.`
                        })
                    } 

                    if ( groupMember.status !== 'pending-requested' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `User attempting to add themselves to a group with invalid status '${groupMember.status}'.`,
                            message: `You may not add yourself with status '${groupMember.status}'.`
                        })
                    }

                    if ( groupMember.userId !== currentUser.id ) {
                        errors.push({
                            type: `userId:invalid`,
                            log: `Non-member user attempting to add User(${groupMember.userId}) to Group(${groupMember.groupId}).`,
                            message: `You may only request access to a private Group for yourself.`
                        })
                    }
                } 

                // Moderators can invite users in which case role is 'member'
                // and status is 'pending-invited'.
                else if ( userMember !== null && canModerateGroup === true ) {
                    
                    if ( groupMember.role !== 'member' ) {
                        errors.push({
                            type: `role:invalid`,
                            log: `Moderator attempting to add a member with invalid role '${groupMember.role}'.`,
                            message: `You may not add a member with role '${groupMember.role}'.`
                        })
                    }

                    if ( groupMember.status !== 'pending-invited' ) {
                        errors.push({
                            type: `status:invalid`,
                            log: `Moderator attempting to add a member with invalid status '${groupMember.status}'.`,
                            message: `You may not add a member with status '${groupMember.status}'.`
                        })
                    }
                } 

                // We shouldn't be able to get here.
                else {
                    throw new ServiceError('invalid-permissions',
                        `Non-moderator member attempting to create a new member in a private Group.`)
                }

            } else {
                throw new ServiceError('invalid-group-type',
                    `Unhandled group type, '${group.type}', encountered.`)

            }
        } else {
            // ============== Editing an existing member. =====================
            const group = await this.groupDAO.getGroupById(existing.groupId)
            const userMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(group.id, currentUser.id)
           
            const canModerateGroup = await this.permissionService.can(currentUser, 'moderate', 'Group', { group: group, userMember: userMember })
            const canAdminGroup = await this.permissionService.can(currentUser, 'admin', 'Group', { group: group, userMember: userMember })
            
            // ============== Validate Status changes. ========================
            if ( util.objectHas(groupMember, 'status') ) { 
                if ( existing.status === 'pending-invited' ) {
                    if ( groupMember.status !== 'pending-invited') {
                        if ( groupMember.status !== 'member' ) {
                            errors.push({
                                type: `status:invalid`,
                                log: `Invited users may only change their status to 'member'.`,
                                message: `Invited users may only change their status to 'member'.`
                            })
                        }

                        if ( currentUser.id !== groupMember.userId ) {
                            errors.push({
                                type: `status:invalid`,
                                log: `Only invited users may change their status.`,
                                message: `You may not change another user's status.`
                            })
                        }
                    }
                } else if ( existing.status === 'pending-requested' ) {
                    if ( groupMember.status !== 'pending-requested') {
                        if ( groupMember.status !== 'member' && groupMember.status !== 'banned') {
                            errors.push({
                                type: `status:invalid`,
                                log: `May only change status of requesting users to 'member' or 'banned'.`,
                                message: `You may only change the status of requesting users to 'member' or 'banned'.  Delete the member to remove them.`
                            })
                        }

                        if ( canModerateGroup !== true ) {
                            errors.push({
                                type: `status:not-authorized`,
                                log: `Only moderators may accepted requested access to a Group.`,
                                message: `Only Group moderators may accept a user's request for access.`
                            })
                        }
                    }
                } else if ( existing.status === 'member' ) {
                    if ( canModerateGroup !== true && groupMember.status !== 'member') {
                        errors.push({
                            type: 'status:invalid',
                            log: `Cannot change the status of a confirmed member.`,
                            message: `You cannot change the status of a confirmed member.`
                        })
                    } else if ( canModerateGroup === true && groupMember.status !== 'member' ) {
                        if ( groupMember.status !== 'banned' ) {
                            errors.push({
                                type: 'status:invalid',
                                log: `Cannot change the status of a confirmed member expect to ban them.`,
                                message: `You cannot change the status of a confirmed member except to ban them.`
                            })
                        } else if ( groupMember.status === 'banned' && existing.role !== 'member' ) {
                            errors.push({
                                type: 'status:not-authorized',
                                log: `Attempt to ban GroupMember with role '${existing.role}'.  Not authorized.`,
                                message: `You not authorized to ban moderators or admins.`
                            })
                        }
                    }
                } else if ( existing.status === 'banned' ) {
                    if ( canModerateGroup !== true ) {
                        errors.push({
                            type: 'status:not-authorized',
                            log: `Non-moderators may not change the status of a banned member.`,
                            message: `You are not authorized to change members status.`
                        })
                    } else if ( canModerateGroup === true && groupMember.status !== 'member' ) {
                        errors.push({
                            type: 'status:invalid',
                            log: `Invalid status '${groupMember.status}'.`,
                            message: `Invalid status '${groupMember.status}'.`
                        })
                    }
                } else {
                    // If we add a new status and forget to handle it, we want to be yelled at.
                    throw new ServiceError('invalid-status',
                        `Invalid unhandled status '${existing.status}' on existing GroupMember.`)
                }
            }

            // ============== Validate Role changes. ========================== 
         
            if (  util.objectHas(groupMember, 'role') ) {
                if ( existing.role === 'member' ) {
                    if ( groupMember.role !== 'member') {
                        if ( groupMember.role !== 'moderator' && groupMember.role !== 'admin' ) {
                            errors.push({
                                type: `role:invalid`,
                                log: `Member roles may only be changed to 'moderator' or 'admin.`,
                                message: `You may only change a 'member' to a 'moderator' or an 'admin'.`
                            })
                        }

                        if ( canAdminGroup !== true ) {
                            errors.push({
                                type: `role:not-authorized`,
                                log: `User not authorized to update a GroupMember's role.`,
                                message: `You are not authorized to update a GroupMember's role.`
                            })
                        }
                    }
                } else if ( existing.role === 'moderator' ) {
                    if ( groupMember.role !== 'moderator') {
                        if ( groupMember.role !== 'member' && groupMember.role !== 'admin' ) {
                            errors.push({
                                type: `role:invalid`,
                                log: `Moderators may only be demoted to 'member' or promoted to 'admin'.`,
                                message: `Moderators may only be demoted to 'member' or promoted to 'admin'.`
                            })
                        }

                        if ( canAdminGroup !== true && ! (currentUser.id === groupMember.userId && groupMember.role === 'member') ) {
                            errors.push({
                                type: `role:not-authorized`,
                                log: `User not authorized to update a GroupMember's role.`,
                                message: `You are not authorized to update a GroupMember's role.`
                            })
                        }
                    }
                } else if ( existing.role === 'admin' ) {
                    if ( groupMember.role !== 'admin') {
                        errors.push({
                            type: `role:not-authorized`,
                            log: `User not authorized to change an admin's role.`,
                            message: `You are not authorized to change an admin's role.`
                        })
                    }
                } else {
                    // If we add a new role and forget to handle it here, we want to be yelled at.
                    // We shouldn't be able to get here.
                    throw new ServiceError('invalid-role',
                        `Invalid unhandled role '${existing.role}' on existing GroupMember.`)
                }
            }
        }
        
        return errors
    }
}
