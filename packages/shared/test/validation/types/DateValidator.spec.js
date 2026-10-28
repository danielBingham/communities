const DateValidator  = require('../../../validation/types/DateValidator')

describe('DateValidator', function() {
    describe('mustBeValidDate()', function() {
        it('should accept any valid date', function() {
            //                   J   F   M   A   M   J   J   A   S   O   N   D
            const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
            for(let year = 1970; year < 2025; year++) {
                for(let month = 1; month <= 12; month++) {
                    for(let day = 1; day <= daysInMonth[month-1]; day++) {
                        let dateString = `${year}-`
                        
                        if ( month < 10 ) {
                            dateString += `0${month}-`
                        } else {
                            dateString += `${month}-`
                        }

                        if ( day < 10 ) {
                            dateString += `0${day}`
                        } else {
                            dateString += `${day}`
                        }

                        const validator = new DateValidator('date', dateString)
                        const errors = validator.mustBeValidDate().getErrors()

                        expect(errors.length).toBe(0)
                    }

                    // Check leap years
                    if ( year % 4 === 0 && month === 2 ) {
                        let day = 29

                        let dateString = `${year}-`
                        
                        if ( month < 10 ) {
                            dateString += `0${month}-`
                        } else {
                            dateString += `${month}-`
                        }

                        if ( day < 10 ) {
                            dateString += `0${day}`
                        } else {
                            dateString += `${day}`
                        }

                        const validator = new DateValidator('date', dateString)
                        const errors = validator.mustBeValidDate().getErrors()

                        expect(errors.length).toBe(0)

                    }
                }
            }
        })

        it('should reject invalid months', function() {
            let dateString = '2025-13-31'
            const validator = new DateValidator('date', dateString)
            const errors = validator.mustBeValidDate().getErrors()

            expect(errors.length).toBe(1)
        })

        it('should reject invalid days', function() {
            let dateString = '2025-12-32'
            const validator = new DateValidator('date', dateString)
            const errors = validator.mustBeValidDate().getErrors()

            expect(errors.length).toBe(1)
        })

        it('should reject 29 day February in non-leap years', function() {
            let dateString = '2025-02-29'
            const validator = new DateValidator('date', dateString)
            const errors = validator.mustBeValidDate().getErrors()

            expect(errors.length).toBe(1)
        })
    })

    describe('mustBeValidUSDate()', function() {
        it('should accept real dates written MM/DD/YYYY', function() {
            for(const dateString of [ '09/30/2026', '01/01/2000', '12/31/1999', '03/31/2026', '02/29/2024', '02/29/2000' ]) {
                const errors = new DateValidator('date', dateString).mustBeValidUSDate().getErrors()
                expect(errors).toEqual([])
            }
        })

        it('should reject days that aren\'t in the month', function() {
            for(const dateString of [ '04/31/2026', '02/29/2025', '02/29/1900', '13/01/2026', '00/10/2026', '10/00/2026', '12/32/2026' ]) {
                const errors = new DateValidator('date', dateString).mustBeValidUSDate().getErrors()
                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('date:invalid')
            }
        })

        it('should reject other formats', function() {
            for(const dateString of [ '2026-09-30', '9/30/2026', '09/30/26', '09-30-2026', ' 09/30/2026', 'September 30, 2026', 'not a date' ]) {
                const errors = new DateValidator('date', dateString).mustBeValidUSDate().getErrors()
                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('date:invalid')
            }
        })

        it('should leave missing, empty and non-string values to the other checks', function() {
            for(const value of [ undefined, null, '', 20260930 ]) {
                const errors = new DateValidator('date', value).mustBeValidUSDate().getErrors()
                expect(errors).toEqual([])
            }
        })
    })
})
