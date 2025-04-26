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

const uuid = require('uuid')

const ServiceError = require('../errors/ServiceError')

const GroupDAO = require('../daos/GroupDAO')
const PostDAO = require('../daos/PostDAO')

module.exports = class ValidationService {
    constructor(core) {
        this.core = core

        this.groupDAO = new GroupDAO(core)
        this.postDAO = new PostDAO(core)
    }

    has(entity, field) {
        return field in entity && entity[field] !== undefined 
    }

    async validatePost(post, existing) {
        const errors = []

        // Some checks we only perform on post creation and some we only
        // perform when editing a post.
        if ( ! existing ) {

            // Check for the required fields.
            if ( ! this.has(post, 'type') || ! this.has(post, 'userId') || ! this.has(post, 'visibility')) {
                errors.push({
                    type: `missing-field`,
                    log: `Post missing required field.`,
                    message: `You're missing one of the required fields: type, userId, or visibility.`
                })
            }

            // Make sure the post's type is valid.
            if ( this.has(post, 'type') && post.type !== 'group' && post.type !== 'feed' ) {
                errors.push({
                    type: 'invalid-type',
                    log: `Attempt to create a Post with invalid type '${post.type}'.`,
                    message: `The type '${post.type}' is not a valid Post type.`
                })
            }
        } else {

            // Can't edit the type.
            if ( this.has(post, 'type') && post.type !== existing.type ) {
                errors.push({
                    type: 'disallowed-field',
                    log: `Attempt to update the 'type' field of a post.`,
                    message: `You can't update the 'type' of a post.`
                })
            }

            // Can't edit the userId.
            if ( this.has(post, 'userId') && post.userId !== existing.userId) {
                errors.push({
                    type: 'disallowed-field',
                    log: `Attempt to update the 'userId' field of a post.`,
                    message: `You can't update the 'userId' of a post.`
                })
            }

            // Can't edit the groupId.
            if ( this.has(post, 'groupId') && post.groupId !== existing.groupId ) {
                errors.push({
                    type: 'disallowed-field',
                    log: `Attempt to update the 'groupId' field of a post.`,
                    message: `You can't update the 'groupId' of a post.`
                })
            }
        }

        // Post content is limited to 10,000 characters in length.
        if ( this.has(post, 'content') && post.content.length > 10000 ) {
            errors.push({
                type: `too-long`,
                log: `Post too long.`,
                message: `Your post was too long.  Please keep posts to 10,000 characters or les.`
            })
        }

        // Posts can only have a single attachment.
        if ( 
            (this.has(post, 'fileId') && (this.has(post, 'linkPreviewId') || this.has(post, 'sharedPostId')))
            || (this.has(post, 'linkPreviewId') && (this.has(post, 'fileId') || this.has(post, 'sharedPostId')))
            || (this.has(post, 'sharedPostId') && (this.has(post, 'fileId') || this.has(post, 'linkPreviewId')))
        ) {
            errors.push({
                type: 'too-many-attachments',
                log: 'Too many attachments.',
                message: `Your post can only have one attachment: file, link, or share.`
            })
        }

        // TODO Validate that the attachments exist.

        // The visibility of posts in groups must match the visibility of the group.
        if ( this.has(post, 'type') && post.type === 'group' ) {
            if ( ! this.has(post, 'groupId') ) {
                errors.push({
                    type: 'missing-field',
                    log: 'Attempt to make a Group post without a groupId.',
                    message: `You can't post to a Group without including a groupId.`
                })
            }

            const group = this.groupDAO.getGroupById(post.groupId)

            if ( group === null ) {
                errors.push({
                    type: 'no-group',
                    log: `Attempt to post to a Group(${post.groupId}) that doesn't exist.`,
                    message: `You can't post to a group that doesn't exist.`
                })
            }

            if ( group.type === 'open' && post.visibility === 'private' ) {
                errors.push({
                    type: 'wrong-visibility',
                    log: `Attempt to make a private Post to an Open Group.`,
                    message: `You can't make a private Post to an Open Group.`
                })
            }

            if ( (group.type === 'private' || group.type === 'hidden') && post.visibility === 'public' ) {
                errors.push({
                    type: 'wrong-visibility',
                    log: `Attempt to make a public Post to a private or hidden Group.`,
                    message: `You can't make a public Post to a private or hidden Group.`
                })
            }
        }

        // Users aren't allowed to update the activity.
        if ( this.has(post, 'activity') ) {
            errors.push({
                type: 'disallowed-field',
                log: `Attempt to set a Post's activity.`,
                message: `You aren't allowed to set the Post's activity.`
            })
        }

        return errors
    }

    async validateUser(user, existing, type) {
        const errors = []

        // ================== Validate Field Precense =========================
        // Before we validate the content of the fields, we're going to validate
        // whether they can be set or changed at all.

        // These are fields the user is never allowed to set.
        const alwaysDisallowedFields = [
            'status', 'permissions', 'invitations', 'createdDate', 'updatedDate'
        ]

        for(const disallowedField of alwaysDisallowedFields ) {
            if ( this.has(user, disallowedField) ) {
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

        // The user is being created.
        if ( ! existing ) {

            // The user is being invited.  Only email is required or allowed.
            if ( type === 'invitation' || type === 'reinvitation' ) {
                const disallowedFields = [
                    'fileId', 'name', 'username', 'password', 'settings', 'notices', 'about', 'location'
                ]

                for(const disallowedField of disallowedFields ) {
                    if ( this.has(user, disallowedField) ) {
                        errors.push({
                            type: `${disallowedField}:not-allowed`,
                            log: `${disallowedField} is not allowed when inviting a user.`,
                            message: `You may not set '${disallowedField}' for a user you are inviting.`
                        })
                    }
                }

                if ( ! this.has(user, 'email') || user.email === null ) {
                    errors.push({
                        type: `email:missing`,
                        log: `Attempt to invite a user without an email.`,
                        message: `You cannot invite a user without an email.`
                    })
                }
            } 

            else if ( type === 'registration' ) {
                // Some fields we don't allow the user to set on registration,
                // though they may be allowed to edit them later.
                const disallowedFields = [ 'settings', 'notices' ]

                for(const disallowedField of disallowedFields ) {
                    if ( this.has(user, disallowedField) ) {
                        errors.push({
                            type: `${disallowedField}:not-allowed`,
                            log: `${disallowedField} is not allowed when registering.`,
                            message: `You may not set '${disallowedField}' when registering.`
                        })
                    }
                }

                const requiredFields = [
                    'email', 'password', 'name', 'username'
                ]

                for(const requiredField of requiredFields) {
                    if ( ! this.has(user, requiredField) || user[requiredField] === null ) {
                        errors.push({
                            type: `${requiredField}:missing`,
                            log: `${requiredField} is required to register.`,
                            message: `${requiredField} is required to register.`
                        })
                    }
                }
            } 

            else {
                throw new ServiceError('invalid-type',
                    `Attempt to validate a user without a type set.  We don't know what is and isn't allowed.`)
            }
        } 
        // In this case they are editing.
        else {

            if ( ! this.has(user, 'id') || user.id === null ) {
                errors.push({
                    type: `id:missing`,
                    log: `id is required to edit a user.`,
                    message: `id is required.`
                })
                return errors
            }

            if ( user.id !== existing.id ) {
                throw new ServiceError('invalid-id',
                    `Attempting to edit the worng user.`)
            }

            if ( type === 'invitation-acceptance' ) {

                // Some fields we don't allow the user to set on registration,
                // though they may be allowed to edit them later.
                const disallowedFields = [ 'settings', 'notices' ]

                for(const disallowedField of disallowedFields ) {
                    if ( this.has(user, disallowedField) ) {
                        errors.push({
                            type: `${disallowedField}:not-allowed`,
                            log: `${disallowedField} is not allowed when accepting an invitation.`,
                            message: `You may not set '${disallowedField}' when accepting an invitation.`
                        })
                    }
                }

                const requiredFields = [
                    'email', 'password', 'name', 'username'
                ]

                for(const requiredField of requiredFields) {
                    if ( ! this.has(user, requiredField) ) {
                        errors.push({
                            type: `${requiredField}:missing`,
                            log: `${requiredField} is required.`,
                            message: `${requiredField} is required.`
                        })
                    }
                }

            } else if ( type === 'password-reset' ) {

                // If we're reseting our password, the only field we're allowed
                // to change is the password field.
                const disallowedFields = [ 'settings', 'notices', 'email', 'name', 'username' ]

                for(const disallowedField of disallowedFields ) {
                    if ( this.has(user, disallowedField) ) {
                        errors.push({
                            type: `${disallowedField}:not-allowed`,
                            log: `${disallowedField} is not allowed when resetting password.`,
                            message: `You may not set '${disallowedField}' when resetting password.`
                        })
                    }
                }

                const requiredFields = [ 'id', 'password' ]

                for(const requiredField of requiredFields) {
                    if ( ! this.has(user, requiredField) ) {
                        errors.push({
                            type: `${requiredField}:missing`,
                            log: `${requiredField} is required.`,
                            message: `${requiredField} is required.`
                        })
                    }
                }


            } else if ( type === 'authenticated-edit' || type === 'admin-edit' ) {
                // With password authentication, they are allowed to change any
                // of the editable fields and not required to change any of
                // them.  `username` is not editable and can only be set at
                // user creation.
                const disallowedFields = [ 'username' ]

                for(const disallowedField of disallowedFields ) {
                    if ( this.has(user, disallowedField) ) {
                        errors.push({
                            type: `${disallowedField}:not-allowed`,
                            log: `Editting ${disallowedField} is not allowed.`,
                            message: `You may not edit '${disallowedField}'.`
                        })
                    }
                }
            } else if ( type === 'edit' ) {
                // With out authentication they are only barred from chaning username, email, or password.
                const disallowedFields = [ 'email', 'password', 'username' ]

                for(const disallowedField of disallowedFields ) {
                    if ( this.has(user, disallowedField) ) {
                        errors.push({
                            type: `${disallowedField}:not-allowed`,
                            log: `Editting ${disallowedField} is not allowed without reauthenticating.`,
                            message: `You may not edit '${disallowedField}' without reauthenticating.`
                        })
                    }
                }

            } else {
                throw new ServiceError('invalid-type',
                    `Attempt to validate a user without a type set.  We don't know what is and isn't allowed.`)
            }
        }

        // If we have invalid fields, don't validate any further.  Just go
        // ahead and return.
        if ( errors.length > 0 ) {
            return errors
        }

        // ================== Validate Field Content ==========================
        // If we get there, the fields that are present may be set or updated.
        // So now we need to make sure the values they are being set to are
        // valid.
        
        if ( this.has(user, 'email') ) {
            if ( user.email === null ) {
                errors.push({
                    type: `email:missing`,
                    log: `Email set to null.`,
                    message: `You cannot set your email to null.  Please include a valid email.`
                })
            } else if ( typeof user.email !== 'string' ) {
                errors.push({
                    type: 'email:invalid-type',
                    log: `Email is an invalid type: ${typeof user.email}`,
                    message: `Your email must be a string.`
                })
            } else {
                if ( user.email.length > 512 ) {
                    errors.push({
                        type: 'email:too-long',
                        log: `Email is too long: ${user.email.length}`,
                        message: `Your email is too long. We can only accept emails less than 512 characters.`
                    })
                }

                if ( ! user.email.includes('@') ) {
                    errors.push({
                        type: 'email:invalid',
                        log: `Invalid email: ${user.email}`,
                        message: `Your email is not valid.  Please provide a valid email.`
                    })
                }

                // If they are setting or changing their email, we need to make
                // sure the email is not in use.
                if ( ! existing || user.email !== existing.email ) {
                    const existingEmailResults = await this.core.database.query(`
                        SELECT id, email FROM users WHERE email = $1
                    `, [ user.email ])

                    if ( existingEmailResults.rows.length > 0 && user.id !== existingEmailResults.rows[0].id ) {
                        errors.push({
                            type: 'email:conflict',
                            log: `Email already in use by User(${existingEmailResults.rows[0].id})`,
                            message: `That email is already in use by another user.`
                        })
                    }
                }
            }
        }

        if ( this.has(user, 'name') ) {
            if ( user.name === null ) {
                errors.push({
                    type: 'name:missing',
                    log: `Name is set to null.`,
                    message: `You cannot set your name to null.`
                })
            } else if ( typeof user.name !== 'string' ) {
                errors.push({
                    type: 'name:invalid-type',
                    log: `Name is an invalid type: ${typeof user.name}`,
                    message: `Your name must be a string.`
                })
            } else {
                if ( user.name.length > 512 ) {
                    errors.push({
                        type: 'name:too-long',
                        log: `Name is too long: ${user.name.length}`,
                        message: `We can only accept names up to 512 characters.  Please use a shorter form of your name.`
                    })
                }
            }
        }

        if ( this.has(user, 'username') ) {
            if ( user.username === null ) {
                errors.push({
                    type: 'username:missing',
                    log: `Username is set to null.`,
                    message: `You cannot set your username to null.`
                })
            } else if ( typeof user.username !== 'string' ) {
                errors.push({
                    type: 'username:invalid-type',
                    log: `Username is an invalid type: ${typeof user.username}`,
                    message: `Username must be a string.`
                })
            } else {
                if ( user.username.length > 512 ) {
                    errors.push({
                        type: 'username:too-long',
                        log: `Username is too long.`,
                        message: `We can only accept usernames up to 512 characters. Please choose a shorter username.`
                    })
                }

                if ( user.username.match(/^[a-zA-Z0-9\.\-_]+$/) === null ) {
                    errors.push({
                        type: 'username:invalid',
                        log: `Username is invalid.`,
                        message: `Username's may only contain letters, numbers, '.', '-', or '_'.`
                    })
                }

                if ( ! existing || existing.username !== user.username ) {
                    const existingUsernameResults = await this.core.database.query(`
                        SELECT id, username FROM users WHERE username=$1
                    `, [ user.username ])

                    if ( existingUsernameResults.rows.length > 0 && existingUsernameResults.rows[0].id !== user.id ) {
                        errors.push({
                            type: 'username:conflict',
                            log: `Username is in use.`,
                            message: `That username is already in use.  Please choose another.`
                        })
                    }
                }
            }
        }

        if ( this.has(user, 'password') ) {
            if ( user.password === null ) {
                errors.push({
                    type: 'password:missing',
                    log: `Password is set to null.`,
                    message: `You cannot set your password to null.`
                })
            } else if ( typeof user.password !== 'string' ) {
                errors.push({
                    type: 'password:invalid-type',
                    log: `Password is an invalid type: ${typeof user.password}`,
                    message: `Password must be a string.`
                })
            } else {
                if ( user.password.length < 12 ) {
                    errors.push({
                        type: 'password:too-short',
                        log: `Password is too short.`,
                        message: `Your password is too short.  Please choose a password at least 12 characters in length.`
                    })
                }

                if ( user.password.length > 256 ) {
                    errors.push({
                        type: 'password:too-long',
                        log: `Password is too long.`,
                        message: `Your password is too long.  Please choose a password less than 256 characters in length.`
                    })
                }
            }
        }

        if ( this.has(user, 'about') ) {
            if ( user.about === null ) {
                errors.push({
                    type: 'about:missing',
                    log: `About is set to null.`,
                    message: `You cannot set about to null.`
                })
            } else if ( typeof user.about !== 'string' ) {
                errors.push({
                    type: 'about:invalid-type',
                    log: `About is an invalid type: ${typeof user.about}`,
                    message: `Your 'about' must be a string.`
                })
            } else {
                if ( user.about.length > 1024) {
                    errors.push({
                        type: 'about:too-long',
                        log: `About is too long.`,
                        message: `Your 'about' is too long.  Please limit it to 1024 characters.`
                    })
                }
            }
        }

        if ( this.has(user, 'fileId' ) ) {
            // FileId may be null.
            if ( user.fileId !== null && ! uuid.validate(user.fileId) ) {
                errors.push({
                    type: 'fileId:invalid',
                    log: `The 'fileId' must be a valid UUID.`,
                    message: `The 'fileId' you have for your profile picture must be either 'null' or a valid UUID.`
                })
            }
        }

        return errors
    }
}
