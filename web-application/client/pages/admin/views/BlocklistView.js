import React from 'react'

import { BlocklistTable, AddDomain } from '/components/admin/Blocklist'

import './BlocklistView.css'

const BlocklistView = function() {

    return (
        <div className="blocklist-view">
            <div className="blocklist-view__controls">
                <AddDomain />
            </div>
            <BlocklistTable />
        </div>
    )

}

export default BlocklistView
