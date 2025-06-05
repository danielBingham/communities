import React from 'react'

import { useBlocklist } from '/lib/hooks/Blocklist'

import RequestError from '/components/errors/RequestError'
import UserTag from '/components/users/UserTag'
import DateTag from '/components/DateTag'
import { TableRow, TableCell } from '/components/ui/Table'

import { BlocklistDotsMenu } from '/components/admin/Blocklist'

const BlocklistTableRow = function({ id }) {
    const [blocklist, request] = useBlocklist(id)

    if ( blocklist === null ) {
        return 
    }

    return (
        <>
            <TableRow key={blocklist.id} className="blocklist-view__item">
                <TableCell><UserTag id={blocklist.userId} /></TableCell>
                <TableCell>{ blocklist.domain }</TableCell>
                <TableCell>{ blocklist.notes }</TableCell>
                <TableCell><DateTag timestamp={blocklist.createdDate} /></TableCell>
                <TableCell><DateTag timestamp={blocklist.updatedDate} /></TableCell>
                <TableCell><BlocklistDotsMenu id={id} /></TableCell>
            </TableRow>
            <RequestError request={request} message={"Loading Blocklist"} />
        </>
    )
}

export default BlocklistTableRow
