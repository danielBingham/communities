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
})

