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
import { useRequest } from '/lib/hooks/useRequest'

import { deleteFile } from '/state/File'
import { XCircleIcon } from '@heroicons/react/24/solid'

import File from '/components/files/File'

import "./DraftImageFile.css"

const DraftImageFile = function({ fileId, setFileId, width, deleteOnRemove }) {
  
    const [request, makeRequest] = useRequest()

    const remove = function() {
        setFileId(null)

        if ( deleteOnRemove !== false ) {
            makeRequest(deleteFile(fileId))
        }
    }

    // ============ Render ====================================================
    
    let content = null
    if ( fileId) {
        let renderWidth = width ? width : 650
        content = (
            <div className="file">
                <a className="remove" href="" onClick={(e) => { e.preventDefault(); remove() }}><XCircleIcon /></a>
                <File id={fileId} width={renderWidth} type="image"  />
            </div>
        )
    }

    return (
        <div className="draft-image-file">
            { content }
        </div>
    )
}

export default DraftImageFile
