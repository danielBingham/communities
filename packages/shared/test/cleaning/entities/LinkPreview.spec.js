const { cleaning }  = require('../../../')

describe('LinkPreview', function() {
    it("Should clean a complete entity", function() {
        const linkPreview = {
            id: ' a335d429-a7c5-429a-b6b0-5413e94e7921 ',
            url: ' httP://ExAmPlE.com ',
            title: ' A test title ',
            type: ' website ',
            siteName: ' Example ',
            description: ' A test description       ',
            imageUrl: ' HTTPS://EXAMPLE.COM         ',
            createdDate: ' TIMESTAMP ',
            updatedDate: ' TIMESTAMP '
        }

        const cleaned = cleaning.LinkPreview.clean(linkPreview) 
        const expected = {
            id: 'a335d429-a7c5-429a-b6b0-5413e94e7921',
            url: 'httP://ExAmPlE.com',
            title: 'A test title',
            type: 'website',
            siteName: 'Example',
            description: 'A test description',
            imageUrl: 'HTTPS://EXAMPLE.COM',
            createdDate: ' TIMESTAMP ',
            updatedDate: ' TIMESTAMP '
        }

        expect(cleaned).toStrictEqual(expected)
    })

    it("Should remove extra fields", function() {
        const linkPreview = {
            id: ' a335d429-a7c5-429a-b6b0-5413e94e7921 ',
            url: ' httP://ExAmPlE.com ',
            title: ' A test title ',
            type: ' website ',
            siteName: ' Example ',
            description: ' A test description       ',
            imageUrl: ' HTTPS://EXAMPLE.COM         ',
            createdDate: ' TIMESTAMP ',
            updatedDate: ' TIMESTAMP ',
            extra: 'test',
            data: 'inserted'
        }

        const cleaned = cleaning.LinkPreview.clean(linkPreview) 
        const expected = {
            id: 'a335d429-a7c5-429a-b6b0-5413e94e7921',
            url: 'httP://ExAmPlE.com',
            title: 'A test title',
            type: 'website',
            siteName: 'Example',
            description: 'A test description',
            imageUrl: 'HTTPS://EXAMPLE.COM',
            createdDate: ' TIMESTAMP ',
            updatedDate: ' TIMESTAMP '
        }

        expect(cleaned).toStrictEqual(expected)

    })

    it("Should clean an incomplete entity", function() {
        const linkPreview = {
            id: ' a335d429-a7c5-429a-b6b0-5413e94e7921 ',
            url: ' httP://ExAmPlE.com ',
            title: ' A test title ',
            description: ' A test description       ',
            imageUrl: ' HTTPS://EXAMPLE.COM         ',
        }

        const cleaned = cleaning.LinkPreview.clean(linkPreview) 
        const expected = {
            id: 'a335d429-a7c5-429a-b6b0-5413e94e7921',
            url: 'httP://ExAmPlE.com',
            title: 'A test title',
            description: 'A test description',
            imageUrl: 'HTTPS://EXAMPLE.COM',
        }

        expect(cleaned).toStrictEqual(expected)

    })
})

