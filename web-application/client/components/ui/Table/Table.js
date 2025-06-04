import React from 'react'

import './Table.css'

export const TableCell = function({ className, children }) {

    return (
        <td className={`table-cell ${className ? className : ''}`}>
            { children }
        </td>
    )
}

export const TableRow = function({ className, children }) {

    return (
        <tr className={`table-row ${className ? className : ''}`}>
            { children }
        </tr>
    )
}

export const TableHeader = function({ className, children }) {

    return (
        <tr className={`table-header ${className ? className : ''}`}>
            { children }
        </tr>
    )
}

export const Table = function({ className, children }) {

    return (
        <table className={`table ${className ? className : ''}`}>
            { children }
        </table>
    )
}

