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
import { Link } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'

import BackButton from './BackButton'

import './Breadcrumbs.css'

const Breadcrumbs = function({ crumbs }) {
    if ( Capacitor.getPlatform() === 'web' ) {
        return <div className="breadcrumbs"></div> 
    }

    return (
        <div className="breadcrumbs">
            <div className="breadcrumbs__back">
                <BackButton /> 
            </div>
            <div className="breadcrumbs__crumbs">{ crumbs.map((c, index) => <span><Link to={c.to}>{ c.name }</Link> { index < crumbs.length-1 && <span> &gt; </span>}</span>) }</div>
        </div>
    )
}

export default Breadcrumbs
