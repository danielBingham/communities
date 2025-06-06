const { validation }  = require('../../../')

describe('validateGroupId', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.GroupMember.validateGroupId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('groupId:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.GroupMember.validateGroupId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('groupId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.GroupMember.validateGroupId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('groupId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.GroupMember.validateGroupId(value)

        expect(errors.length).toBe(0)
    })
})


describe('validateUserId', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.GroupMember.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.GroupMember.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.GroupMember.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.GroupMember.validateUserId(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateStatus', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.GroupMember.validateStatus(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('status:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.GroupMember.validateStatus(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('status:invalid-type')
    })

    it('Should return an error when not a valid value', function() {
        const value = 'test'
        const errors = validation.GroupMember.validateStatus(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('status:invalid')
    })

    it("Should pass when 'member'", function() {
        const value = 'member'
        const errors = validation.GroupMember.validateStatus(value)

        expect(errors.length).toBe(0)
    })
    
    it("Should pass when 'pending-invited'", function() {
        const value = 'pending-invited'
        const errors = validation.GroupMember.validateStatus(value)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'pending-requested'", function() {
        const value = 'pending-requested'
        const errors = validation.GroupMember.validateStatus(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateRole', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.GroupMember.validateRole(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('role:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.GroupMember.validateRole(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('role:invalid-type')
    })

    it('Should return an error when not a valid value', function() {
        const value = 'test'
        const errors = validation.GroupMember.validateRole(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('role:invalid')
    })

    it("Should pass when 'member'", function() {
        const value = 'member'
        const errors = validation.GroupMember.validateRole(value)

        expect(errors.length).toBe(0)
    })
    
    it("Should pass when 'moderator'", function() {
        const value = 'moderator'
        const errors = validation.GroupMember.validateRole(value)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'admin'", function() {
        const value = 'admin'
        const errors = validation.GroupMember.validateRole(value)

        expect(errors.length).toBe(0)
    })
})
