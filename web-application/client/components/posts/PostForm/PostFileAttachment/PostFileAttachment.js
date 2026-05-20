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
import { usePost } from '/lib/hooks/Post'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import DraftFile from '/components/files/DraftFile'

import './PostFileAttachment.css'

const PostFileAttachment = function({ postId, groupId, sharedPostId }) {

    const [post] = usePost(postId) 

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)

    const removeFile = function(fileId) {
        const newDraft = { ...draft }
        newDraft.linkPreviewId = null 
        newDraft.files = draft.files.filter((fid) => fid !== fileId) 
        newDraft.sharedPostId = null
        setDraft(newDraft)
    }

    if ( draft.files === null || draft.files === undefined || ! Array.isArray(draft.files) || draft.files.length <= 0 ) {
        return null
    }

    let content = []
    for(const fileId of draft.files) {
        if ( fileId === null || fileId === undefined ) {
            continue 
        }

        content.push(<DraftFile fileId={fileId} removeFile={removeFile} width={650} deleteOnRemove={ ! post || ! post.files.includes(fileId) }  />)
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
