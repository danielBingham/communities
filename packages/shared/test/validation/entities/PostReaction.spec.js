const { validation }  = require('../../../')

describe('validatePostId', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.PostReaction.validatePostId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postId:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.PostReaction.validatePostId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.PostReaction.validatePostId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.PostReaction.validatePostId(value)

        expect(errors.length).toBe(0)
    })
})


describe('validateUserId', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.PostReaction.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.PostReaction.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.PostReaction.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.PostReaction.validateUserId(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateReaction', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.PostReaction.validateReaction(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('reaction:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.PostReaction.validateReaction(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('reaction:invalid-type')
    })

    it('Should return an error when not a valid value', function() {
        const value = 'test'
        const errors = validation.PostReaction.validateReaction(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('reaction:invalid')
    })

    it("Should pass when 'like'", function() {
        const value = 'like'
        const errors = validation.PostReaction.validateReaction(value)

        expect(errors.length).toBe(0)
    })
    
    it("Should pass when 'dislike'", function() {
        const value = 'dislike'
        const errors = validation.PostReaction.validateReaction(value)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'block'", function() {
        const value = 'block'
        const errors = validation.PostReaction.validateReaction(value)

        expect(errors.length).toBe(0)
    })
})
