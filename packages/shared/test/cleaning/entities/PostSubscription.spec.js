const { cleaning }  = require('../../../')

describe('PostSubscription', function() {
    it("Should clean a complete entity", function() {
        const postSubscription = {
            id: ' a335d429-a7c5-429a-b6b0-5413e94e7921 ',
            userId: ' fa078f92-2bb7-4353-b38c-5ac14e16c3f1 ',
            postId: '   cc148e0e-c2ac-43a3-a0bc-d79747f103b1    ',
            createdDate: ' TIMESTAMP ',
            updatedDate: ' TIMESTAMP '
        }

        const cleaned = cleaning.PostSubscription.clean(postSubscription) 
        const expected = {
            id: 'a335d429-a7c5-429a-b6b0-5413e94e7921',
            userId: 'fa078f92-2bb7-4353-b38c-5ac14e16c3f1',
            postId: 'cc148e0e-c2ac-43a3-a0bc-d79747f103b1',
            createdDate: ' TIMESTAMP ',
            updatedDate: ' TIMESTAMP '
        }

        expect(cleaned).toStrictEqual(expected)
    })

    it("Should remove extra fields", function() {
        const postSubscription = {
            id: 'a335d429-a7c5-429a-b6b0-5413e94e7921',
            userId: 'fa078f92-2bb7-4353-b38c-5ac14e16c3f1',
            postId: 'cc148e0e-c2ac-43a3-a0bc-d79747f103b1',
            createdDate: ' TIMESTAMP ',
            updatedDate: ' TIMESTAMP ',
            extra: 'test',
            data: 'inserted'
        }

        const cleaned = cleaning.PostSubscription.clean(postSubscription) 
        const expected = {
            id: 'a335d429-a7c5-429a-b6b0-5413e94e7921',
            userId: 'fa078f92-2bb7-4353-b38c-5ac14e16c3f1',
            postId: 'cc148e0e-c2ac-43a3-a0bc-d79747f103b1',
            createdDate: ' TIMESTAMP ',
            updatedDate: ' TIMESTAMP '
        }

        expect(cleaned).toStrictEqual(expected)

    })

    it("Should clean an incomplete entity", function() {
        const postSubscription = {
            id: '   a335d429-a7c5-429a-b6b0-5413e94e7921 ',
            postId: 'cc148e0e-c2ac-43a3-a0bc-d79747f103b1   ',
        }

        const cleaned = cleaning.PostSubscription.clean(postSubscription) 
        const expected = {
            id: 'a335d429-a7c5-429a-b6b0-5413e94e7921',
            postId: 'cc148e0e-c2ac-43a3-a0bc-d79747f103b1',
        }

        expect(cleaned).toStrictEqual(expected)

    })
})

