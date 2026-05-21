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

import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/solid'

import { useFeature } from '/lib/hooks/feature'
import { usePost } from '/lib/hooks/Post'

import File from '/components/files/File'

import './PostGallery.css'

const PostGallery = function({ postId, className }) {
    const [post, request] = usePost(postId) 

    const [current, setCurrent] = useState(0)

    const hasImageGalleries = useFeature('feat-15-post-image-galleries')

    const goToPrevious = function() {
        if ( current > 0 ) {
            setCurrent(current-1)
        } else {
            setCurrent(0)
        }
    }

    const goToNext = function() {
        if ( current < post.files.length-1 ) {
            setCurrent(current+1)
        } else {
            setCurrent(post.files.length-1)
        }
    }

    if ( post === null || post === undefined ) {
        return null
    }

    if ( post.files?.length <= 0 ) {
        return null
    }

    if ( hasImageGalleries !== true ) {
        return null
    }

    const currentFileId = post.files[current]
    const isGallery = post.files.length > 1

    const preloads = []
    if ( post.files.length > 1 ) {
        for(const fileId of post.files) {
            if ( fileId === currentFileId ) {
                continue
            }

            preloads.push(<File key={fileId} id={fileId} width={650} className="post-gallery__preload" fallback={true} />)
        }
    }

    return (
        <div className={`post-gallery ${className ? className : ''}`}>
            { isGallery && <div className="post-gallery__pages"><div className="post-gallery__pages__inner"><span>{ current + 1 }</span> / <span>{ post.files.length }</span></div></div> }
            { isGallery && <button className="post-gallery__controls-prev" onClick={() => goToPrevious()}><ChevronLeftIcon /></button> }
            { isGallery && <button className="post-gallery__controls-next" onClick={() => goToNext()}><ChevronRightIcon /></button> }
            <File id={currentFileId} width={650} fallback={true} />
            { isGallery && preloads }
        </div>
    )
}

export default PostGallery
