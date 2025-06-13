const { validation }  = require('../../../')

describe('validatePostId', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.PostSubscription.validatePostId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postId:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.PostSubscription.validatePostId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.PostSubscription.validatePostId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.PostSubscription.validatePostId(value)

        expect(errors.length).toBe(0)
    })
})


describe('validateUserId', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.PostSubscription.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.PostSubscription.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.PostSubscription.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.PostSubscription.validateUserId(value)

        expect(errors.length).toBe(0)
    })
})
