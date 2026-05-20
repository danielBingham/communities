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
import { DragDropProvider } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'


import { usePostDraft } from '/lib/hooks/usePostDraft'

import PostFileAttachment from './PostFileAttachment'

import './PostFileAttachments.css'

const PostFileAttachments = function({ postId, groupId, sharedPostId }) {

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)
    const [dragId, setDragId] = useState(null)

    const onDragEnd = function(event) {
        if ( event.canceled ) {
            return
        }

        const { source } = event.operation

        if ( isSortable(source) ) {
            // Source has moved.  Move it to the new index.
            if ( source.initialIndex !== source.index ) {
                const newFiles = [ ...draft.files ]
                const [removed] = newFiles.splice(source.initialIndex, 1)
                newFiles.splice(source.index, 0, removed)
               
                const newDraft = { ...draft }
                newDraft.files = newFiles
                setDraft(newDraft)
            }
        }
    }

    if ( draft.files === null || draft.files === undefined || ! Array.isArray(draft.files) || draft.files.length <= 0 ) {
        return null
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
                <DragDropProvider onDragEnd={onDragEnd}>
                    { content }
                </DragDropProvider>
            </div>
        </div>
    )

}

export default PostFileAttachments
