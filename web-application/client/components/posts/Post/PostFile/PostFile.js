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
import { useFile } from '/lib/hooks/File'

import Image from '/components/ui/Image'
import Video from '/components/ui/Video'

import './PostFile.css'

const PostFile = function({ id, className }) {
    
    const [post, request] = usePost(id) 
    const [file, fileRequest] = useFile(post?.fileId)

    console.log(`File: `, file)

    if ( post === null || post === undefined ) {
        return null
    }

    if ( post.fileId === undefined || post.fileId === null ) {
        return null
    }

    if ( file.type.split('/')[0] === 'video' ) {
        return (
            <div className={ className ? `post-video ${className}` : "post-video"}>
                <Video id={post.fileId} />
            </div>
        )
    } else {
        return (
            <div className={ className ? `post-image ${className}` : "post-image"}>
                <Image id={post.fileId} width={650} fallbackIcon={'Photo'} />
            </div>
        )
    }
}

export default PostFile
