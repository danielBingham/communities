import React from 'react'
import { useSelector } from 'react-redux'

import { TableRow, TableCell } from '/components/ui/Table'

import InsertButton from './buttons/InsertButton'
import InitializeButton from './buttons/InitializeButton'
import MigrateButton from './buttons/MigrateButton'
import EnableButton from './buttons/EnableButton'
import DeleteButton from './buttons/DeleteButton'

import './FeatureRow.css'

const FeatureRow = function(props) {

    const feature = useSelector((state) => props.name in state.features.dictionary ? state.features.dictionary[props.name] : null) 

    return ( 
        <TableRow key={feature.name} id={`feature-${feature.name}`} className="feature-row">
            <TableCell>{feature.name}</TableCell> 
            <TableCell>{feature.status}</TableCell>
            <TableCell>
                <InsertButton name={feature.name} />
                <InitializeButton name={feature.name} />
                <MigrateButton name={feature.name} />
                <EnableButton name={feature.name} />
                <DeleteButton name={feature.name} />
            </TableCell>
        </TableRow>
    )

}

export default FeatureRow
