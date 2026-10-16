const { lib } = require('../../')

const { toPreviewText } = lib.markdown

describe('lib.markdown', function() {

    describe('toPreviewText()', function() {
        it('Should return an empty string for anything that isn\'t Markdown', function() {
            for(const value of [ undefined, null, 5, {}, '', '   \n\n  ' ]) {
                expect(toPreviewText(value)).toBe('')
            }
        })

        it('Should join paragraphs and lines into one line of text', function() {
            expect(toPreviewText('First paragraph,\nstill the first.\n\n\nSecond   paragraph.\r\n'))
                .toBe('First paragraph, still the first. Second paragraph.')
        })

        it('Should leave out headings', function() {
            expect(toPreviewText('# A Test Post\n\nCreated by the integration test suite.  **Markdown** and all.'))
                .toBe('Created by the integration test suite. Markdown and all.')
            expect(toPreviewText('Intro.\n\n## Section ##\nBody.\n\n###### Small\n\nEnd.')).toBe('Intro. Body. End.')
            expect(toPreviewText('A Setext Heading\n================\n\nBody.\n\nAnother\n---\n\nEnd.')).toBe('Body. End.')
        })

        it('Should not mistake a hashtag for a heading', function() {
            expect(toPreviewText('#cooperatives are the answer.')).toBe('#cooperatives are the answer.')
        })

        it('Should keep the text of links and leave out images', function() {
            expect(toPreviewText('Read [the roadmap](/about/roadmap "Roadmap") and ![a chart](/chart.png) [our FAQ][faq].\n\n[faq]: /about/faq'))
                .toBe('Read the roadmap and our FAQ.')
            expect(toPreviewText('Mail <mailto:hello@communities.social> or see <https://communities.social>.'))
                .toBe('Mail mailto:hello@communities.social or see https://communities.social.')
        })

        it('Should keep the text of emphasis, strong, strikethrough and inline code', function() {
            expect(toPreviewText('Some *emphasis*, __strong__, **strong**, _em_, ~~gone~~ and `code()`.'))
                .toBe('Some emphasis, strong, strong, em, gone and code().')
        })

        it('Should leave underscores inside words alone', function() {
            expect(toPreviewText('Set feature_flag_name and snake_case_too.')).toBe('Set feature_flag_name and snake_case_too.')
        })

        it('Should not mistake arithmetic for emphasis', function() {
            expect(toPreviewText('2 * 3 * 4 = 24')).toBe('2 * 3 * 4 = 24')
        })

        it('Should leave out code blocks', function() {
            expect(toPreviewText('Before.\n\n```js\nconst a = "*not emphasis*"\n```\n\nAfter.')).toBe('Before. After.')
            expect(toPreviewText('Before.\n\n~~~~\ncode\n~~~~\n\nAfter.')).toBe('Before. After.')
            expect(toPreviewText('Before.\n\n    indented code\n    more code\n\nAfter.')).toBe('Before. After.')
            expect(toPreviewText('Before.\n\n```\nnever closed')).toBe('Before.')
        })

        it('Should keep the text of lists and block quotes without their markers', function() {
            expect(toPreviewText('Goals:\n\n- Funded by users\n* Governed by members\n1. Non-profit\n2) Cooperative\n- [x] Done'))
                .toBe('Goals: Funded by users Governed by members Non-profit Cooperative Done')
            expect(toPreviewText('> Quoted\n> > Nested quote\n\nAfter.')).toBe('Quoted Nested quote After.')
        })

        it('Should leave out horizontal rules', function() {
            expect(toPreviewText('Before.\n\n---\n\n***\n\n_ _ _\n\nAfter.')).toBe('Before. After.')
        })

        it('Should leave out raw HTML tags and comments, but not angle brackets in text', function() {
            expect(toPreviewText('Some <b>bold</b> text.<br/><!-- a comment -->\n\n1 < 2 and 3 > 2.'))
                .toBe('Some bold text. 1 < 2 and 3 > 2.')
        })

        it('Should keep escaped characters as text rather than syntax', function() {
            expect(toPreviewText('\\*Not emphasis\\*, \\# not a heading and a \\\\ backslash.'))
                .toBe('*Not emphasis*, # not a heading and a \\ backslash.')
            expect(toPreviewText('\\# Not a heading')).toBe('# Not a heading')
        })
    })
})
