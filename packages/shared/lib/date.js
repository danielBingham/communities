/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
// 2007--
// Enforce the correct format on each segment of a date.
const coerceDateSegmentFormat = function(segment, length, shouldPad, minValue, maxValue) {
    if ( segment === undefined || segment === null ) {
        return ['', ''] 
    }

    if ( segment.length < length && shouldPad ) {
        while(segment.length < length ) {
            segment = '0' + segment
        }
    }

    // Clean out all non-digits.
    segment = segment.replaceAll(/[^0-9]/g, '')

    // If there's extra, chop it off and return it.
    let extra = ''
    if ( segment.length > length ) {
        extra = segment.substring(length)
        segment = segment.substring(0,length)
    }

    // Make sure we're within the valid value range.
    const value = parseInt(segment)
    if ( maxValue !== undefined ) {
        if ( value > maxValue ) {
            // We don't need to zero pad because the max values should all
            // be greater than the padding.
            segment = '' + maxValue
        }
    }

    if ( minValue !== undefined ) {
        if ( segment.length === length && value < minValue ) {
            if ( minValue < 10 ) {
                segment = '0' + minValue
            } else {
                segment = '' + minValue
            }
        }
    }

    return [segment, extra]
}

// Calculate leap years.
const isLeapYear = function(year)  {
    let integerYear = typeof year === 'number' ? Math.floor(year) : parseInt(year)

    let isLeapYear = false
    if ( integerYear % 4 === 0 && integerYear % 100 !== 0 ) {
        isLeapYear = true
    } else if ( integerYear % 4 === 0 && integerYear % 100 === 0 && integerYear % 400 === 0 ) {
        isLeapYear = true
    }

    return isLeapYear
}

// Determine maximum days in this month.
const getDaysInMonth = function(month, year) {
    let integerMonth = typeof month === 'number' ? Math.floor(month) : parseInt(month)
    
    if ( integerMonth < 1 || integerMonth > 12 ) {
        return 31
    }

    let maxDays = 31
    let thirtyDays = [ 9, 3, 6, 11 ]
    if ( thirtyDays.includes(integerMonth) ) {
        maxDays = 30
    } else if ( integerMonth === 2 && ! isLeapYear(year)) {
        maxDays = 28
    } else if ( integerMonth === 2 && isLeapYear(year)) {
        maxDays = 29
    }

    return maxDays
}

/**
 * 86-7-1
 * Coerce a string to be a correctly formatted and valid date.  Assumes the
 * string may be a partial value in the process of creation, and takes a
 * previous version of the value to cover cases of typing.
 *
 * @param
 */
const coerceDateFormat = function(value, oldValue) {
    let [ year, month, day ] = value.split('-')

    let areDeleting = false
    if ( oldValue !== undefined && oldValue !== null && typeof oldValue === 'string' ) {
        areDeleting = value.length < oldValue.length
    }

    console.log(`oldValue: `, oldValue)
    console.log(`Value: `, value)
    console.log(`areDeleting: `, areDeleting)
    console.log(`Year: `, year, `Month: `, month, `Day: `, day)

    // For each segment, take the ceorced segment and override the current
    // segment.  Take the extra and pre-pend it to the next segment before
    // ceorcing it.
    let [newYear, monthExtra] = coerceDateSegmentFormat(year, 4, month !== undefined && month !== '')
    year = newYear
    month = monthExtra + month

    let [newMonth, dayExtra] = coerceDateSegmentFormat(month, 2, day !== undefined && day !== '', 1, 12)
    month = newMonth
    day = dayExtra + day

    let [newDay, extra] = coerceDateSegmentFormat(day, 2, false, 1, getDaysInMonth(month, year))
    day = newDay

    console.log(`After coersion:: Year: `, year, `Month: `, month, `Day: `, day)
    // Now reassemble the new date value from our coerced segments.
    let newValue = ''

    newValue += year
    if ( year.length === 4 && ! ( areDeleting && month.length === 0) ) {
        newValue += '-'
    }

    newValue += month
    if ( month.length === 2 && ! ( areDeleting && day.length === 0) ) {
        newValue += '-'
    }

    newValue += day

    return newValue
}

const getAgeFromDate = function(dateString) {
    const date = new Date(dateString)
    const now = new Date() 

    let age = now.getUTCFullYear() - date.getUTCFullYear()
    const month = now.getUTCMonth() - date.getUTCMonth()
    const day = now.getUTCDate() - date.getUTCDate()

    if ( month < 0 || (month === 0 && day < 0) ) {
        age = age - 1
    }

    return age
}

module.exports = {
    coerceDateFormat: coerceDateFormat,
    coerceDateSegmentFormat: coerceDateSegmentFormat,
    isLeapYear: isLeapYear,
    getDaysInMonth: getDaysInMonth,
    getAgeFromDate: getAgeFromDate
}

