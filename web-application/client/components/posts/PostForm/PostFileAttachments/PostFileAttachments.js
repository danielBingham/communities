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
import { useState } from 'react'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import PostFileAttachment from './PostFileAttachment'

import './PostFileAttachments.css'

const PostFileAttachments = function({ postId, groupId, sharedPostId }) {

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)
    const [dragId, setDragId] = useState(null)

    if ( draft.files === null || draft.files === undefined || ! Array.isArray(draft.files) || draft.files.length <= 0 ) {
        return null
    }

    // Swap the firstId with the second id.
    const swapFiles = function(firstId, secondId) {
        const newDraft = { ...draft }
        const newFiles = [ ...draft.files ]
        const firstIndex = draft.files.indexOf(firstId)
        const secondIndex = draft.files.indexOf(secondId)

        newFiles[firstIndex] = secondId
        newFiles[secondIndex] = firstId

        newDraft.files = newFiles
        setDraft(newDraft)
    }

    let content = []
    for(const fileId of draft.files) {
        if ( fileId === null || fileId === undefined ) {
            continue 
        }

        content.push(
            <PostFileAttachment
                key={fileId}
                fileId={fileId} 
                postId={postId}
                groupId={groupId}
                sharedPostId={sharedPostId}
                onDragStart={(event) => {
                    setDragId(fileId)
                }}
                onDrop={(event) => {
                    swapFiles(dragId, event.currentTarget.id)
                }}
            />
        )
    }

    return (
        <div className="attachment">
            <div className="attached">
                { content }
            </div>
        </div>
    )

}

export default PostFileAttachments
