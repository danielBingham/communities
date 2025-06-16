const { validation }  = require('../../../')

describe('validateId', function() {
    it('Should return an error when id is null', function() {
        const id = null
        const errors = validation.Blocklist.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:null')
    })

    it('Should return an error when id is not a string', function() {
        const id = 5
        const errors = validation.Blocklist.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:invalid')
    })

    it('Should return an error when id is not a valid uuid', function() {
        const id = 'test-id'
        const errors = validation.Blocklist.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:invalid')
    })

    it('Should pass a valid UUID', function() {
        const id = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Blocklist.validateId(id)

        expect(errors.length).toBe(0)
    })
})

describe('validateUserId', function() {
    it('Should return an error when userId is undefined and existing is undefined', function() {
        const userId = undefined
        const errors = validation.Blocklist.validateUserId(userId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:required')
    })

    it('Should return an error when userId is being updated', function() {
        const userId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = '840b8db4-a91e-44e2-a7a3-6922e7e98290'
        const errors = validation.Blocklist.validateUserId(userId, existing)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:not-allowed')
    })

    it('Should pass when userId is not being updated', function() {
        const userId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const existing = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Blocklist.validateUserId(userId, existing)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when userId is null', function() {
        const userId = null
        const errors = validation.Blocklist.validateUserId(userId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:null')
    })

    it('Should return an error when userId is not a string', function() {
        const userId = 5
        const errors = validation.Blocklist.validateUserId(userId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should return an error when userId is not a valid uuid', function() {
        const userId = 'test-id'
        const errors = validation.Blocklist.validateUserId(userId)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('userId:invalid')
    })

    it('Should pass a valid UUID', function() {
        const userId = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.Blocklist.validateUserId(userId)

        expect(errors.length).toBe(0)
    })
})

describe('validateDomain', function() {
    it('Should return an error when domain is undefined and existing is undefined', function() {
        const domain = undefined
        const errors = validation.Blocklist.validateDomain(domain)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('domain:required')
    })

    it('Should return an error when domain is being updated', function() {
        const domain = 'example.com'
        const existing = 'mailinator.com'
        const errors = validation.Blocklist.validateDomain(domain, existing)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('domain:not-allowed')
    })

    it('Should pass when domain is not being updated', function() {
        const domain = 'example.com'
        const existing = 'example.com'
        const errors = validation.Blocklist.validateDomain(domain, existing)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when domain is null', function() {
        const domain = null
        const errors = validation.Blocklist.validateDomain(domain)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('domain:null')
    })

    it('Should return an error when domain is not a string', function() {
        const domain = 10
        const errors = validation.Blocklist.validateDomain(domain)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('domain:invalid-type')
    })

    it('Should return an error when domain is an empty string', function() {
        const domain = '' 
        const errors = validation.Blocklist.validateDomain(domain)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('domain:required')
    })

    it('Should return an error when domain is too long', function() {
        const domain = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        const errors = validation.Blocklist.validateDomain(domain)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('domain:too-long')
    })

    it('Should pass a valid domain', function() {
        const domain = 'example.com'
        const errors = validation.Blocklist.validateDomain(domain)

        expect(errors.length).toBe(0)
    })
})

describe('validateNotes', function() {
    it('Should return an error when notes is null', function() {
        const notes = null
        const errors = validation.Blocklist.validateNotes(notes)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('notes:null')
    })

    it('Should return an error when notes is not a string', function() {
        const notes = 10
        const errors = validation.Blocklist.validateNotes(notes)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('notes:invalid-type')
    })

    it('Should return an error when notes is too long', function() {
        const notes = `
            Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

            Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

            Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

            Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

            Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
        `
        const errors = validation.Blocklist.validateNotes(notes)

        expect(notes.length).toBeGreaterThan(2048)
        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('notes:too-long')
    })

    it('Should pass a valid notes field', function() {
        const notes = 'mailinator.com is for testing purposes only.'
        const errors = validation.Blocklist.validateNotes(notes)

        expect(errors.length).toBe(0)
    })
})

describe('validateCreatedDate', function() {
    it('Should pass when createdDate is undefined', function() {
        const createdDate = undefined
        const errors = validation.Blocklist.validateCreatedDate(createdDate)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when createdDate is set', function() {
        const createdDate = 'July 4th, 2005'
        const errors = validation.Blocklist.validateCreatedDate(createdDate)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('createdDate:not-allowed')
    })

    it('Should return an error when createdDate is being updated', function() {
        const createdDate = 'July 4th, 2005'
        const existing = 'July 5th, 2005'
        const errors = validation.Blocklist.validateCreatedDate(createdDate, existing)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('createdDate:not-allowed')
    })
})

describe('validateUpdatedDate', function() {
    it('Should pass when updatedDate is undefined', function() {
        const updatedDate = undefined
        const errors = validation.Blocklist.validateUpdatedDate(updatedDate)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when updatedDate is set', function() {
        const updatedDate = 'July 4th, 2005'
        const errors = validation.Blocklist.validateUpdatedDate(updatedDate)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('updatedDate:not-allowed')
    })

    it('Should return an error when updatedDate is being updated', function() {
        const updatedDate = 'July 4th, 2005'
        const existing = 'July 5th, 2005'
        const errors = validation.Blocklist.validateUpdatedDate(updatedDate, existing)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('updatedDate:not-allowed')
    })
})

describe('validate', function() {
    it('Should return errors for an invalid blocklist', function() {
        const blocklist = {
            userId: null,
            domain: null,
            notes: null
        }
        const errors = validation.Blocklist.validate(blocklist)

        expect(errors.all.length).toBe(3)
        expect(errors.userId.length).toBe(1)
        expect(errors.domain.length).toBe(1)
        expect(errors.notes.length).toBe(1)
    })

    it('Should pass a valid blocklist', function() {
        const blocklist = {
            userId: 'd209158e-5c58-44e1-ab00-12b45aad065f',
            domain: 'mailinator.com',
            notes: 'Do not allow test domains.'
        }

        const errors = validation.Blocklist.validate(blocklist)

        expect(errors.all.length).toBe(0)
    })
})
