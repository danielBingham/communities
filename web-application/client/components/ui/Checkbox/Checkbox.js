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
import { useId } from 'react'

import './Checkbox.css'

const Checkbox = function({ className, name, label, explanation, value, error, onClick }) {
    const id = useId()
    const explanationId = useId()
    const errorId = useId()

    return (
        <div className={`checkbox ${className ? className : ''}`}>
            <div className="checkbox__grid">
                <div className="checkbox__label-wrapper">
                    <div className="checkbox__label">
                        <label htmlFor={`${name}-${id}`} onClick={onClick}>{ label }</label>
                    </div>
                    <div id={explanationId} className="checkbox__explanation">
                        { explanation }
                    </div>
                </div>
                <input 
                    type="checkbox" 
                    id={`${name}-${id}`}
                    name={name} 
                    checked={ value === true }
                    aria-describedby={`${ explanation ? explanationId : '' } ${ error ? errorId : '' }`.trim() || undefined}
                    aria-invalid={ error ? true : undefined }
                    onChange={onClick} />
            </div>
            <div id={errorId} className="checkbox__error">
                { error }
            </div>
        </div>
    )
}

export default Checkbox
