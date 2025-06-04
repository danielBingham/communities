import React from 'react'
import { useSelector } from 'react-redux'

import { useBlocklistQuery } from '/lib/hooks/Blocklist'

import { Table, TableHeader, TableRow, TableCell } from '/components/ui/Table'
import UserTag from '/components/users/UserTag'
import DateTag from '/components/DateTag'
import PaginationControls from '/components/PaginationControls'
import { AddDomain } from '/components/admin/Blocklist'

const BlocklistView = function() {

    const [query, request] = useBlocklistQuery()
    const dictionary = useSelector((state) => state.blocklists.dictionary)

    const blocklistViews = []
    if ( query !== null ) {
        for(const id of query.list) {
            const blocklist = dictionary[id]

            blocklistViews.push(
                <TableRow key={blocklist.id} className="blocklist-view__item">
                    <TableCell><UserTag id={blocklist.userId} /></TableCell>
                    <TableCell>{ blocklist.domain }</TableCell>
                    <TableCell>{ blocklist.notes }</TableCell>
                    <TableCell><DateTag timestamp={blocklist.createdDate} /></TableCell>
                    <TableCell><DateTag timestamp={blocklist.updatedDate} /></TableCell>
                </TableRow>
            )
        }
    }

    return (
        <div className="blocklist-view">
            <AddDomain />
            <Table>
                <TableHeader>
                    <TableCell>Creator</TableCell>
                    <TableCell>Domain</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Created On</TableCell>
                    <TableCell>Updated On</TableCell>
                </TableHeader>
                { blocklistViews } 
            </Table>
            <PaginationControls meta={query?.meta} />
        </div>
    )

}

export default BlocklistView
