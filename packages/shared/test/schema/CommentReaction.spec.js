const { schema } = require('../../')

const CommentReactionSchema = schema.CommentReactionSchema

describe('CommentReactionSchema', function() {

    const valid = function(overrides) {
        return {
            id: '0a1e1b8c-5f1a-4bb4-8a8b-6c1e0a5f2d11',
            postId: 'd209158e-5c58-44e1-ab00-12b45aad065f',
            commentId: '6b7f9c22-1a2d-4f1e-9a8e-7c1d2b3a4e5f',
            userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
            reaction: 'like',
            ...overrides
        }
    }

    const types = (errors) => errors.all.map((error) => error.type).sort()

    describe('clean()', function() {
        it('Should keep only CommentReaction properties', function() {
            const cleaned = new CommentReactionSchema().clean(valid({ extra: 'nope', content: 'Not a reaction property.' }))
            expect(Object.keys(cleaned).sort()).toEqual([ 'commentId', 'id', 'postId', 'reaction', 'userId' ])
        })

        it('Should trim the reaction and ids', function() {
            const cleaned = new CommentReactionSchema().clean({
                postId: ' d209158e-5c58-44e1-ab00-12b45aad065f ',
                commentId: '\t6b7f9c22-1a2d-4f1e-9a8e-7c1d2b3a4e5f\n',
                reaction: '  like '
            })
            expect(cleaned).toEqual({
                postId: 'd209158e-5c58-44e1-ab00-12b45aad065f',
                commentId: '6b7f9c22-1a2d-4f1e-9a8e-7c1d2b3a4e5f',
                reaction: 'like'
            })
        })

        it('Should leave values of the wrong type for validation to reject', function() {
            const cleaned = new CommentReactionSchema().clean({ reaction: 5, postId: null })
            expect(cleaned).toEqual({ reaction: 5, postId: null })
        })

        it('Should leave out properties that are undefined', function() {
            expect(new CommentReactionSchema().clean({ reaction: undefined })).toEqual({})
        })

        it('Should pass through a missing body', function() {
            expect(new CommentReactionSchema().clean(undefined)).toBe(undefined)
            expect(new CommentReactionSchema().clean(null)).toBe(null)
        })
    })

    describe('validate() on create', function() {
        it('Should accept a complete reaction', function() {
            expect(new CommentReactionSchema().validate(valid()).all).toEqual([])
        })

        it('Should require postId, commentId, userId, and reaction', function() {
            expect(types(new CommentReactionSchema().validate({}))).toEqual([
                'commentId:required', 'postId:required', 'reaction:required', 'userId:required'
            ])
        })

        it('Should not allow createdDate or updatedDate to be set', function() {
            expect(types(new CommentReactionSchema().validate(valid({ createdDate: 'TIMESTAMP', updatedDate: 'TIMESTAMP' })))).toEqual([
                'createdDate:not-allowed', 'updatedDate:not-allowed'
            ])

            // `null` counts as set.
            expect(types(new CommentReactionSchema().validate(valid({ createdDate: null, updatedDate: null })))).toEqual([
                'createdDate:not-allowed', 'updatedDate:not-allowed'
            ])
        })

        it('Should reject null ids', function() {
            for(const property of [ 'id', 'postId', 'commentId', 'userId' ]) {
                expect(types(new CommentReactionSchema().validate(valid({ [property]: null })))).toEqual([ `${property}:null` ])
            }
        })

        it('Should reject ids that are not uuids', function() {
            for(const property of [ 'id', 'postId', 'commentId', 'userId' ]) {
                expect(types(new CommentReactionSchema().validate(valid({ [property]: 'test-id' })))).toEqual([ `${property}:invalid` ])
                expect(types(new CommentReactionSchema().validate(valid({ [property]: 5 })))).toEqual([ `${property}:invalid` ])
            }
        })

        it('Should reject a null reaction, or one that is not a string', function() {
            expect(types(new CommentReactionSchema().validate(valid({ reaction: null })))).toEqual([ 'reaction:null' ])
            expect(types(new CommentReactionSchema().validate(valid({ reaction: 5 })))).toEqual([ 'reaction:invalid-type' ])
        })

        // PostReactions allow 'dislike' (and used to allow 'block'), but the
        // `comment_reaction_type` enum only has 'like' for now.
        it("Should only accept 'like' reactions", function() {
            expect(CommentReactionSchema.REACTIONS).toEqual([ 'like' ])

            for(const reaction of [ 'dislike', 'block', 'Like', 'test', '' ]) {
                expect(types(new CommentReactionSchema().validate(valid({ reaction: reaction })))).toEqual([ 'reaction:invalid' ])
            }
        })
    })

    describe('validate() on update', function() {
        it('Should require the reaction', function() {
            const reaction = valid()
            delete reaction.reaction
            expect(types(new CommentReactionSchema().validate(reaction, valid()))).toEqual([ 'reaction:required' ])
        })

        it('Should not allow postId, commentId, or userId to be changed', function() {
            const changed = valid({
                postId: '3b0e5c1a-8d0b-4f7b-9a43-1d2c3b4a5e6f',
                commentId: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
                userId: '3f69c43b-9ffc-4685-884a-99ac30629e93'
            })

            expect(types(new CommentReactionSchema().validate(changed, valid()))).toEqual([
                'commentId:not-allowed', 'postId:not-allowed', 'userId:not-allowed'
            ])
        })

        it('Should allow postId, commentId, and userId when they are unchanged', function() {
            expect(new CommentReactionSchema().validate(valid(), valid()).all).toEqual([])
        })
    })

    describe('validating a single property', function() {
        // Controllers validate route parameters on their own, outside of an
        // entity.
        it('Should validate a cleaned route parameter', function() {
            const properties = new CommentReactionSchema().properties

            expect(properties.commentId.validate(properties.commentId.clean(' 6b7f9c22-1a2d-4f1e-9a8e-7c1d2b3a4e5f '))).toEqual([])
            expect(properties.commentId.validate(properties.commentId.clean('not-a-uuid')).map((e) => e.type)).toEqual([ 'commentId:invalid' ])
        })
    })
})
