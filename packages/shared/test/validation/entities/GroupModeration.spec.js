const { validation }  = require('../../../')

describe('validateId', function() {
    it('Should return an error when id is null', function() {
        const id = null
        const errors = validation.GroupModeration.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:null')
    })

    it('Should return an error when id is not a string', function() {
        const id = 5
        const errors = validation.GroupModeration.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:invalid')
    })

    it('Should return an error when id is not a valid uuid', function() {
        const id = 'test-id'
        const errors = validation.GroupModeration.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:invalid')
    })

    it('Should pass a valid UUID', function() {
        const id = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.GroupModeration.validateId(id)

        expect(errors.length).toBe(0)
    })
})

describe('validateUserId', function() {
    it('Should return an error when userId is undefined while creating', function() {
        const userId = undefined
        const existing = undefined 

        const errors = validation.GroupModeration.validateUserId(userId, existing, 'create')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:required')
    })

    it('Should pass when userId is being updated', function() {
        const userId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.GroupModeration.validateUserId(userId, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass when userId is not being updated', function() {
        const userId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.GroupModeration.validateUserId(userId, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should return an error when userId is null', function() {
        const userId = null
        const errors = validation.GroupModeration.validateUserId(userId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:null')
    })

    it('Should return an error when userId is not a string', function() {
        const userId = 5
        const errors = validation.GroupModeration.validateUserId(userId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should return an error when userId is not a valid uuid', function() {
        const userId = 'test-id'
        const errors = validation.GroupModeration.validateUserId(userId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const userId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.GroupModeration.validateUserId(userId)

        expect(errors.length).toBe(0)
    })
})

describe('validateGroupId', function() {
    it('Should return an error when groupId is undefined while creating', function() {
        const groupId = undefined
        const existing = undefined 

        const errors = validation.GroupModeration.validateGroupId(groupId, existing, 'create')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('groupId:required')
    })

    it('Should return an error when groupId is being updated', function() {
        const groupId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.GroupModeration.validateGroupId(groupId, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('groupId:not-allowed')
    })

    it('Should pass when groupId is not being updated', function() {
        const groupId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.GroupModeration.validateGroupId(groupId, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should return an error when groupId is null', function() {
        const groupId = null
        const errors = validation.GroupModeration.validateGroupId(groupId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('groupId:null')
    })

    it('Should return an error when groupId is not a string', function() {
        const groupId = 5
        const errors = validation.GroupModeration.validateGroupId(groupId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('groupId:invalid')
    })

    it('Should return an error when groupId is not a valid uuid', function() {
        const groupId = 'test-id'
        const errors = validation.GroupModeration.validateGroupId(groupId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('groupId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const groupId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.GroupModeration.validateGroupId(groupId)

        expect(errors.length).toBe(0)
    })
})

describe('validateStatus', function() {
    it('Should return an error when status is undefined while creating', function() {
        const value = undefined
        const errors = validation.GroupModeration.validateStatus(value, undefined, 'create')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('status:required')
    })

    it('Should return an error when status is null', function() {
        const value = null
        const errors = validation.GroupModeration.validateStatus(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('status:null')
    })

    it('Should return an error when status is not a string', function() {
        const status = 10
        const errors = validation.GroupModeration.validateStatus(status)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('status:invalid-type')
    })

    it('Should return an error when status is an empty string', function() {
        const value = ''
        const errors = validation.GroupModeration.validateStatus(value)

        expect(errors.length).toBe(2)
        expect(errors[0].type).toBe('status:required')
    })

    it("Should pass when 'flagged'", function() {
        const value = 'flagged'
        const errors = validation.GroupModeration.validateStatus(value)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'approved'", function() {
        const value = 'approved'
        const errors = validation.GroupModeration.validateStatus(value)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'rejected'", function() {
        const value = 'rejected'
        const errors = validation.GroupModeration.validateStatus(value)

        expect(errors.length).toBe(0)
    })

})

describe('validateReason', function() {
    it('Should return an error when reason is null', function() {
        const reason = null
        const errors = validation.GroupModeration.validateReason(reason)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('reason:null')
    })

    it('Should return an error when reason is not a string', function() {
        const reason = 10
        const errors = validation.GroupModeration.validateReason(reason)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('reason:invalid-type')
    })

    it('Should return an error when reason is too long', function() {
        const reason = `
        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        `
        const errors = validation.GroupModeration.validateReason(reason)

        expect(reason.length).toBeGreaterThan(5000)
        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('reason:too-long')
    })

    it('Should pass a valid reason field', function() {
        const reason = 'This post violates the group rules.'
        const errors = validation.GroupModeration.validateReason(reason)

        expect(errors.length).toBe(0)
    })
})

describe('validatePostId', function() {
    it('Should return an error when postId is being updated', function() {
        const postId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.GroupModeration.validatePostId(postId, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postId:not-allowed')
    })

    it('Should pass when postId is not being updated', function() {
        const postId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.GroupModeration.validatePostId(postId, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should not return an error when postId is null', function() {
        const postId = null
        const errors = validation.GroupModeration.validatePostId(postId)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when postId is not a string', function() {
        const postId = 5
        const errors = validation.GroupModeration.validatePostId(postId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postId:invalid')
    })

    it('Should return an error when postId is not a valid uuid', function() {
        const postId = 'test-id'
        const errors = validation.GroupModeration.validatePostId(postId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const postId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.GroupModeration.validatePostId(postId)

        expect(errors.length).toBe(0)
    })
})

describe('validatePostCommentId', function() {
    it('Should return an error when postCommentId is being updated', function() {
        const postCommentId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.GroupModeration.validatePostCommentId(postCommentId, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postCommentId:not-allowed')
    })

    it('Should pass when postCommentId is not being updated', function() {
        const postCommentId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.GroupModeration.validatePostCommentId(postCommentId, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should not return an error when postCommentId is null', function() {
        const postCommentId = null
        const errors = validation.GroupModeration.validatePostCommentId(postCommentId)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when postCommentId is not a string', function() {
        const postCommentId = 5
        const errors = validation.GroupModeration.validatePostCommentId(postCommentId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postCommentId:invalid')
    })

    it('Should return an error when postCommentId is not a valid uuid', function() {
        const postCommentId = 'test-id'
        const errors = validation.GroupModeration.validatePostCommentId(postCommentId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('postCommentId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const postCommentId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.GroupModeration.validatePostCommentId(postCommentId)

        expect(errors.length).toBe(0)
    })
})

describe('validateCreatedDate', function() {
    it('Should pass when createdDate is undefined', function() {
        const createdDate = undefined
        const errors = validation.GroupModeration.validateCreatedDate(createdDate)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when createdDate is set', function() {
        const createdDate = 'July 4th, 2005'
        const errors = validation.GroupModeration.validateCreatedDate(createdDate)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('createdDate:not-allowed')
    })

    it('Should return an error when createdDate is being updated', function() {
        const createdDate = 'July 4th, 2005'
        const existing = 'July 5th, 2005'
        const errors = validation.GroupModeration.validateCreatedDate(createdDate, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('createdDate:not-allowed')
    })
})

describe('validateUpdatedDate', function() {
    it('Should pass when updatedDate is undefined', function() {
        const updatedDate = undefined
        const errors = validation.GroupModeration.validateUpdatedDate(updatedDate)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when updatedDate is set', function() {
        const updatedDate = 'July 4th, 2005'
        const errors = validation.GroupModeration.validateUpdatedDate(updatedDate)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('updatedDate:not-allowed')
    })

    it('Should return an error when updatedDate is being updated', function() {
        const updatedDate = 'July 4th, 2005'
        const existing = 'July 5th, 2005'
        const errors = validation.GroupModeration.validateUpdatedDate(updatedDate, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('updatedDate:not-allowed')
    })
})

describe('validate', function() {
    it('Should return errors for an invalid groupModeration', function() {
        const groupModeration = {
            userId: null,
            groupId: null,
            status: 'removed',
            reason: 25,
            postId: 'test',
            postCommentId: 'test',
        }
        const errors = validation.GroupModeration.validate(groupModeration)

        expect(errors.all.length).toBe(6)
        expect(errors.userId.length).toBe(1)
        expect(errors.groupId.length).toBe(1)
        expect(errors.status.length).toBe(1)
        expect(errors.reason.length).toBe(1)
        expect(errors.postId.length).toBe(1)
        expect(errors.postCommentId.length).toBe(1)
    })

    it('Should pass a valid groupModeration', function() {
        const groupModeration = {
            userId: '4c73dbae-3d03-43cd-b03d-5be4953b832b',
            groupId: '43ef7ae1-81a2-4217-94e0-18be156670d5',
            status: 'flagged',
            reason: 'A test reason',
            postId: 'ff6234c5-f49d-4774-b738-3251fe16fb66',
            postCommentId: null,
        }

        const errors = validation.GroupModeration.validate(groupModeration)

        expect(errors.all.length).toBe(0)
    })
})
