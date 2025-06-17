const { validation }  = require('../../../')


describe('validateId', function() {
    it('Should return an error when id is null', function() {
        const id = null
        const errors = validation.LinkPreview.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:null')
    })

    it('Should return an error when id is not a string', function() {
        const id = 5
        const errors = validation.LinkPreview.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:invalid')
    })

    it('Should return an error when id is not a valid uuid', function() {
        const id = 'test-id'
        const errors = validation.LinkPreview.validateId(id)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('id:invalid')
    })

    it('Should pass a valid UUID', function() {
        const id = 'd209158e-5c58-44e1-ab00-12b45aad065f'
        const errors = validation.LinkPreview.validateId(id)

        expect(errors.length).toBe(0)
    })
})

describe('validateUrl', function() {
    it("Should return an error when undefined while creating", function() {
        const value = undefined 
        const errors = validation.LinkPreview.validateUrl(value, undefined, 'create')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('url:required')
    })

    it("Should return an error when updated", function() {
        const value = 'https://example.com'
        const existing = 'https://test.com'
        const errors = validation.LinkPreview.validateUrl(value, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('url:not-allowed')
    })

    it('Should return an error when null', function() {
        const value = null
        const errors = validation.LinkPreview.validateUrl(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('url:null')
    })

    it('Should return an error when an empty string', function() {
        const value = '' 
        const errors = validation.LinkPreview.validateUrl(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('url:required')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.LinkPreview.validateUrl(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('url:invalid-type')
    })

    it('Should return an error when not a valid url', function() {
        const value = 'test'
        const errors = validation.LinkPreview.validateUrl(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('url:invalid')
    })

    it('Should pass a valid URL', function() {
        const value = 'http://example.com'
        const errors = validation.LinkPreview.validateUrl(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateTitle', function() {
    it("Should return an error when title is undefined while creating", function() {
        const value = undefined 
        const errors = validation.LinkPreview.validateTitle(value, undefined, 'create')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('title:required')
    })

    it('Should return an error when null', function() {
        const value = null
        const errors = validation.LinkPreview.validateTitle(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('title:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.LinkPreview.validateTitle(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('title:invalid-type')
    })

    it("Should return an error when more than 512 characters", function() {
        const value = `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
        const errors = validation.LinkPreview.validateTitle(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('title:too-long')
        expect(value.length).toBeGreaterThan(512)
    })

    it("Should pass when less than 512 characters", function() {
        const value = `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
        const errors = validation.LinkPreview.validateTitle(value)

        expect(errors.length).toBe(0)
        expect(value.length).toBeLessThan(512)
    })
})

describe('validateType', function() {
    it("Should return an error when type is undefined while creating", function() {
        const value = undefined 
        const errors = validation.LinkPreview.validateType(value, undefined, 'create')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('type:required')
    })

    it('Should return an error when null', function() {
        const value = null
        const errors = validation.LinkPreview.validateType(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('type:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.LinkPreview.validateType(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('type:invalid-type')
    })

    it("Should return an error when more than 512 characters", function() {
        const value = `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
        const errors = validation.LinkPreview.validateType(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('type:too-long')
        expect(value.length).toBeGreaterThan(512)
    })

    it("Should pass when less than 512 characters", function() {
        const value = `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
        const errors = validation.LinkPreview.validateType(value)

        expect(errors.length).toBe(0)
        expect(value.length).toBeLessThan(512)
    })
})

describe('validateSiteName', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.LinkPreview.validateSiteName(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('siteName:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.LinkPreview.validateSiteName(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('siteName:invalid-type')
    })

    it("Should return an error when more than 512 characters", function() {
        const value = `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
        const errors = validation.LinkPreview.validateSiteName(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('siteName:too-long')
        expect(value.length).toBeGreaterThan(512)
    })

    it("Should pass when less than 512 characters", function() {
        const value = `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
        const errors = validation.LinkPreview.validateSiteName(value)

        expect(errors.length).toBe(0)
        expect(value.length).toBeLessThan(512)
    })
})

describe('validateDescription', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.LinkPreview.validateDescription(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('description:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.LinkPreview.validateDescription(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('description:invalid-type')
    })

    it("Should return an error when more than 2048 characters", function() {
        const value = `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        `
        const errors = validation.LinkPreview.validateDescription(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('description:too-long')
        expect(value.length).toBeGreaterThan(2048)
    })

    it("Should pass when less than 2048 characters", function() {
        const value = `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
        const errors = validation.LinkPreview.validateDescription(value)

        expect(errors.length).toBe(0)
        expect(value.length).toBeLessThan(2048)
    })
})

describe('validateImageUrl', function() {
    it('Should return an error when null', function() {
        const value = null
        const errors = validation.LinkPreview.validateImageUrl(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('imageUrl:null')
    })

    it('Should pass when an empty string', function() {
        const value = '' 
        const errors = validation.LinkPreview.validateImageUrl(value)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.LinkPreview.validateImageUrl(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('imageUrl:invalid-type')
    })

    it('Should return an error when not a valid imageUrl', function() {
        const value = 'test'
        const errors = validation.LinkPreview.validateImageUrl(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('imageUrl:invalid')
    })

    it('Should pass a valid URL', function() {
        const value = 'http://example.com'
        const errors = validation.LinkPreview.validateImageUrl(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateCreatedDate', function() {
    it('Should pass when createdDate is undefined', function() {
        const createdDate = undefined
        const errors = validation.LinkPreview.validateCreatedDate(createdDate)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when createdDate is set', function() {
        const createdDate = 'July 4th, 2005'
        const errors = validation.LinkPreview.validateCreatedDate(createdDate)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('createdDate:not-allowed')
    })

    it('Should return an error when createdDate is being updated', function() {
        const createdDate = 'July 4th, 2005'
        const existing = 'July 5th, 2005'
        const errors = validation.LinkPreview.validateCreatedDate(createdDate, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('createdDate:not-allowed')
    })
})

describe('validateUpdatedDate', function() {
    it('Should pass when updatedDate is undefined', function() {
        const updatedDate = undefined
        const errors = validation.LinkPreview.validateUpdatedDate(updatedDate)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when updatedDate is set', function() {
        const updatedDate = 'July 4th, 2005'
        const errors = validation.LinkPreview.validateUpdatedDate(updatedDate)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('updatedDate:not-allowed')
    })

    it('Should return an error when updatedDate is being updated', function() {
        const updatedDate = 'July 4th, 2005'
        const existing = 'July 5th, 2005'
        const errors = validation.LinkPreview.validateUpdatedDate(updatedDate, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('updatedDate:not-allowed')
    })
})

describe('validate', function() {
    it('Should return errors for an invalid LinkPreview', function() {
        const linkPreview = {
            id: 'test',
            url: null,
            title: null,
            type: null,
            siteName: null,
            description: null,
            imageUrl: null,
            createdDate: ' TIMESTAMP ',
            updatedDate: ' TIMESTAMP '
        }
        const errors = validation.LinkPreview.validate(linkPreview)

        expect(errors.all.length).toBe(9)
        expect(errors.id.length).toBe(1)
        expect(errors.url.length).toBe(1)
        expect(errors.title.length).toBe(1)
        expect(errors.type.length).toBe(1)
        expect(errors.siteName.length).toBe(1)
        expect(errors.description.length).toBe(1)
        expect(errors.imageUrl.length).toBe(1)
        expect(errors.createdDate.length).toBe(1)
        expect(errors.updatedDate.length).toBe(1)
    })

    it('Should return errors for an invalid edit', function() {
        const linkPreview = {
            id: 'd209158e-5c58-44e1-ab00-12b45aad065f',
            url: 'http://test.com',
        }

        const existing = {
            id: 'a335d429-a7c5-429a-b6b0-5413e94e7921',
            url: 'http://example.com',
            title: 'A test title',
            type: 'website',
            siteName: 'Example',
            description: 'A test description',
            imageUrl: 'https://example.com',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }

        const errors = validation.LinkPreview.validate(linkPreview, existing)

        expect(errors.all.length).toBe(1)
    })

    it('Should pass a valid LinkPreview', function() {
        const linkPreview = {
            id: 'a335d429-a7c5-429a-b6b0-5413e94e7921',
            url: 'http://example.com',
            title: 'A test title',
            type: 'website',
            siteName: 'Example',
            description: 'A test description',
            imageUrl: 'https://example.com',
        }

        const errors = validation.LinkPreview.validate(linkPreview)

        expect(errors.all.length).toBe(0)
    })
})
