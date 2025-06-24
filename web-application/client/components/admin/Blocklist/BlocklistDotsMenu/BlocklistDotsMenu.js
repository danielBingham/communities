import React from 'react'

import { useBlocklist } from '/lib/hooks/Blocklist'
import { useRequest } from '/lib/hooks/useRequest'

import { deleteBlocklist } from '/state/Blocklist'

import { DotsMenu, DotsMenuItem } from '/components/ui/DotsMenu'

import RequestError from '/components/errors/RequestError'

const BlocklistDotsMenu = function({ id }) {

    const [blocklist, getRequest] = useBlocklist(id)

    const [request, makeRequest] = useRequest()

    const executeDelete = function() {
        makeRequest(deleteBlocklist(blocklist))
    }

    if ( blocklist === null ) {
        return null
    }

    return (
        <>
            <DotsMenu>
                <DotsMenuItem onClick={() => executeDelete()} >Delete</DotsMenuItem>
            </DotsMenu>
            <RequestError request={request} message={"Deleting Blocklist"} />
            <RequestError request={getRequest} message={"Loading Blocklist"} />
        </>
    )
}

export default BlocklistDotsMenu
