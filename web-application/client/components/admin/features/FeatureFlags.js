/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import can, { Entities, Actions } from '/lib/permission'
import { useRequest } from '/lib/hooks/useRequest'

import { getFeatures } from '/state/features'

import { Table, TableHeader, TableCell } from '/components/ui/Table'
import FeatureRow from '/components/admin/features/FeatureRow'

import './FeatureFlags.css'

const FeatureFlags = function(props) {

    const [request, makeRequest] = useRequest()
    
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const features = useSelector((state) => state.features.dictionary)

    const canAdminSite = can(currentUser, Actions.admin, Entities.Site)

    useEffect(function() {
        makeRequest(getFeatures())
    }, [])

    // ======= Render ===============================================
    
    if ( canAdminSite !== true ) {
        return null
    }
   
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
