const { cleaning }  = require('../../../')

describe('GroupModeration', function() {
    it("Should clean a complete entity", function() {
        const groupModeration = {
            id: ' a335d429-a7c5-429a-b6b0-5413e94e7921 ',
            userId: ' 4c73dbae-3d03-43cd-b03d-5be4953b832b ',
            status: ' flagged ',
            reason: '       A test reason ',
            postId: ' ff6234c5-f49d-4774-b738-3251fe16fb66 ',
            postCommentId: ' ff6234c5-f49d-4774-b738-3251fe16fb66 ',
            createdDate: ' TIMESTAMP ',
            updatedDate: ' TIMESTAMP '
        }

        const cleaned = cleaning.GroupModeration.clean(groupModeration) 
        const expected = {
            id: 'a335d429-a7c5-429a-b6b0-5413e94e7921',
            userId: '4c73dbae-3d03-43cd-b03d-5be4953b832b',
            status: 'flagged',
            reason: 'A test reason',
            postId: 'ff6234c5-f49d-4774-b738-3251fe16fb66',
            postCommentId: 'ff6234c5-f49d-4774-b738-3251fe16fb66',
            createdDate: ' TIMESTAMP ',
            updatedDate: ' TIMESTAMP '
        }

        expect(cleaned).toStrictEqual(expected)
    })

    it("Should remove extra fields", function() {
        const groupModeration = {
            id: ' a335d429-a7c5-429a-b6b0-5413e94e7921 ',
            userId: ' 4c73dbae-3d03-43cd-b03d-5be4953b832b ',
            status: ' flagged ',
            reason: '       A test reason ',
            postId: ' ff6234c5-f49d-4774-b738-3251fe16fb66 ',
            postCommentId: ' ff6234c5-f49d-4774-b738-3251fe16fb66 ',
            createdDate: ' TIMESTAMP ',
            updatedDate: ' TIMESTAMP ',
            extra: 'test',
            data: 'inserted'
        }

        const cleaned = cleaning.GroupModeration.clean(groupModeration) 
        const expected = {
            id: 'a335d429-a7c5-429a-b6b0-5413e94e7921',
            userId: '4c73dbae-3d03-43cd-b03d-5be4953b832b',
            status: 'flagged',
            reason: 'A test reason',
            postId: 'ff6234c5-f49d-4774-b738-3251fe16fb66',
            postCommentId: 'ff6234c5-f49d-4774-b738-3251fe16fb66',
            createdDate: ' TIMESTAMP ',
            updatedDate: ' TIMESTAMP '
        }

        expect(cleaned).toStrictEqual(expected)

    })

    it("Should clean an incomplete entity", function() {
        const groupModeration = {
            id: ' a335d429-a7c5-429a-b6b0-5413e94e7921 ',
            userId: ' 4c73dbae-3d03-43cd-b03d-5be4953b832b ',
            status: ' flagged ',
            postCommentId: ' ff6234c5-f49d-4774-b738-3251fe16fb66 ',
            createdDate: ' TIMESTAMP ',
            updatedDate: ' TIMESTAMP '
        }

        const cleaned = cleaning.GroupModeration.clean(groupModeration) 
        const expected = {
            id: 'a335d429-a7c5-429a-b6b0-5413e94e7921',
            userId: '4c73dbae-3d03-43cd-b03d-5be4953b832b',
            status: 'flagged' ,
            postCommentId: 'ff6234c5-f49d-4774-b738-3251fe16fb66',
            createdDate: ' TIMESTAMP ',
            updatedDate: ' TIMESTAMP '
        }

        expect(cleaned).toStrictEqual(expected)

    })
})

