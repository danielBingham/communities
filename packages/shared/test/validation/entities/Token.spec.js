const { validation }  = require('../../../')


describe('validateId', function() {
    it('Should return an error when id is null', function() {
        const id = null
        const errors = validation.Token.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:null')
    })

    it('Should return an error when id is not a string', function() {
        const id = 5
        const errors = validation.Token.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:invalid')
    })

    it('Should return an error when id is not a valid uuid', function() {
        const id = 'test-id'
        const errors = validation.Token.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:invalid')
    })

    it('Should pass a valid UUID', function() {
        const id = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Token.validateId(id)

        expect(errors.length).toBe(0)
    })
})

describe('validateCreatorId', function() {
    it('Should return an error when creatorId is undefined and existing is undefined', function() {
        const creatorId = undefined
        const errors = validation.Token.validateCreatorId(creatorId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('creatorId:required')
    })

    it('Should return an error when creatorId is being updated', function() {
        const creatorId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.Token.validateCreatorId(creatorId, existing)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('creatorId:not-allowed')
    })

    it('Should pass when creatorId is not being updated', function() {
        const creatorId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Token.validateCreatorId(creatorId, existing)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when null', function() {
        const value = null
        const errors = validation.Token.validateCreatorId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('creatorId:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.Token.validateCreatorId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('creatorId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.Token.validateCreatorId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('creatorId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Token.validateCreatorId(value)

        expect(errors.length).toBe(0)
    })
})


describe('validateUserId', function() {
    it('Should return an error when userId is undefined and existing is undefined', function() {
        const userId = undefined
        const errors = validation.Token.validateUserId(userId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:required')
    })

    it('Should return an error when userId is being updated', function() {
        const userId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.Token.validateUserId(userId, existing)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:not-allowed')
    })

    it('Should pass when userId is not being updated', function() {
        const userId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Token.validateUserId(userId, existing)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when null', function() {
        const value = null
        const errors = validation.Token.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.Token.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.Token.validateUserId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Token.validateUserId(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateToken', function() {
    it('Should return an error when token is undefined and existing is undefined', function() {
        const token = undefined
        const errors = validation.Token.validateToken(token)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('token:required')
    })

    it('Should return an error when token is being updated', function() {
        const value = '9b6e5b6d3f0301e4ec7528403148d046737a18af2ea9cf5702792d626c850b71'
        const existing = '6ddf7d7579f22bcd8acd045ef29097f26b7f50a564af51d2b16aee18c7d2f8dc'
        const errors = validation.Token.validateToken(value, existing)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('token:not-allowed')
    })

    it('Should pass when token is not being updated', function() {
        const value = '9b6e5b6d3f0301e4ec7528403148d046737a18af2ea9cf5702792d626c850b71'
        const existing = '9b6e5b6d3f0301e4ec7528403148d046737a18af2ea9cf5702792d626c850b71'

        const errors = validation.Token.validateToken(value, existing)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when null', function() {
        const value = null
        const errors = validation.Token.validateToken(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('token:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.Token.validateToken(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('token:invalid-type')
    })

    it('Should pass a valid token', function() {
        const value = '9b6e5b6d3f0301e4ec7528403148d046737a18af2ea9cf5702792d626c850b71'

        const errors = validation.Token.validateToken(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateType', function() {
    it('Should return an error when type is undefined and existing is undefined', function() {
        const type = undefined
        const errors = validation.Token.validateType(type)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('type:required')
    })

    it('Should return an error when type is being updated', function() {
        const value = 'email-confirmation'
        const existing = 'invitation'
        const errors = validation.Token.validateType(value, existing)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('type:not-allowed')
    })

    it('Should pass when type is not being updated', function() {
        const value = 'email-confirmation'
        const existing = 'email-confirmation'

        const errors = validation.Token.validateType(value, existing)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when null', function() {
        const value = null
        const errors = validation.Token.validateType(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('type:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.Token.validateType(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('type:invalid-type')
    })

    it("Should pass when 'invitation'", function() {
        const value = 'invitation'

        const errors = validation.Token.validateType(value)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'email-confirmation'", function() {
        const value = 'email-confirmation'

        const errors = validation.Token.validateType(value)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'reset-password'", function() {
        const value = 'reset-password'

        const errors = validation.Token.validateType(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateCreatedDate', function() {
    it('Should pass when createdDate is undefined', function() {
        const createdDate = undefined
        const errors = validation.Token.validateCreatedDate(createdDate)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when createdDate is set', function() {
        const createdDate = 'July 4th, 2005'
        const errors = validation.Token.validateCreatedDate(createdDate)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('createdDate:not-allowed')
    })

    it('Should return an error when createdDate is being updated', function() {
        const createdDate = 'July 4th, 2005'
        const existing = 'July 5th, 2005'
        const errors = validation.Token.validateCreatedDate(createdDate, existing)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('createdDate:not-allowed')
    })
})

describe('validateUpdatedDate', function() {
    it('Should pass when updatedDate is undefined', function() {
        const updatedDate = undefined
        const errors = validation.Token.validateUpdatedDate(updatedDate)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when updatedDate is set', function() {
        const updatedDate = 'July 4th, 2005'
        const errors = validation.Token.validateUpdatedDate(updatedDate)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('updatedDate:not-allowed')
    })

    it('Should return an error when updatedDate is being updated', function() {
        const updatedDate = 'July 4th, 2005'
        const existing = 'July 5th, 2005'
        const errors = validation.Token.validateUpdatedDate(updatedDate, existing)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('updatedDate:not-allowed')
    })
})

describe('validate', function() {
    it('Should return errors for an invalid token', function() {
        const token = {
            id: null,
            userId: null,
            creatorId: null,
            token: null,
            type: 'validation',
            createdDate: 'July 4th',
            updatedDate: 'July 4th'
        }
        const errors = validation.Token.validate(token)

        expect(errors.all.length).toBe(7)
        expect(errors.id.length).toBe(1)
        expect(errors.userId.length).toBe(1)
        expect(errors.creatorId.length).toBe(1)
        expect(errors.token.length).toBe(1)
        expect(errors.type.length).toBe(1)
        expect(errors.createdDate.length).toBe(1)
        expect(errors.updatedDate.length).toBe(1)
    })

    it('Should return errors for an invalid edit', function() {
        const token = {
            userId: 'd209158e-5c58-44e1-ab00-12b45aad065f',
            creatorId: 'ead6e86a-2dd8-48d3-82d0-80b770b74c67'
        }

        const existing = {
            userId: 'c6cf7503-eef3-4535-8270-853c9d160ede',
            creatorId: '6cb083da-ee16-4d4a-be1f-7580f7c9dd5f',
            token: 'a0ff8a08bf1c1b4b062d8902669ff855bca87bf4b5dffa7e6a184fadabaea0ea',
            type: 'email-confirmation'
        }

        const errors = validation.Token.validate(token, existing)

        expect(errors.all.length).toBe(2)

    })

    it('Should pass a valid token', function() {
        const token = {
            userId: 'd209158e-5c58-44e1-ab00-12b45aad065f',
            creatorId: 'ead6e86a-2dd8-48d3-82d0-80b770b74c67',
            token: 'a0ff8a08bf1c1b4b062d8902669ff855bca87bf4b5dffa7e6a184fadabaea0ea',
            type: 'email-confirmation'
        }

        const errors = validation.Token.validate(token)

        expect(errors.all.length).toBe(0)
    })
})
