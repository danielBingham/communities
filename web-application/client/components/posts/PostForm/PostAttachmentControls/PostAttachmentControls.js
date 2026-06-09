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
import { useFeature } from '/lib/hooks/feature/useFeature'

import FileUploadInput from '/components/files/FileUploadInput'

import Alert from '/components/ui/Alert'

import './PostAttachmentControls.css'

const PostAttachmentControls = function({ postId, groupId, sharedPostId }) {
   
    const [ showMaxFilesError, setShowMaxFilesError] = useState(false)

    const videoUploadsEnabled = useFeature('video-uploads')

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)

    const setFiles = function(files) {
        const newDraft = { ...draft }
        newDraft.linkPreviewId = null 
        newDraft.files = [ ...draft.files, ...files ]
        newDraft.sharedPostId = null
        setDraft(newDraft)
    }

    let totalMaxFiles = 30
    const maxFiles = totalMaxFiles - draft.files.length

    if ( draft.sharedPostId || draft.linkPreviewId ) {
        return null
    }


    // Posts may not have more than 30 files attached.
    if ( draft.files.length >= totalMaxFiles ) {
        if ( showMaxFilesError ) {
            return <Alert type="error" timeout={5000} onClear={() => setShowMaxFilesError(false)}>Too many files selected.  Galleries are limited to 30 files.</Alert>
        } else {
            return null
        }
    }

    return (
        <div className="attachment-controls">
            { showMaxFilesError && <Alert type="error" timeout={5000}>Too many files selected.  Galleries are limited to 30 files.</Alert> }
            <div className="post-form__image">
                 <FileUploadInput 
                    text="Add Image"
                    maxFiles={maxFiles}
                    onChange={(files) => setFiles(files)} 
                    onError={(error) => setShowMaxFilesError(true)}
                    kind='image'
                    allowedTypes={[ 'image/jpeg', 'image/png' ]} 
                /> 
            </div> 
        {  videoUploadsEnabled === true && <div className="post-form__video">
                <FileUploadInput
                    text="Add Video"
                    maxFiles={1}
                    onChange={(files) => setFiles(files)}
                    onError={(error) => setShowMaxFilesError(true)}
                    kind='video'
                    allowedTypes={[ 'video/mp4', 'video/quicktime' ]}
                />
            </div> }
        </div>
    )

}

export default PostAttachmentControls
