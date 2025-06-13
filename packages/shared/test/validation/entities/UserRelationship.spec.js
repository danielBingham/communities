const { validation }  = require('../../../')



describe('validateUserId', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.UserRelationship.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.UserRelationship.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.UserRelationship.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.UserRelationship.validateUserId(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateRelationId', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.UserRelationship.validateRelationId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('relationId:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.UserRelationship.validateRelationId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('relationId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.UserRelationship.validateRelationId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('relationId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.UserRelationship.validateRelationId(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateStatus', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.UserRelationship.validateStatus(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('status:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.UserRelationship.validateStatus(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('status:invalid-type')
    })

    it('Should return an error when not a valid value', function() {
        const value = 'test'
        const errors = validation.UserRelationship.validateStatus(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('status:invalid')
    })

    it("Should pass when 'confirmed'", function() {
        const value = 'confirmed'
        const errors = validation.UserRelationship.validateStatus(value)

        expect(errors.length).toBe(0)
    })
    
    it("Should pass when 'pending'", function() {
        const value = 'pending'
        const errors = validation.UserRelationship.validateStatus(value)

        expect(errors.length).toBe(0)
    })
})
