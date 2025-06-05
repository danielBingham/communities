import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getFeatures } from '/state/features'

import { Table, TableHeader, TableCell } from '/components/ui/Table'
import FeatureRow from '/components/admin/features/FeatureRow'

import './FeatureFlags.css'

const FeatureFlags = function(props) {
    // ======= Request Tracking =====================================

    const [request, makeRequest] = useRequest()

    // ======= Redux State ==========================================
    
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const features = useSelector((state) => state.features.dictionary)

    // ======= Effect Handling ======================================

    useEffect(function() {
        makeRequest(getFeatures())
    }, [])

    // ======= Render ===============================================
   
    const rows = []
    for(const name in features ) {
        rows.push(
            <FeatureRow key={name} name={name} />
        )
    }

    return (
        <div className="feature-flags">
            <Table>
                <TableHeader className="feature-rows-header">
                    <TableCell>Feature Name</TableCell>
                    <TableCell>Feature Status</TableCell>
                    <TableCell>Migration Controls</TableCell>
                </TableHeader>
                {rows}
            </Table>
        </div>
    )

}

export default FeatureFlags
