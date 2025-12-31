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
import FetchVideo from './FetchVideo/FetchVideo'
import HtmlVideo from './HtmlVideo/HtmlVideo'

import './Video.css'

const Video = function({ id, src, altText, fallbackIcon, width, ref, onLoad }) {

    /*if ( id ) {
        return ( <FetchVideo id={id}  width={width} ref={ref} onLoad={onLoad} fallbackIcon={fallbackIcon} /> )
    } else if ( src ) {*/
    return ( <HtmlVideo id={id} src={src} width={width} ref={ref} onLoad={onLoad} fallbackIcon={fallbackIcon} /> )
    //}
}

export default Video 
