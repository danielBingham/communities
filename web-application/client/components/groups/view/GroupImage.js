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
import {  useSelector } from 'react-redux'

import logger from '/logger'

import { UserGroupIcon } from '@heroicons/react/24/solid'

import File from '/components/files/File'

import './GroupImage.css'

const GroupImage = function({ groupId, className, width }) {
    
    // ======= Request Tracking =====================================
    

    // ======= Redux State ==========================================
    
    const group = useSelector((state) => groupId && groupId in state.Group.dictionary ? state.Group.dictionary[groupId] : null)
    const configuration = useSelector((state) => state.system.configuration)

    // ======= Effect Handling ======================================
    

    // ======= Render ===============================================

    const renderWidth = width ? width : 200
    let content = ( <UserGroupIcon /> ) 
    if ( group && group.fileId ) {
        content = (
            <File id={group.fileId} width={renderWidth} fallback={'UserGroup'} type="image" />
        )
    } 

    return (
        <div className={ className ? `group-image ${className}` : "group-image"}>
            {content}
        </div>
    )

}

export default GroupImage
