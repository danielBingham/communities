const { validation }  = require('../../../')


describe('validateId', function() {
    it('Should return an error when id is null', function() {
        const id = null
        const errors = validation.PostSubscription.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:null')
    })

    it('Should return an error when id is not a string', function() {
        const id = 5
        const errors = validation.PostSubscription.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:invalid')
    })

    it('Should return an error when id is not a valid uuid', function() {
        const id = 'test-id'
        const errors = validation.PostSubscription.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:invalid')
    })

    it('Should pass a valid UUID', function() {
        const id = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.PostSubscription.validateId(id)

        expect(errors.length).toBe(0)
    })
})

describe('validatePostId', function() {
    it('Should return an error when postId is undefined while creating', function() {
        const postId = undefined
        const existing = undefined 
        const errors = validation.PostSubscription.validatePostId(postId, existing, 'create')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postId:required')
    })

    it('Should return an error when postId is being updated', function() {
        const postId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.PostSubscription.validatePostId(postId, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postId:not-allowed')
    })

    it('Should pass when postId is not being updated', function() {
        const postId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.PostSubscription.validatePostId(postId, existing, 'update')

        expect(errors.length).toBe(0)
    })

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
    it('Should return an error when userId is undefined while creating', function() {
        const userId = undefined
        const existing = undefined
        const errors = validation.PostSubscription.validateUserId(userId, existing, 'create')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:required')
    })

    it('Should return an error when userId is being updated', function() {
        const userId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.PostSubscription.validateUserId(userId, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:not-allowed')
    })

    it('Should pass when userId is not being updated', function() {
        const userId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.PostSubscription.validateUserId(userId, existing, 'update')

        expect(errors.length).toBe(0)
    })

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

describe('validateCreatedDate', function() {
    it('Should pass when createdDate is undefined', function() {
        const createdDate = undefined
        const errors = validation.PostSubscription.validateCreatedDate(createdDate)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when createdDate is set', function() {
        const createdDate = 'July 4th, 2005'
        const errors = validation.PostSubscription.validateCreatedDate(createdDate)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('createdDate:not-allowed')
    })

    it('Should return an error when createdDate is being updated', function() {
        const createdDate = 'July 4th, 2005'
        const existing = 'July 5th, 2005'
        const errors = validation.PostSubscription.validateCreatedDate(createdDate, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('createdDate:not-allowed')
    })
})

describe('validateUpdatedDate', function() {
    it('Should pass when updatedDate is undefined', function() {
        const updatedDate = undefined
        const errors = validation.PostSubscription.validateUpdatedDate(updatedDate)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when updatedDate is set', function() {
        const updatedDate = 'July 4th, 2005'
        const errors = validation.PostSubscription.validateUpdatedDate(updatedDate)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('updatedDate:not-allowed')
    })

    it('Should return an error when updatedDate is being updated', function() {
        const updatedDate = 'July 4th, 2005'
        const existing = 'July 5th, 2005'
        const errors = validation.PostSubscription.validateUpdatedDate(updatedDate, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('updatedDate:not-allowed')
    })
})

describe('validate', function() {
    it('Should return errors for an invalid postSubscription', function() {
        const postSubscription = {
            id: null,
            userId: null,
            postId: null,
            createdDate: 'July 4th',
            updatedDate: 'July 4th'
        }
        const errors = validation.PostSubscription.validate(postSubscription)

        expect(errors.all.length).toBe(5)
        expect(errors.id.length).toBe(1)
        expect(errors.userId.length).toBe(1)
        expect(errors.postId.length).toBe(1)
        expect(errors.createdDate.length).toBe(1)
        expect(errors.updatedDate.length).toBe(1)
    })

    it('Should return errors for an invalid edit', function() {
        const postSubscription = {
            userId: 'd209158e-5c58-44e1-ab00-12b45aad065f',
            postId: 'ead6e86a-2dd8-48d3-82d0-80b770b74c67'
        }

        const existing = {
            userId: 'c6cf7503-eef3-4535-8270-853c9d160ede',
            postId: '6cb083da-ee16-4d4a-be1f-7580f7c9dd5f'
        }

        const errors = validation.PostSubscription.validate(postSubscription, existing)

        expect(errors.all.length).toBe(2)

    })

    it('Should pass a valid postSubscription', function() {
        const postSubscription = {
            userId: 'd209158e-5c58-44e1-ab00-12b45aad065f',
            postId: 'ead6e86a-2dd8-48d3-82d0-80b770b74c67'
        }

        const errors = validation.PostSubscription.validate(postSubscription)

        expect(errors.all.length).toBe(0)
    })
})
