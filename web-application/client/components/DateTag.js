import React from 'react'

import './DateTag.css'


const DateTag = function({ timestamp, type }) {
    const date = new Date(timestamp)
    const now = new Date()

    //TODO TECHDEBT The database is recording dates in a weird way that I don't
    //understand.  It's not UTC.  I don't know what timezone its in.  We need
    //to sort it out. 
    const uSecondsSinceEpoc = date.getTime()
    const diff = Math.floor((now.getTime() - uSecondsSinceEpoc)/1000)

    let content = null
    if ( diff <= 60 ) {
        content = `${diff} second${diff == 1 ? '' : 's'} ago`
    } else if ( Math.floor(diff/60) < 60 ) {
        content = `${Math.floor(diff/60)} minute${Math.floor(diff/60) == 1 ? '' : 's'} ago`
    } else if ( Math.floor(diff / (60*60)) < 24 ) {
        content = `${Math.floor(diff/(60*60))} hour${Math.floor(diff/(60*60)) == 1 ? '' : 's'} ago`
    } else if ( Math.floor(diff / (24*60*60)) < 30 ) {
        content = `${Math.floor(diff / (24*60*60))} day${Math.floor(diff / (24*60*60)) == 1 ? '' : 's'} ago`
    } else {
        if ( type == 'full' ) {
            content = `at ${date.toLocaleTimeString('en-us')} on ${date.toLocaleDateString('en-us')}`
        } else if ( type == 'date' ) {
            content = `on ${date.toLocaleDateString('en-us')}`
        } else if ( type == 'time' ) {
            content = `at ${date.toLocaleTimeString('en-us')}`
        } else {
            content = `on ${date.toLocaleDateString('en-us')}`
        }
    }

    return (
        <div className="date-tag" title={`${date.toLocaleTimeString('en-us')} on ${date.toLocaleDateString('en-us')}`}>{ content }</div>
    )

}

export default DateTag 
