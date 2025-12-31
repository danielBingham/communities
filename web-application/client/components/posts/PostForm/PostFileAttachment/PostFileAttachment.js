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
import { useSelector } from 'react-redux'

import { usePost } from '/lib/hooks/Post'
import { usePostDraft } from '/lib/hooks/usePostDraft'
import { useFile } from '/lib/hooks/File'

import DraftImageFile from '/components/files/DraftImageFile'
import DraftVideoFile from '/components/files/DraftVideoFile'

import './PostFileAttachment.css'

const PostFileAttachment = function({ postId, groupId, sharedPostId }) {

    const [post] = usePost(postId) 

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)
    const api = useSelector((state) => state.system.api)

    const [ file, fileRequest] = useFile(draft?.fileId)

    const setFileId = function(fileId) {
        const newDraft = { ...draft }
        newDraft.linkPreviewId = null 
        newDraft.fileId = fileId 
        newDraft.sharedPostId = null
        setDraft(newDraft)
    }

    if ( draft.fileId === null || draft.fileId === undefined ) {
        return null
    }

    if ( file === null || file === undefined ) {
        return null
    }

    const type = file.type.split('/')[0]
    let content = (<DraftImageFile fileId={draft.fileId} setFileId={setFileId} width={650} deleteOnRemove={ ! post || post.fileId != draft.fileId } />)
    if ( type === 'video' ) {
        content = (<DraftVideoFile fileId={draft.fileId} setFileId={setFileId} deleteOnRemove={ ! post || post.fileId != draft.fileId } />)
    }
    

    return (
        <div className="attachment">
            <div className="attached">
                { content }
            </div>
        </div>
    )

}

export default PostFileAttachment
