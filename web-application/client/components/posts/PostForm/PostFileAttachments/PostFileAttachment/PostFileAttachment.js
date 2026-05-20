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
import { usePost } from '/lib/hooks/Post'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import DraftFile from '/components/files/DraftFile'

import './PostFileAttachment.css'

const PostFileAttachment = function({ fileId, postId, groupId, sharedPostId, onDragStart, onDragEnd, onDragOver, onDrop }) {
    const [isDragged, setIsDragged] = useState(false)
    const [post] = usePost(postId) 

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)

    const removeFile = function(fileId) {
        const newDraft = { ...draft }
        newDraft.linkPreviewId = null 
        newDraft.files = draft.files.filter((fid) => fid !== fileId) 
        newDraft.sharedPostId = null
        setDraft(newDraft)
    }
    
    const onDragStartInternal = function(event) {
        event.dataTransfer.dropEffect = "move"
        event.dataTransfer.effectAllowed = "move"

        setIsDragged(true)

        if ( onDragStart ) {
            onDragStart()
        }
    }

    const onDragOverInternal = function(event) {
        event.preventDefault()

        if ( onDragOver ) {
            onDragOver(event)
        }
    }

    const onDropInternal = function(event) {
        event.preventDefault()

        if ( onDrop ) {
            onDrop(event)
        }
    }

    const onDragEndInternal = function(event) {
        setIsDragged(false)

        if ( onDragEnd ) {
            onDragEnd()
        }
    }

    return (
        <div 
            id={`${fileId}`}
            className="post-file-attachment"
            draggable={true}
            onDragStart={onDragStartInternal}
            onDragOver={onDragOverInternal}
            onDrop={onDropInternal}
            onDragEnd={onDragEndInternal}
            style={{
                opacity: isDragged ? "50%" : "100%"
            }}
        >
            <DraftFile 
                fileId={fileId} 
                onRemove={removeFile} 
                width={650} 
                deleteOnRemove={ ! post || ! post.files.includes(fileId) }  
            />
        </div>
    )
}

export default PostFileAttachment
