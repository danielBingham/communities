const { lib } = require('../../../')

describe('parseMentions()', function() {

    it("Should return a list of all usernames mentioned", function() {
        const testString = `This is a test @johndoe and we'll just have to see if it works. @jane.doe @bob_smith`

        const usernames = lib.mentions.parseMentions(testString)

        expect(usernames).toStrictEqual([ 'johndoe', 'jane.doe', 'bob_smith' ])
    })

    it("Should correctly return the usernames when embedded in the text with characters not allowed to be part of the username", function() {
        const testString = `@john_doe! That's really cool.  @bobsmith, did you see what @john_doe is doing?`

        const usernames = lib.mentions.parseMentions(testString)

        expect(usernames).toStrictEqual([ 'john_doe', 'bobsmith', 'john_doe' ])
    })
})
