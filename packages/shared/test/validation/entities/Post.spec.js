const { validation }  = require('../../../')

describe('validateId', function() {
    it('Should return an error when id is null', function() {
        const id = null
        const errors = validation.Post.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:null')
    })

    it('Should return an error when id is not a string', function() {
        const id = 5
        const errors = validation.Post.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:invalid')
    })

    it('Should return an error when id is not a valid uuid', function() {
        const id = 'test-id'
        const errors = validation.Post.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:invalid')
    })

    it('Should pass a valid UUID', function() {
        const id = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateId(id)

        expect(errors.length).toBe(0)
    })
})

describe('validateUserId', function() {
    it('Should return an error when userId is undefined while creating', function() {
        const userId = undefined
        const existing = undefined 

        const errors = validation.Post.validateUserId(userId, existing, 'create')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:required')
    })

    it('Should return an error when userId is being updated', function() {
        const userId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.Post.validateUserId(userId, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:not-allowed')
    })

    it('Should pass when userId is not being updated', function() {
        const userId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateUserId(userId, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should return an error when userId is null', function() {
        const userId = null
        const errors = validation.Post.validateUserId(userId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:null')
    })

    it('Should return an error when userId is not a string', function() {
        const userId = 5
        const errors = validation.Post.validateUserId(userId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should return an error when userId is not a valid uuid', function() {
        const userId = 'test-id'
        const errors = validation.Post.validateUserId(userId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const userId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateUserId(userId)

        expect(errors.length).toBe(0)
    })
})

describe('validateGroupId', function() {
    it('Should return an error when groupId is being updated', function() {
        const groupId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.Post.validateGroupId(groupId, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('groupId:not-allowed')
    })

    it('Should pass when groupId is not being updated', function() {
        const groupId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateGroupId(groupId, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass when groupId is null', function() {
        const groupId = null
        const errors = validation.Post.validateGroupId(groupId)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when groupId is not a string', function() {
        const groupId = 5
        const errors = validation.Post.validateGroupId(groupId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('groupId:invalid')
    })

    it('Should return an error when groupId is not a valid uuid', function() {
        const groupId = 'test-id'
        const errors = validation.Post.validateGroupId(groupId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('groupId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const groupId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateGroupId(groupId)

        expect(errors.length).toBe(0)
    })
})

describe('validateType', () => {
    it('Should return an error when type is undefined while creating', function() {
        const value = undefined
        const existing = undefined 

        const errors = validation.Post.validateType(value, existing, 'create')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('type:required')
    })

    it('Should return an error when type is being updated', function() {
        const value = 'feed'
        const existing = 'group'
        const errors = validation.Post.validateType(value, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('type:not-allowed')
    })

    it('Should pass when type is not being updated', function() {
        const value = 'feed'
        const existing = 'feed'
        const errors = validation.Post.validateType(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should return an error when null', () => {
        const value = null
        const errors = validation.Post.validateType(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('type:null')
    })

    it('Should return an error when not a string', () => {
        const value = 5
        const errors = validation.Post.validateType(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('type:invalid-type')
    })

    it('Should return an error when an empty string', () => {
        const value = '' 
        const errors = validation.Post.validateType(value)

        expect(errors.length).toBe(2)
        expect(errors[0].type).toBe('type:required')
    })

    it('Should return an error when not a valid value', () => {
        const value = 'open'
        const errors = validation.Post.validateType(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('type:invalid')
    })

    it('Should pass when undefined', () => {
        const value = undefined
        const errors = validation.Post.validateType(value)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'feed'", () => {
        const value = 'feed'
        const errors = validation.Post.validateType(value)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'group'", () => {
        const value = 'group'
        const errors = validation.Post.validateType(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateVisibility', () => {
    it('Should return an error when undefined while creating', function() {
        const value = undefined
        const existing = undefined 

        const errors = validation.Post.validateVisibility(value, existing, 'create')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('visibility:required')
    })

    it('Should pass when being updated', function() {
        const value = 'private'
        const existing = 'public'
        const errors = validation.Post.validateVisibility(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass when not being updated', function() {
        const value = 'public'
        const existing = 'public'
        const errors = validation.Post.validateVisibility(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should return an error when null', () => {
        const value = null
        const errors = validation.Post.validateVisibility(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('visibility:null')
    })

    it('Should return an error when not a string', () => {
        const value = 5
        const errors = validation.Post.validateVisibility(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('visibility:invalid-type')
    })

    it('Should return an error when an empty string', () => {
        const value = '' 
        const errors = validation.Post.validateVisibility(value)

        expect(errors.length).toBe(2)
        expect(errors[0].type).toBe('visibility:required')
    })

    it('Should return an error when not a valid value', () => {
        const value = 'hidden'
        const errors = validation.Post.validateVisibility(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('visibility:invalid')
    })

    it('Should pass when undefined', () => {
        const value = undefined
        const errors = validation.Post.validateVisibility(value)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'public'", () => {
        const value = 'public'
        const errors = validation.Post.validateVisibility(value)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'private'", () => {
        const value = 'private'
        const errors = validation.Post.validateVisibility(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateFileId', function() {
    it('Should pass when present during creation', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateFileId(value, undefined, 'create')

        expect(errors.length).toBe(0)
    })

    it('Should pass when absent during creation', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateFileId(value, undefined, 'create')

        expect(errors.length).toBe(0)
    })

    it('Should pass when being updated', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.Post.validateFileId(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass when not being updated', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateFileId(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass when null', function() {
        const value = null
        const errors = validation.Post.validateFileId(value)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.Post.validateFileId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('fileId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.Post.validateFileId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('fileId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateFileId(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateLinkPreviewId', function() {
    it('Should pass when present during creation', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateLinkPreviewId(value, undefined, 'create')

        expect(errors.length).toBe(0)
    })

    it('Should pass when absent during creation', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateLinkPreviewId(value, undefined, 'create')

        expect(errors.length).toBe(0)
    })

    it('Should pass when being updated', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.Post.validateLinkPreviewId(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass when not being updated', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateLinkPreviewId(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass when null', function() {
        const value = null
        const errors = validation.Post.validateLinkPreviewId(value)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.Post.validateLinkPreviewId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('linkPreviewId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.Post.validateLinkPreviewId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('linkPreviewId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateLinkPreviewId(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateSharedPostId', function() {
    it('Should pass when present during creation', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateSharedPostId(value, undefined, 'create')

        expect(errors.length).toBe(0)
    })

    it('Should pass when absent during creation', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateSharedPostId(value, undefined, 'create')

        expect(errors.length).toBe(0)
    })

    it('Should pass when being updated', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.Post.validateSharedPostId(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass when not being updated', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateSharedPostId(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass when null', function() {
        const value = null
        const errors = validation.Post.validateSharedPostId(value)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.Post.validateSharedPostId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('sharedPostId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.Post.validateSharedPostId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('sharedPostId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateSharedPostId(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateSiteModerationId', function() {
    it('Should pass when present during creation', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateSiteModerationId(value, undefined, 'create')

        expect(errors.length).toBe(0)
    })

    it('Should pass when absent during creation', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateSiteModerationId(value, undefined, 'create')

        expect(errors.length).toBe(0)
    })

    it('Should pass when being updated', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.Post.validateSiteModerationId(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass when not being updated', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateSiteModerationId(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass when null', function() {
        const value = null
        const errors = validation.Post.validateSiteModerationId(value)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.Post.validateSiteModerationId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('siteModerationId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.Post.validateSiteModerationId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('siteModerationId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateSiteModerationId(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateGroupModerationId', function() {
    it('Should pass when present during creation', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateGroupModerationId(value, undefined, 'create')

        expect(errors.length).toBe(0)
    })

    it('Should pass when absent during creation', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateGroupModerationId(value, undefined, 'create')

        expect(errors.length).toBe(0)
    })

    it('Should pass when being updated', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.Post.validateGroupModerationId(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass when not being updated', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateGroupModerationId(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass when null', function() {
        const value = null
        const errors = validation.Post.validateGroupModerationId(value)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.Post.validateGroupModerationId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('groupModerationId:invalid')
    })

    it('Should return an error when not a valid uuid', function() {
        const value = 'test-id'
        const errors = validation.Post.validateGroupModerationId(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('groupModerationId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const value = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Post.validateGroupModerationId(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateActivity', function() {
    it('Should pass when activity is undefined', function() {
        const activity = undefined
        const errors = validation.Post.validateActivity(activity)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when activity is set', function() {
        const activity = 10 
        const errors = validation.Post.validateActivity(activity)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('activity:not-allowed')
    })

    it('Should return an error when activity is being updated', function() {
        const activity = 10 
        const existing = 9 
        const errors = validation.Post.validateActivity(activity, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('activity:not-allowed')
    })
})

describe('validateContent', () => {
    it('Should pass when being updated', function() {
        const value = 'This is a content.'
        const existing = 'It may be updated.'
        const errors = validation.Post.validateContent(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass when not being updated', function() {
        const value = 'This is a content.'
        const existing = 'This is a content.'
        const errors = validation.Post.validateContent(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should return an error when null', () => {
        const value = null
        const errors = validation.Post.validateContent(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('content:null')
    })

    it('Should return an error when not a string', () => {
        const value = 5
        const errors = validation.Post.validateContent(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('content:invalid-type')
    })

    it('Should pass when an empty string', () => {
        const value = '' 
        const errors = validation.Post.validateContent(value)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when too long', () => {
        const value = `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

        aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`

        const errors = validation.Post.validateContent(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('content:too-long')
    })

    it("Should pass when an appropriate length value.", () => {
        const value = `Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

        Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

        Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.`

        const errors = validation.Post.validateContent(value)

        expect(errors.length).toBe(0)
    })
})


describe('validateCreatedDate', function() {
    it('Should pass when createdDate is undefined', function() {
        const createdDate = undefined
        const errors = validation.Post.validateCreatedDate(createdDate)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when createdDate is set', function() {
        const createdDate = 'July 4th, 2005'
        const errors = validation.Post.validateCreatedDate(createdDate)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('createdDate:not-allowed')
    })

    it('Should return an error when createdDate is being updated', function() {
        const createdDate = 'July 4th, 2005'
        const existing = 'July 5th, 2005'
        const errors = validation.Post.validateCreatedDate(createdDate, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('createdDate:not-allowed')
    })
})

describe('validateUpdatedDate', function() {
    it('Should pass when updatedDate is undefined', function() {
        const updatedDate = undefined
        const errors = validation.Post.validateUpdatedDate(updatedDate)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when updatedDate is set', function() {
        const updatedDate = 'July 4th, 2005'
        const errors = validation.Post.validateUpdatedDate(updatedDate)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('updatedDate:not-allowed')
    })

    it('Should return an error when updatedDate is being updated', function() {
        const updatedDate = 'July 4th, 2005'
        const existing = 'July 5th, 2005'
        const errors = validation.Post.validateUpdatedDate(updatedDate, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('updatedDate:not-allowed')
    })
})

describe('validate', function() {
    it('Should return errors for an invalid post', function() {
        const post = {
            userId: null,
            groupId: 'test',
            type: 'open',
            visibility: 'hidden',
            fileId: 'test',
            linkPreviewId: 'test',
            sharedPostId: 'test',
            siteModerationId: 'test',
            groupModerationId: 'test',
            activity: 'test',
            content: 5,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }
        const errors = validation.Post.validate(post)

        expect(errors.all.length).toBe(13)
        expect(errors.userId.length).toBe(1)
        expect(errors.groupId.length).toBe(1)
        expect(errors.type.length).toBe(1)
        expect(errors.fileId.length).toBe(1)
        expect(errors.linkPreviewId.length).toBe(1)
        expect(errors.sharedPostId.length).toBe(1)
        expect(errors.siteModerationId.length).toBe(1)
        expect(errors.groupModerationId.length).toBe(1)
        expect(errors.activity.length).toBe(1)
        expect(errors.content.length).toBe(1)
        expect(errors.createdDate.length).toBe(1)
        expect(errors.updatedDate.length).toBe(1)
        
    })

    it('Should pass a valid post', function() {
        const post = {
            userId: '0be69c1f-402d-4dec-bba0-e0ac2a0586ff',
            type: 'feed',
            visibility: 'public',
            fileId: '85a4fb5a-f6d3-4c5c-80b5-6139827b69e9',
            content: 'This is a test post.' 
        }

        const errors = validation.Post.validate(post)

        expect(errors.all.length).toBe(0)
    })
})
