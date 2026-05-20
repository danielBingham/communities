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

import { useFile } from '/lib/hooks/File'

import DraftImageFile from '/components/files/DraftImageFile'
import DraftVideoFile from '/components/files/DraftVideoFile'

import Button from '/components/ui/Button'
import Spinner from '/components/Spinner'

import './DraftFile.css'

const DraftFile = function({ fileId, removeFile, width, deleteOnRemove }) {

    const [file, request, refresh] = useFile(fileId)

    if ( fileId == undefined || fileId === null ) {
        return null
    }

    console.log(`File: `, file)
    console.log(`Request: `, request)

    if ( (file === undefined || file === null) && (request === null || request?.state === 'pending') ) {
        return (
            <div className="draft-file">
                <Spinner />
            </div>
        )
    }

    if ( (file === undefined || file === null) && request?.state !== 'fulfilled' ) {
        return (
            <div className="draft-file">
                <p>File failed to load:</p>
                <Button type="warn" onClick={() => refresh()}>Retry</Button>
            </div>
        )
    }

    const type = file.type.split('/')[0]
    let content = (<Spinner />)
    if ( type === 'image' ) {
        content = (<DraftImageFile fileId={fileId} removeFile={removeFile} width={width} deleteOnRemove={deleteOnRemove } />)
    } else if ( type === 'video' ) {
       content = (<DraftVideoFile fileId={fileId} removeFile={removeFile} deleteOnRemove={deleteOnRemove} />)
    } 

    return (
        <div className="draft-file">
            { content }
        </div>
    )
}

export default DraftFile
