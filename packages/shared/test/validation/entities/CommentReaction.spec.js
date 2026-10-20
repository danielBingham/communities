const { validation }  = require('../../../')

describe('validatePostId', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.CommentReaction.validatePostId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postId:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.CommentReaction.validatePostId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.CommentReaction.validatePostId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.CommentReaction.validatePostId(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateCommentId', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.CommentReaction.validateCommentId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('commentId:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.CommentReaction.validateCommentId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('commentId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.CommentReaction.validateCommentId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('commentId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.CommentReaction.validateCommentId(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateUserId', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.CommentReaction.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.CommentReaction.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.CommentReaction.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.CommentReaction.validateUserId(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateReaction', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.CommentReaction.validateReaction(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('reaction:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.CommentReaction.validateReaction(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('reaction:invalid-type')
    })

    it('Should return an error when not a valid value', function() {
        const value = 'test'
        const errors = validation.CommentReaction.validateReaction(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('reaction:invalid')
    })

    it("Should pass when 'like'", function() {
        const value = 'like'
        const errors = validation.CommentReaction.validateReaction(value)

        expect(errors.length).toBe(0)
    })

    // PostReactions allow 'dislike', but the `comment_reaction_type` enum
    // only has 'like' for now.
    it("Should fail when 'dislike'", function() {
        const value = 'dislike'
        const errors = validation.CommentReaction.validateReaction(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('reaction:invalid')
    })
})

describe('validate', function() {
    it('Should pass a valid new CommentReaction', function() {
        const commentReaction = {
            id: '0a1e1b8c-5f1a-4bb4-8a8b-6c1e0a5f2d11',
            postId: 'd209158e-5c58-44e1-ab00-12b45aad065f',
            commentId: '6b7f9c22-1a2d-4f1e-9a8e-7c1d2b3a4e5f',
            userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
            reaction: 'like'
        }

        const errors = validation.CommentReaction.validate(commentReaction)

        expect(errors.all.length).toBe(0)
    })

    it('Should require postId, commentId, userId, and reaction to create', function() {
        const errors = validation.CommentReaction.validate({})

        expect(errors.all.length).toBe(4)
        expect(errors.all.map((e) => e.type).sort()).toEqual([
            'commentId:required', 'postId:required', 'reaction:required', 'userId:required'
        ])
    })

    it('Should not allow createdDate or updatedDate to be set', function() {
        const commentReaction = {
            postId: 'd209158e-5c58-44e1-ab00-12b45aad065f',
            commentId: '6b7f9c22-1a2d-4f1e-9a8e-7c1d2b3a4e5f',
            userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
            reaction: 'like',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }

        const errors = validation.CommentReaction.validate(commentReaction)

        expect(errors.all.length).toBe(2)
        expect(errors.all.map((e) => e.type).sort()).toEqual([ 'createdDate:not-allowed', 'updatedDate:not-allowed' ])
    })

    it('Should not allow postId, commentId, or userId to be changed when updating', function() {
        const existing = {
            id: '0a1e1b8c-5f1a-4bb4-8a8b-6c1e0a5f2d11',
            postId: 'd209158e-5c58-44e1-ab00-12b45aad065f',
            commentId: '6b7f9c22-1a2d-4f1e-9a8e-7c1d2b3a4e5f',
            userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
            reaction: 'like'
        }

        const commentReaction = {
            id: '0a1e1b8c-5f1a-4bb4-8a8b-6c1e0a5f2d11',
            postId: '3b0e5c1a-8d0b-4f7b-9a43-1d2c3b4a5e6f',
            commentId: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
            userId: '3f69c43b-9ffc-4685-884a-99ac30629e93',
            reaction: 'like'
        }

        const errors = validation.CommentReaction.validate(commentReaction, existing)

        expect(errors.all.length).toBe(3)
        expect(errors.all.map((e) => e.type).sort()).toEqual([ 'commentId:not-allowed', 'postId:not-allowed', 'userId:not-allowed' ])
    })
})
