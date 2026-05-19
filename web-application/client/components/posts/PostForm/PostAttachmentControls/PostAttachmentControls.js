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

import { useFile } from '/lib/hooks/File'
import { useGroup } from '/lib/hooks/Group'
import { usePost } from '/lib/hooks/Post'
import { usePostDraft } from '/lib/hooks/usePostDraft'
import { useFeature } from '/lib/hooks/feature/useFeature'

import FileUploadInput from '/components/files/FileUploadInput'
import Spinner from '/components/Spinner'

import './PostAttachmentControls.css'

const PostAttachmentControls = function({ postId, groupId, sharedPostId }) {
    const [ showLinkForm, setShowLinkForm] = useState(false)

    const [post] = usePost(postId) 
    const [group] = useGroup(post !== null ? post.groupId : groupId)
    
    const hasVideoUploads = useFeature('issue-67-video-uploads')
    const videoUploadsEnabled = useFeature('video-uploads')

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)

    const setFiles = function(files) {
        const newDraft = { ...draft }
        newDraft.linkPreviewId = null 
        newDraft.fileId = fileId 
        newDraft.sharedPostId = null
        setDraft(newDraft)
    }

    if ( draft.sharedPostId || draft.linkPreviewId ) {
        return null
    }

    return (
        <div className="attachment-controls">
            <div className="post-form__image">
                 <FileUploadInput 
                    text="Add Image"
                    files={draft.files} 
                    setFiles={setFiles} 
                    type='image'
                    types={[ 'image/jpeg', 'image/png' ]} 
                /> 
            </div> 
        {  videoUploadsEnabled === true && <div className="post-form__video">
                <FileUploadInput
                    text="Add Video"
                    files={draft.files}
                    setFiles={setFiles}
                    type='video'
                    types={[ 'video/mp4', 'video/quicktime' ]}
                />
            </div> }
        </div>
    )

}

export default PostAttachmentControls
