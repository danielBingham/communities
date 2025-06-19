const { lib } = require('../../../')

describe('tokenizeMentions()', function() {

    it("Should return the string split into sections on each mention", function() {
        const testString = `This is a test @johndoe and we'll just have to see if it works. @jane.doe @bob_smith`
        const expected = [ `This is a test `, `@johndoe`, ` and we'll just have to see if it works. `, `@jane.doe`, ` `, `@bob_smith`, '' ]

        const result = lib.mentions.tokenizeMentions(testString)
        console.log(result)

        expect(result).toStrictEqual(expected)
    })

})
