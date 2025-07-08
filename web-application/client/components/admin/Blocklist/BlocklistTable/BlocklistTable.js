import React from 'react'

import { useBlocklistQuery } from '/lib/hooks/Blocklist'

import { RequestErrorModal } from '/components/errors/RequestError'
import { Table, TableHeader, TableCell } from '/components/ui/Table'
import PaginationControls from '/components/PaginationControls'
import Spinner from '/components/Spinner'

import BlocklistTableRow from './BlocklistTableRow'

const BlocklistTable = function() {
    const [query, request] = useBlocklistQuery()

    const blocklistViews = []
    if ( query !== null ) {
        for(const id of query.list) {
            blocklistViews.push(<BlocklistTableRow key={id} id={id} />)
        }
    }

    const isPending = request && request.state === 'pending'
    if ( isPending ) {
        return (
            <div className="blocklist-table">
                <Spinner />
            </div>
        )
    }

    return (
        <div className="blocklist-table">
            <Table>
                <TableHeader>
                    <TableCell>Creator</TableCell>
                    <TableCell>Domain</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Created On</TableCell>
                    <TableCell>Updated On</TableCell>
                    <TableCell></TableCell>
                </TableHeader>
                { blocklistViews } 
            </Table>
            <PaginationControls meta={query?.meta} />
            <RequestErrorModal request={request} message={"Loading Blocklist"} />
        </div>

    )
}

export default BlocklistTable
