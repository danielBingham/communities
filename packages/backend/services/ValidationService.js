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

const { util, validation } = require('@communities/shared')

const ServiceError = require('../errors/ServiceError')

const GroupDAO = require('../daos/GroupDAO')
const PostDAO = require('../daos/PostDAO')

const { isModerator } = require('../lib/admin')

module.exports = class ValidationService {
    constructor(core) {
        this.core = core

        this.groupDAO = new GroupDAO(core)
        this.postDAO = new PostDAO(core)
    }

    has(entity, field) {
        return field in entity && entity[field] !== undefined 
    }

    async validatePost(currentUser, post, existing) {
        const errors = []

        if ( existing !== undefined && existing !== null && existing.id !== post.id ) {
            throw new ServiceError('post-mismatch', 
                `Existing Post(${existing.id}) does not match Post(${post.id}).`)
        }

        // ================== Always Disallowed ===============================
        // There are some fields the user is never allowed to set.  Check those 
        // fields first and return if any of them are set.

        const alwaysDisallowedFields = [ 'activity', 'createdDate', 'updatedDate' ]

        for(const disallowedField of alwaysDisallowedFields ) {
            if ( this.has(post, disallowedField) ) {
                errors.push({
                    type: `${disallowedField}:not-allowed`,
                    log: `${disallowedField} is not allowed.`,
                    message: `You may not set '${disallowedField}'.`
                })
            }
        }

        if ( errors.length > 0 ) {
            return errors
        }

        // ================== Situational Checks ==============================
        // Initial creation and updating each have different sets of fields they
        // require or disallow. Check those next and return if any are set.

        if ( ! existing ) {
            const requiredFields = [ 'type', 'userId', 'visibility']


            for(const requiredField of requiredFields) {
                if ( ! this.has(post, requiredField) || post[requiredField] === null ) {
                    errors.push({
                        type: `${requiredField}:missing`,
                        log: `${requiredField} is required.`,
                        message: `${requiredField} is required.`
                    })
                }
            }


        } 

        // We're editing a post.
        else {
            const disallowedFields = [ 'type', 'userId', 'groupId' ]

            for(const disallowedField of disallowedFields ) {
                if ( this.has(post, disallowedField) 
                    && post[disallowedField] !== existing[disallowedField] ) 
                {
                    errors.push({
                        type: `${disallowedField}:not-allowed`,
                        log: `Updating ${disallowedField} is not allowed.`,
                        message: `You may not update '${disallowedField}'.`
                    })
                }
            }
        }

        if ( errors.length > 0 ) {
            return errors
        }


        // ================== General Validity Checks =========================
        // Now check each field's validity.

        if ( this.has(post, 'type') ) {
            if ( post.type === null ) {
                errors.push({
                    type: 'type:missing',
                    log: `Post.type is missing.`,
                    message: `You cannot set Post.type to null.`
                })
            } else if ( typeof post.type !== 'string' ) {
                errors.push({
                    type: 'type:invalid-type',
                    log: `Post.type is invalid type: ${typeof post.type}.`,
                    message: `Post.type must be a string.`
                })
            } else {
                // Make sure the post's type is valid.
                if ( post.type !== 'group' && post.type !== 'feed' ) {
                    errors.push({
                        type: 'type:invalid',
                        log: `Attempt to create a Post with invalid type '${post.type}'.`,
                        message: `The type '${post.type}' is not a valid Post type.`
                    })
                }
            }
        }

        if ( this.has(post, 'visibility' ) ) {
            if ( post.visibility === null ) {
                errors.push({
                    type: 'visibility:missing',
                    log: `Post.visibility cannot be 'null'.`,
                    message: `Post.visibility cannot be null.`
                })
            } else if ( typeof post.visibility !== 'string' ) {
                errors.push({
                    type: 'visibility:invalid-type',
                    log: `Post.visibility invalid type: '${typeof post.visibility}'.`,
                    message: `Post.visibility must be a string.`
                })
            } else {
                if ( post.visibility !== 'public' && post.visibility !== 'private' ) {
                    errors.push({
                        type: 'visibility:invalid',
                        log: `Post.visibility invalid value: ${post.visibility}`,
                        message: `Post.visibility must be 'public' or 'private'.`
                    })
                }
            }
        }

        if ( this.has(post, 'userId' ) ) {
            if ( post.userId === null ) {
                errors.push({
                    type: 'userId:missing',
                    log: `Post.userId is missing.`,
                    message: `Post.userId may not be null.`
                })
            } else if ( ! uuid.validate(post.userId) ) {
                errors.push({
                    type: 'userId:invalid',
                    log: `Post.userId must be a valid UUID.`,
                    message: `Post.userId must be a valid UUID.`
                })
            } else {
                const userIdResults = await this.core.database.query(`
                    SELECT id FROM users WHERE id = $1
                `, [ post.userId ])

                if ( userIdResults.rows.length <= 0 ) {
                    errors.push({
                        type: 'userId:not-found',
                        log: `User(${post.userId}) not found.`,
                        message: `We couldn't find a user for Post.userId.`
                    })
                }
            }
        }

        if ( this.has(post, 'fileId') ) {
            // fileId can be null.
            if ( post.fileId !== null ) {
                if ( ! uuid.validate(post.fileId) ) {
                    errors.push({
                        type: 'fileId:invalid',
                        log: `fileId, '${post.fileId}', is not a valid UUID.`,
                        message: `'fileId' must either be 'null' or a valid UUID.`
                    })
                } else {
                    const fileResults = await this.core.database.query(`
                        SELECT id FROM files WHERE id = $1
                    `, [ post.fileId ])

                    if ( fileResults.rows.length <= 0 ) {
                        errors.push({
                            type: 'fileId:not-found',
                            log: `File(${post.fileId}) not found.`,
                            message: `We couldn't find File(${post.fileId}).`
                        })
                    }
                }

                if ( this.has(post, 'linkPreviewId') && post.linkPreviewId !== null ) {
                    errors.push({
                        type: 'fileId:conflict',
                        log: `Cannot have both fileId and linkPreviewId.`,
                        message: `You cannot attach both a link and an image.`
                    })
                }

                if ( this.has(post, 'sharedPostId') && post.sharedPostId !== null ) {
                    errors.push({
                        type: 'fileId:conflict',
                        log: `Cannot have both fileId and sharedPostId.`,
                        message: `You cannot attach both an image and a shared post.`
                    })
                }
            }
        }

        if ( this.has(post, 'linkPreviewId') ) {
            // linkPreviewId can be null.
            if ( post.linkPreviewId !== null ) {
                if ( ! uuid.validate(post.linkPreviewId) ) {
                    errors.push({
                        type: 'linkPreviewId:invalid',
                        log: `Post.linkPreviewId must be null or valid UUID.`,
                        message: `Post.linkPreviewId must be null or valid UUID.`
                    })
                } else {
                    const linkPreviewIdResults = await this.core.database.query(`
                        SELECT id FROM link_previews WHERE id = $1
                    `, [ post.linkPreviewId ])

                    if ( linkPreviewIdResults.rows.length <= 0 ) {
                        errors.push({
                            type: 'linkPreviewId:not-found',
                            log: `LinkPreview(${post.linkPreviewId}) was not found.`,
                            message: `We couldn't find a LinkPreview for that id.`
                        })
                    }

                    if ( this.has(post, 'fileId') && post.fileId !== null ) {
                        errors.push({
                            type: 'linkPreviewId:conflict',
                            log: `Cannot have both linkPreviewId and fileId set.`,
                            message: `You cannot attach both a link and an image.`
                        })
                    }

                    if ( this.has(post, 'sharedPostId') && post.sharedPostId !== null ) {
                        errors.push({
                            type: 'linkPreviewId:conflict',
                            log: `Cannot have both linkPreviewId and sharedPostId.`,
                            message: `You cannot attach both a link and a shared post.`
                        })
                    }
                }
            }
        }

        if ( this.has(post, 'sharedPostId') ) {
            // sharedPostId can be null
            if ( post.sharedPostId !== null ) {
                if ( ! uuid.validate(post.sharedPostId) ) {
                    errors.push({
                        type: 'sharedPostId:invalid',
                        log: `Post.sharedPostId must be null or a valid UUID.`,
                        message: `Post.sharedPostId must be null or a valid UUID.`
                    })
                } else {
                    const sharedPostIdResults = await this.core.database.query(`
                        SELECT id, visibility FROM posts WHERE id = $1
                    `, [ post.sharedPostId ])

                    if ( sharedPostIdResults.rows.length <= 0 ) {
                        errors.push({
                            type: 'sharedPostId:not-found',
                            log: `Post(${post.sharedPostId}) not found.`,
                            message: `We couldn't find the Post you wanted to share.`
                        })
                    } else if ( sharedPostIdResults.rows[0].visibility !== 'public' ) {
                        errors.push({
                            type: 'sharedPostId:invalid',
                            log: `Attempting to share Post(${post.sharedPostId}) which is not public.`,
                            message: `You can only share public Posts.`
                        })
                    }

                    if ( this.has(post, 'fileId') && post.fileId !== null ) {
                        errors.push({
                            type: 'sharedPostId:conflict',
                            log: `Cannot have both sharedPostId and fileId.`,
                            message: `You cannot attach both a shared post and an image.`
                        })
                    }

                    if ( this.has(post, 'linkPreviewId') && post.linkPreviewId !== null ) {
                        errors.push({
                            type: 'sharedPostId:conflict',
                            log: `Cannot have both sharedPostId and linkPreviewId.`,
                            message: `You cannot attach both a shared post and a link.`
                        })
                    }
                }
            }
        }

        if ( this.has(post, 'content') ) {
            if ( post.content !== null ) {
                if ( typeof post.content !== 'string' ) {
                    errors.push({
                        type: `content:invalid-type`,
                        log: `${typeof post.content} is not a valid type for Post.content.`,
                        message: `${typeof post.content} is not a valid type for Post.content.`
                    })
                } else if( post.content.length > 10000 ) {
                    errors.push({
                        type: `content:too-long`,
                        log: `Post too long.`,
                        message: `Your post was too long.  Please keep posts to 10,000 characters or less.`
                    })
                }
            }
        }

        // ================== Type Checks =====================================
        // Different types of posts have different constraints.  Group posts need
        // to have their visibility match the group type.

        // The visibility of posts in groups must match the visibility of the group.
        if ( this.has(post, 'type') && post.type === 'group' ) {
            if ( ! this.has(post, 'groupId') || post.groupId === null ) {
                errors.push({
                    type: 'groupId:missing',
                    log: 'Attempt to make a Group post without a groupId.',
                    message: `You can't post to a Group without including a groupId.`
                })
            } else {
                const group = await this.groupDAO.getGroupById(post.groupId)

                if ( group === null ) {
                    errors.push({
                        type: 'groupId:not-found',
                        log: `Attempt to post to a Group(${post.groupId}) that doesn't exist.`,
                        message: `You can't post to a group that doesn't exist.`
                    })
                } else {
                    if ( group.type === 'open' && post.visibility === 'private' ) {
                        errors.push({
                            type: 'visibility:invalid',
                            log: `Attempt to make a private Post to an Open Group.`,
                            message: `You can't make a private Post to an Open Group.`
                        })
                    }

                    if ( (group.type === 'private' || group.type === 'hidden') 
                        && post.visibility === 'public' ) 
                    {
                        errors.push({
                            type: 'visibility:invalid',
                            log: `Attempt to make a public Post to a private or hidden Group.`,
                            message: `You can't make a public Post to a private or hidden Group.`
                        })
                    }
                }
            }
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
            'permissions', 'invitations', 'createdDate', 'updatedDate'
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
                    'fileId', 'name', 'username', 'password', 'settings', 'notices', 'about', 'location', 'status'
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
                const disallowedFields = [ 'settings', 'notices', 'status' ]

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
                const disallowedFields = [ 'settings', 'notices', 'status' ]

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
                const disallowedFields = [ 'settings', 'notices', 'email', 'name', 'username', 'status' ]

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


            } else if ( type === 'authenticated-edit' ) {
                // With password authentication, they are allowed to change any
                // of the editable fields and not required to change any of
                // them.  `username` is not editable and can only be set at
                // user creation.
                const disallowedFields = [ 'username', 'status' ]

                for(const disallowedField of disallowedFields ) {
                    if ( this.has(user, disallowedField) ) {
                        errors.push({
                            type: `${disallowedField}:not-allowed`,
                            log: `Editting ${disallowedField} is not allowed.`,
                            message: `You may not edit '${disallowedField}'.`
                        })
                    }
                }
            } else if ( type === 'admin-edit' ) {
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
                const disallowedFields = [ 'email', 'password', 'username', 'status' ]

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

        if ( this.has(user, 'status') ) {
            if ( user.status === null ) {
                errors.push({
                    type: `status:null`,
                    log: `Status cannot be null.`,
                    message: `Status cannot be null.`
                })
            } else if ( typeof user.status !== 'string' ) {
                errors.push({
                    type: `status:invalid-type`,
                    log: `${typeof user.status} is an invalid type for status.`,
                    message: `${typeof user.status} is an invalid type for status.`
                })
            } else {
                if ( user.status !== 'banned' && user.status !== 'confirmed' ) {
                    errors.push({
                        type: `status:invalid`,
                        log: `'${user.status}' is not a valid status.`,
                        message: `Status may only be updated to one of 'banned' or 'confirmed'.`
                    })
                }

                if ( existing.status !== 'banned' && existing.status !== 'confirmed' ) {
                    errors.push({
                        type: `status:not-authorized`,
                        log: `User attempting to update status for unconfirmed user.`,
                        message: `You may only update status to ban confirmed users or unban previously banned users.`
                    })
                }
            }
        }

        return errors
    }

    async validateSiteModeration(currentUser, siteModeration, existing) {
        const errors = []

        // ================== Validate Field Presence =========================
        // Before we validate the content of the fields, we're going to validate
        // whether they can be set or changed at all.

        // These are fields the user is never allowed to set.
        const alwaysDisallowedFields = [
            'createdDate', 'updatedDate'
        ]

        for(const disallowedField of alwaysDisallowedFields ) {
            if ( this.has(siteModeration, disallowedField) ) {
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

        // We're creating a moderation.
        if ( existing === null || existing === undefined ) {
            const requiredFields = [
                'userId', 'status'
            ]

            for(const requiredField of requiredFields) {
                if ( ! this.has(siteModeration, requiredField) || siteModeration[requiredField] === null ) {
                    errors.push({
                        type: `${requiredField}:missing`,
                        log: `${requiredField} is required.`,
                        message: `${requiredField} is required.`
                    })
                }
            }

            if ( ( ! this.has(siteModeration, 'postId') ||  siteModeration.postId === null )
                && ( ! this.has(siteModeration, 'postCommentId') || siteModeration.postCommentId === null ))
            {
                errors.push({
                    type: `entityId:missing`,
                    log: `SiteModeration missing ID of moderated entity.`,
                    message: `ID of the entity being moderated is required.  Please include either 'postId' or 'postCommentId'.`
                })
            }

        } 
        // We're editing a moderation.
        else {
            if ( ( ! this.has(siteModeration, 'postId') ||  siteModeration.postId === null )
                && ( ! this.has(siteModeration, 'postCommentId') || siteModeration.postCommentId === null ))
            {
                errors.push({
                    type: `entityId:missing`,
                    log: `SiteModeration missing ID of moderated entity.`,
                    message: `ID of the entity being moderated is required.  Please include either 'postId' or 'postCommentId'.`
                })
            }

            if ( this.has(siteModeration, 'id') && siteModeration.id !== existing.id ) {
                throw new ServiceError('entity-mismatch',
                    `ValidationService provided with the wrong 'existing' entity.`)
            }

            if ( this.has(siteModeration, 'postId') && siteModeration.postId !== existing.postId ) {
                errors.push({
                    type: `postId:not-allowed`,
                    log: `User(${currentUser.id}) attempting to change the SiteModeration.postId.`,
                    message: `You cannot edit SiteModeration.postId.`
                })
            }

            if ( this.has(siteModeration, 'postCommentId') && siteModeration.postCommentId !== existing.postCommentId ) {
                errors.push({
                    type: `postCommentId:not-allowed`,
                    log: `User(${currentUser.id}) attempting to change SiteModeration.postCommentId.`,
                    message: `You cannot edit SiteModeration.postId.`
                })
            }
        }

        // If we have invalid fields set, then we don't need to go any further.
        if ( errors.length > 0 ) {
            return errors
        }

        if ( this.has(siteModeration, 'userId') ) {
            if ( siteModeration.userId === null ) {
                errors.push({
                    type: 'userId:missing',
                    log: `User(${currentUser.id}) submitted SiteModeration missing userId.`,
                    message: `You cannot set userId to null.`
                })
            } else if ( typeof siteModeration.userId !== 'string' ) {
                errors.push({
                    type: 'userId:invalid-type',
                    log: `User(${currentUser.id}) submitted SiteModeration with invalid type '${typeof siteModeration.userId}'.`,
                    message: `${typeof siteModeration.userId} is invalid for userId.`
                })
            } else if ( ! uuid.validate(siteModeration.userId) ) {
                errors.push({
                    type: 'userId:invalid',
                    log: `User(${currentUser.id}) submitted SiteModeration with invalid uuid.`,
                    message: `userId must be a valid uuid.`
                })
            } else {
                const results = await this.core.database.query(`SELECT id FROM users WHERE users.id = $1`, [ siteModeration.userId])
                if ( results.rows.length <= 0 || results.rows[0].id !== siteModeration.userId) {
                    errors.push({
                        type: 'userId:not-found',
                        log: `User(${currentUser.id}) submitted SiteModeration with invalid userId.`,
                        message: `We couldn't find a user for that userId.`
                    })
                }
            }
        }

        if ( this.has(siteModeration, 'status') ) {
            if ( siteModeration.status === null ) {
                errors.push({
                    type: 'status:missing',
                    log: `SiteModeration.status cannot be null.`,
                    message: `You cannot set 'status' to null.`
                })
            } else if ( typeof siteModeration.status !== 'string' ) {
                errors.push({
                    type: 'status:invalid-type',
                    log: `${typeof siteModeration.status} is not a valid type for status.`,
                    message: `'${typeof siteModeration.status}' is not a valid type for status.`
                })
            } else {
                const validStatuses = [ 'flagged', 'approved', 'rejected' ]
                if ( ! validStatuses.includes(siteModeration.status) ) {
                    errors.push({
                        type: 'status:invalid',
                        log: `'${siteModeration.status}' is not a valid status.`,
                        message: `'${siteModeration.status}' is not a valid status.  Status may be 'flagged', 'approved', or 'rejected'.`
                    })
                }
            }
        }

        if ( this.has(siteModeration, 'reason') ) {
            // `reason` may be null.
            if ( siteModeration.reason !== null ) {
                if ( typeof siteModeration.reason !== 'string' ) {
                    errors.push({
                        type: 'reason:invalid-type',
                        log: `'${typeof siteModeration.reason}' is not a valid type for 'reason'.`,
                        message: `'${typeof siteModeration.reason}' is not a valid type for 'reason'.`
                    })
                }
            } 
        }

        if ( this.has(siteModeration, 'postId') ) {
            // `postId` may be null.
            if ( siteModeration.postId !== null ) {
                if ( typeof siteModeration.postId !== 'string' ) {
                    errors.push({
                        type: 'postId:invalid-type',
                        log: `'${typeof siteModeration.postId}' is an invalid type for 'postId'.`,
                        message: `'${typeof siteModeration.postId}' is an invalid type for 'postId'.`
                    })
                } else if ( ! uuid.validate(siteModeration.postId) ) {
                    errors.push({
                        type: 'postId:invalid',
                        log: `'${siteModeration.postId}' is not a valid uuid.`,
                        message: `postId must be a valid uuid.`
                    })
                } else {
                    const results = await this.core.database.query(`SELECT id FROM posts WHERE id = $1`, [ siteModeration.postId ]) 
                    if ( results.rows.length <= 0 || results.rows[0].id !== siteModeration.postId) {
                        errors.push({
                            type: 'postId:not-found',
                            log: `Post not found for '${siteModeration.postId}'.`,
                            message: `Post not found for '${siteModeration.postId}'.`
                        })
                    }
                }
            }
        }

        if ( this.has(siteModeration, 'postCommentId' ) ) {
            if ( siteModeration.postCommentId !== null ) {
                if ( typeof siteModeration.postCommentId !== 'string' ) {
                    errors.push({
                        type: 'postCommentId:invalid-type',
                        log: `'${typeof siteModeration.postCommentId}' is an invalid type for 'postCommentId'.`,
                        message: `'${typeof siteModeration.postCommentId}' is an invalid type for 'postCommentId'.`
                    })
                } else if ( ! uuid.validate(siteModeration.postCommentId) ) {
                    errors.push({
                        type: 'postCommentId:invalid',
                        log: `'${siteModeration.postCommentId}' is not a valid uuid.`,
                        message: `postCommentId must be a valid uuid.`
                    })
                } else {
                    const postCommentResults = await this.core.database.query(
                        `SELECT id FROM post_comments WHERE id = $1`, 
                        [ siteModeration.postCommentId ]
                    )
                    if ( postCommentResults.rows.length <= 0 || postCommentResults.rows[0].id !== siteModeration.postCommentId) {
                        errors.push({
                            type: 'postCommentId:not-found',
                            log: `PostComment not found for '${siteModeration.postCommentId}'.`,
                            message: `PostComment not found for '${siteModeration.postCommentId}'.`
                        })
                    }
                }
            }
        }

        return errors
    }

    async validateBlocklist(currentUser, blocklist, existing) {
        const errors = []

        // ================== Validate Field Presence =========================
        // Before we validate the content of the fields, we're going to validate
        // whether they can be set or changed at all.

        // These are fields the user is never allowed to set.
        const alwaysDisallowedFields = [
            'createdDate', 'updatedDate'
        ]

        for(const disallowedField of alwaysDisallowedFields ) {
            if ( util.objectHas(blocklist, disallowedField) ) {
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

        // We're creating a blocklist.
        if ( existing === null || existing === undefined ) {
            const requiredFields = [
                'userId', 'domain'
            ]

            for(const requiredField of requiredFields) {
                if ( ! util.objectHas(blocklist, requiredField) || blocklist[requiredField] === null ) {
                    errors.push({
                        type: `${requiredField}:missing`,
                        log: `${requiredField} is required.`,
                        message: `${requiredField} is required.`
                    })
                }
            }
        } 
        // We're editing a blocklist.
        else {
            if ( util.objectHas(blocklist, 'id') && blocklist.id !== existing.id ) {
                throw new ServiceError('entity-mismatch',
                    `Wrong 'existing' entity.`)
            }

            const disallowedFields = [
                'userId', 'domain'
            ]

            for(const disallowedField of disallowedFields) {
                if ( util.objectHas(blocklist, disallowedField) || blocklist[disallowedField] !== existing[disallowedField]) {
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
        const validationErrors = validation.entities.Blocklist.validate(blocklist)
        if ( validationErrors.all.length > 0 ) {
            errors.push(...validationErrors.all)
        }

        // If we have invalid fields set, then we don't need to go any further.
        if ( errors.length > 0 ) {
            return errors
        }

        // Do backend specific validation.
        
        if ( util.objectHas(blocklist, 'userId') ) {
            const userResults = await this.core.database.query(`SELECT id FROM users WHERE id = $1`, [ blocklist.userId ])
            if ( userResults.rows.length <= 0 ) {
                errors.push({
                    type: `userId:not-found`,
                    log: `No user found for userId '${blocklist.userId}'.`,
                    message: `No user found for userId.`
                })
            }

            if ( currentUser.id !== blocklist.userId ) {
                errors.push({
                    type: `userId:not-authorized`,
                    log: `User may not create a blocklist for another user.`,
                    message: `You may not create a blocklist for another user.`
                })
            }
        } 

        return errors
    }
}
