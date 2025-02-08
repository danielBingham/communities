import React from 'react'
import { useSelector } from 'react-redux'

import InsertButton from './buttons/InsertButton'
import InitializeButton from './buttons/InitializeButton'
import MigrateButton from './buttons/MigrateButton'
import EnableButton from './buttons/EnableButton'

import './FeatureRow.css'

const FeatureRow = function(props) {

    const feature = useSelector((state) => props.name in state.features.dictionary ? state.features.dictionary[props.name] : null) 

    return ( 
        <div key={feature.name} id={`feature-${feature.name}`} className="feature-row">
            <div className="name">{feature.name}</div> 
            <div className="status">{feature.status}</div>
            <div className="controls">
                <InsertButton name={feature.name} />
                <InitializeButton name={feature.name} />
                <MigrateButton name={feature.name} />
                <EnableButton name={feature.name} />
            </div>
        </div>
    )

}

export default FeatureRow
