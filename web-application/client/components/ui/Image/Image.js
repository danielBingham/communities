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

import './Image.css'

const Image = function({ className, src, altText, ref, crossOrigin, onLoad, onError }) {
    if ( ! src) {
        console.error(new Error(`'src' is required.`))
        return null
    }

    return (
        <img 
            ref={ref}
            src={src} 
            className={`image ${className ? className : ''}`}
            onLoad={onLoad}
            onError={onError}
            crossOrigin={ crossOrigin === true ? "anonymous" : undefined }
        />
    )
}

export default Image 
