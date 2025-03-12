import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getFeatures } from '/state/features'

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
            <div className="header">
                <h2>Feature Flags and Migrations</h2>
            </div>
            <div className="feature-rows-header">
                <span className="feature-name">Feature Name</span>
                <span className="feature-status">Feature Status</span>
                <span className="feature-controls">Migration Controls</span>
            </div>
            {rows}
        </div>
    )

}

export default FeatureFlags
