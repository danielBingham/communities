const { lib } = require('../../')

const { parseUSDate } = lib.date

describe('lib.date', function() {
    describe('parseUSDate()', function() {
        it('Should parse a date written MM/DD/YYYY into its parts', function() {
            expect(parseUSDate('09/30/2026')).toEqual({ year: 2026, month: 9, day: 30 })
            expect(parseUSDate('03/31/2026')).toEqual({ year: 2026, month: 3, day: 31 })
            expect(parseUSDate('02/29/2024')).toEqual({ year: 2024, month: 2, day: 29 })
        })

        it('Should refuse dates that aren\'t on the calendar', function() {
            for(const value of [ '04/31/2026', '02/29/2026', '13/01/2026', '00/01/2026', '01/00/2026' ]) {
                expect(parseUSDate(value)).toBeNull()
            }
        })

        it('Should refuse other formats and types', function() {
            for(const value of [ '2026-09-30', '9/30/2026', '09/30/26', '09/30/2026 ', undefined, null, 20260930 ]) {
                expect(parseUSDate(value)).toBeNull()
            }
        })
    })
})
