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
import { useSortable } from '@dnd-kit/react/sortable'


import { usePost } from '/lib/hooks/Post'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import DraftFile from '/components/files/DraftFile'

import './PostFileAttachment.css'

const PostFileAttachment = function({ fileId, postId, groupId, sharedPostId  }) {
    const [post] = usePost(postId) 

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)

    const index = draft.files.indexOf(fileId)

    const { ref } = useSortable({ id: fileId, index: index })

    const removeFile = function(fileId) {
        const newDraft = { ...draft }
        newDraft.linkPreviewId = null 
        newDraft.files = draft.files.filter((fid) => fid !== fileId) 
        newDraft.sharedPostId = null
        setDraft(newDraft)
    }

    return (
        <div 
            id={`${fileId}`}
            className="post-file-attachment"
            ref={ref}
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
