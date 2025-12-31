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

import Image from '/components/ui/Image'

import './PostImage.css'

const PostImage = function({ id, className }) {
    
    const post = useSelector((state) => id && id in state.Post.dictionary ? state.Post.dictionary[id] : null) 
    const configuration = useSelector((state) => state.system.configuration)

    if ( ! id || ! post ) {
        console.error(new Error(`'props.id' and 'post' are both required for PostImage.`))
        return null
    }

    if ( ! post.fileId ) {
        return null
    }

    return (
        <div className={ className ? `post-image ${className}` : "post-image"}>
            <Image id={post.fileId} width={650} fallbackIcon={'Photo'} />
        </div>
    )
}

export default PostImage
