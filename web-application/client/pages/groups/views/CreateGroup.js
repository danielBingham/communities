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
import { useSearchParams } from 'react-router-dom'

import GroupForm from '/components/groups/form/GroupForm'

import './CreateGroup.css'

const CreateGroup = function() {
    const [searchParams, setSearchParams] = useSearchParams()

    const parentId = searchParams.get('parentId')

    return (
        <div className="create-group">
            <GroupForm parentId={ parentId ? parentId : undefined }/>
        </div>
    )
}

export default CreateGroup
