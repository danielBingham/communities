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
import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'

import './AreYouSure.css'

const AreYouSure = function({ isVisible, isPending, cancel, execute, className, children }) {

    return isVisible ?
            <div className="modal-wrapper">
                <div className="modal-overlay" onClick={(e) => cancel()}></div>
                <div className={className ? `are-you-sure ${className}` : 'are-you-sure'}>
                    <div className="are-you-sure__question">{ children }</div>
                    <Button onClick={(e) =>{ e.stopPropagation(); cancel() }}>Cancel</Button> <Button type="warn" onClick={(e) => { e.stopPropagation(); execute() }}>{ isPending === true ? <Spinner /> : 'Yes' }</Button>
                </div>
            </div>
         : null 
}

export default AreYouSure
