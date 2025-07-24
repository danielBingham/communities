import React, { useEffect, useContext } from 'react'

import { useBlocklist } from '/lib/hooks/Blocklist'
import { useRequest } from '/lib/hooks/useRequest'

import { deleteBlocklist } from '/state/Blocklist'

import { DotsMenu, DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'

import { RequestErrorModal } from '/components/errors/RequestError'

const BlocklistDotsMenu = function({ id }) {

    const [blocklist, getRequest] = useBlocklist(id)

    const [request, makeRequest] = useRequest()

    const closeMenu = useContext(CloseMenuContext)

    const executeDelete = function() {
        makeRequest(deleteBlocklist(blocklist))
    }

    useEffect(function() {
        if ( request?.state === 'fulfilled' ) {
            closeMenu()
        }
    }, [ request ])

    if ( blocklist === null ) {
        return null
    }

    return (
        <>
            <DotsMenu>
                <DotsMenuItem onClick={() => executeDelete()} >Delete</DotsMenuItem>
            </DotsMenu>
            <RequestErrorModal request={request} message={"Deleting Blocklist"} />
            <RequestErrorModal request={getRequest} message={"Loading Blocklist"} />
        </>
    )
}

export default BlocklistDotsMenu
