const { validation }  = require('../../../')

describe('validateName', function() {
    it('Should return an error when undefined while creating', function() {
        const value = undefined
        const existing = undefined
        const errors = validation.User.validateName(value, existing, 'create')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('name:required')
    })

    it('Should return an error when null', function() {
        const value = null
        const errors = validation.User.validateName(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('name:null')
    })

    it('Should return an error when not a string', function() {
        const value = 5
        const errors = validation.User.validateName(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('name:invalid-type')
    })

    it('Should return an error when an empty string', function() {
        const value = ''
        const errors = validation.User.validateName(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('name:required')
    })

    it('Should return an error when longer than 512 characters', function() {
        const value = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        const errors = validation.User.validateName(value)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('name:too-long')
    })

    it('Should pass when undefined while editing', function() {
        const value = undefined
        const existing = 'John Doe'
        const errors = validation.User.validateName(value, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass a valid name', function() {
        const value = 'John Doe'
        const errors = validation.User.validateName(value)

        expect(errors.length).toBe(0)
    })
})

describe('validateUsername', function() {
    it('Should return an error when undefined while creating', function() {
        const username = undefined
        const existing = undefined
        const errors = validation.User.validateUsername(username, existing, 'create')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('username:required')
    })

    it('Should return an error if updated', function() {
        const value = 'john-doe-1' 
        const existing = 'john-doe'
        const errors = validation.User.validateUsername(value, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('username:not-allowed')
    })

    it('Should return an error when null', function() {
        const username = null
        const errors = validation.User.validateUsername(username)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('username:null')
    })

    it('Should return an error when not a string', function() {
        const username = 5
        const errors = validation.User.validateUsername(username)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('username:invalid-type')
    })

    it('Should return an error when an empty string', function() {
        const username = ''
        const errors = validation.User.validateUsername(username)

        expect(errors.length).toBe(2)
        expect(errors[0].type).toBe('username:required')
    })

    it('Should return an error when longer than 512 characters', function() {
        const username = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        const errors = validation.User.validateUsername(username)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('username:too-long')
    })

    it('Should return an error when username contains invalid characters', function() {
        const username = 'username with invalid / characters'
        const errors = validation.User.validateUsername(username)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('username:invalid')
    })

    it('Should pass when undefined while editing', function() {
        const username = undefined
        const existing = 'john-doe'
        const errors = validation.User.validateUsername(username, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass a valid username', function() {
        const username = 'john-doe'
        const errors = validation.User.validateUsername(username)

        expect(errors.length).toBe(0)
    })
})

describe('validateEmail', function() {
    it('Should return an error when undefined while creating', function() {
        const email = undefined
        const existing = undefined
        const errors = validation.User.validateEmail(email, existing, 'create')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('email:required')
    })

    it('Should return an error when null', function() {
        const email = null
        const errors = validation.User.validateEmail(email)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('email:null')
    })

    it('Should return an error when not a string', function() {
        const email = 5
        const errors = validation.User.validateEmail(email)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('email:invalid-type')
    })

    it('Should return an error when an empty string', function() {
        const email = ''
        const errors = validation.User.validateEmail(email)

        expect(errors.length).toBe(2)
        expect(errors[0].type).toBe('email:required')
    })

    it('Should return an error when longer than 512 characters', function() {
        const email = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@aaaaaaaaaaaaaaa'
        const errors = validation.User.validateEmail(email)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('email:too-long')
    })

    it('Should return an error when not an email', function() {
        const email = 'not-an-email'
        const errors = validation.User.validateEmail(email)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('email:invalid')
    })

    it('Should pass when undefined while editing', function() {
        const email = undefined
        const existing = 'john@doe.com'
        const errors = validation.User.validateEmail(email, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass a valid email', function() {
        const email = 'john@example.com'
        const errors = validation.User.validateEmail(email)

        expect(errors.length).toBe(0)
    })
})

describe('validatePassword', function() {
    it('Should return an error when undefined while creating', function() {
        const password = undefined
        const existing = undefined
        const errors = validation.User.validatePassword(password, existing, 'create')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('password:required')
    })

    it('Should return an error when null', function() {
        const password = null
        const errors = validation.User.validatePassword(password)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('password:null')
    })

    it('Should return an error when not a string', function() {
        const password = 5
        const errors = validation.User.validatePassword(password)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('password:invalid-type')
    })

    it('Should return an error when an empty string', function() {
        const password = ''
        const errors = validation.User.validatePassword(password)

        expect(errors.length).toBe(2)
        expect(errors[0].type).toBe('password:required')
    })

    it('Should return an error when less than 12 characters', function() {
        const password = 'aaaaaaaaaaa'
        const errors = validation.User.validatePassword(password)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('password:too-short')
    })

    it('Should return an error when longer than 256 characters', function() {
        const password = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        const errors = validation.User.validatePassword(password)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('password:too-long')
    })

    it('Should pass when undefined while editing', function() {
        const password = undefined
        const existing = 'passwordPassword'
        const errors = validation.User.validatePassword(password, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it('Should pass a valid password', function() {
        const password = '3d#V0*@#0L3l!Swr#dX^H14#F%WH4iw#'
        const errors = validation.User.validatePassword(password)

        expect(errors.length).toBe(0)
    })
})

describe('validateStatus', function() {
    it('Should return an error when null', function() {
        const status = null
        const errors = validation.User.validateStatus(status)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('status:null')
    })

    it('Should return an error when not a string', function() {
        const status = 5
        const errors = validation.User.validateStatus(status)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('status:invalid-type')
    })

    it('Should return an error when an empty string', function() {
        const status = ''
        const errors = validation.User.validateStatus(status)

        expect(errors.length).toBe(2)
        expect(errors[0].type).toBe('status:required')
    })

    it('Should return an error when not an status', function() {
        const status = 'not-an-status'
        const errors = validation.User.validateStatus(status)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('status:invalid')
    })

    it('Should pass when undefined while editing', function() {
        const status = undefined
        const existing = 'invited'
        const errors = validation.User.validateStatus(status, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'invited'", function() {
        const status = 'invited'
        const errors = validation.User.validateStatus(status)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'unconfirmed'", function() {
        const status = 'unconfirmed'
        const errors = validation.User.validateStatus(status)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'confirmed'", function() {
        const status = 'confirmed'
        const errors = validation.User.validateStatus(status)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'banned'", function() {
        const status = 'banned'
        const errors = validation.User.validateStatus(status)

        expect(errors.length).toBe(0)
    })
})

describe('validateSiteRole', function() {
    it('Should return an error when null', function() {
        const siteRole = null
        const errors = validation.User.validateSiteRole(siteRole)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('siteRole:null')
    })

    it('Should return an error when not a string', function() {
        const siteRole = 5
        const errors = validation.User.validateSiteRole(siteRole)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('siteRole:invalid-type')
    })

    it('Should return an error when an empty string', function() {
        const siteRole = ''
        const errors = validation.User.validateSiteRole(siteRole)

        expect(errors.length).toBe(2)
        expect(errors[0].type).toBe('siteRole:required')
    })

    it('Should return an error when not an siteRole', function() {
        const siteRole = 'not-an-siteRole'
        const errors = validation.User.validateSiteRole(siteRole)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('siteRole:invalid')
    })

    it('Should pass when undefined while editing', function() {
        const siteRole = undefined
        const existing = 'invited'
        const errors = validation.User.validateSiteRole(siteRole, existing, 'update')

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'user'", function() {
        const siteRole = 'user'
        const errors = validation.User.validateSiteRole(siteRole)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'moderator'", function() {
        const siteRole = 'moderator'
        const errors = validation.User.validateSiteRole(siteRole)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'admin'", function() {
        const siteRole = 'admin'
        const errors = validation.User.validateSiteRole(siteRole)

        expect(errors.length).toBe(0)
    })

    it("Should pass when 'superadmin'", function() {
        const siteRole = 'superadmin'
        const errors = validation.User.validateSiteRole(siteRole)

        expect(errors.length).toBe(0)
    })
})

describe('validateAbout', function() {
    it('Should return an error when null', function() {
        const about = null
        const errors = validation.User.validateAbout(about)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('about:null')
    })

    it('Should return an error when not a string', function() {
        const about = 5
        const errors = validation.User.validateAbout(about)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('about:invalid-type')
    })

    it("Should return an error when longer than 250 characters", function() {
        const about = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        const errors = validation.User.validateAbout(about)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('about:too-long')
        expect(about.length).toBeGreaterThan(250)
    })

    it('Should not return an error when an empty string', function() {
        const about = ''
        const errors = validation.User.validateAbout(about)

        expect(errors.length).toBe(0)
    })

    it('Should pass when undefined while editing', function() {
        const about = undefined
        const existing = 'This is my bio...'
        const errors = validation.User.validateAbout(about, existing, 'update')

        expect(errors.length).toBe(0)
    })
})

describe('validateCreatedDate', function() {
    it('Should pass when createdDate is undefined', function() {
        const createdDate = undefined
        const errors = validation.User.validateCreatedDate(createdDate)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when createdDate is set', function() {
        const createdDate = 'July 4th, 2005'
        const errors = validation.User.validateCreatedDate(createdDate)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('createdDate:not-allowed')
    })

    it('Should return an error when createdDate is being updated', function() {
        const createdDate = 'July 4th, 2005'
        const existing = 'July 5th, 2005'
        const errors = validation.User.validateCreatedDate(createdDate, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('createdDate:not-allowed')
    })
})

describe('validateUpdatedDate', function() {
    it('Should pass when updatedDate is undefined', function() {
        const updatedDate = undefined
        const errors = validation.User.validateUpdatedDate(updatedDate)

        expect(errors.length).toBe(0)
    })

    it('Should return an error when updatedDate is set', function() {
        const updatedDate = 'July 4th, 2005'
        const errors = validation.User.validateUpdatedDate(updatedDate)

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('updatedDate:not-allowed')
    })

    it('Should return an error when updatedDate is being updated', function() {
        const updatedDate = 'July 4th, 2005'
        const existing = 'July 5th, 2005'
        const errors = validation.User.validateUpdatedDate(updatedDate, existing, 'update')

        expect(errors.length).toBe(1)
        expect(errors[0].type).toBe('updatedDate:not-allowed')
    })
})

describe('validate', function() {
    it('Should return errors for an invalid user', function() {
        const user = {
            id: null,
            name: null,
            username: null,
            email: null,
            password: null,
            status: null,
            siteRole: null,
            about: null,
            createdDate: 'July 4th',
            updatedDate: 'July 4th'
        }
        const errors = validation.User.validate(user)

        expect(errors.all.length).toBe(10)
        expect(errors.id.length).toBe(1)
        expect(errors.name.length).toBe(1)
        expect(errors.username.length).toBe(1)
        expect(errors.email.length).toBe(1)
        expect(errors.password.length).toBe(1)
        expect(errors.status.length).toBe(1)
        expect(errors.siteRole.length).toBe(1)
        expect(errors.about.length).toBe(1)
        expect(errors.createdDate.length).toBe(1)
        expect(errors.updatedDate.length).toBe(1)
    })

    it('Should return errors for an invalid edit', function() {
        const user = {
            id: 'c6cf7503-eef3-4535-8270-853c9d160ede',
            username: 'john-doe',
        }

        const existing = {
            id: 'c6cf7503-eef3-4535-8270-853c9d160ede',
            username: 'john-b-doe'
        }

        const errors = validation.User.validate(user, existing)

        expect(errors.all.length).toBe(1)
    })

    it('Should pass a valid user', function() {
        const user = {
            name: 'John Doe',
            username: 'john-doe',
            email: 'john.doe@example.com',
            password: 'passwordpassword'
        }

        const errors = validation.User.validate(user)

        expect(errors.all.length).toBe(0)
    })
})
