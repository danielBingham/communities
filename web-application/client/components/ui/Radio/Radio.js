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

import './Radio.css'

export const RadioOption = function({ className, name, label, explanation, value, current, onClick }) {
    const id = useId()
    const explanationId = useId()

    return (
        <div className={`radio-option ${className ? className : ''}`}>
            <div className="radio-option__label-wrapper">
                <div className="radio-option__label">
                    <label htmlFor={`${name}-${id}`} onClick={onClick}>{ label }</label>
                </div>
                <div id={explanationId} className="radio-option__explanation">
                    { explanation }
                </div>
            </div>
            <div className="radio-option__button">
                <input 
                    type="radio" 
                    id={`${name}-${id}`}
                    name={name} 
                    checked={ current === value }
                    aria-describedby={ explanation ? explanationId : undefined }
                    onChange={onClick}
                    value={ value } />
            </div>
        </div>
    )
}

export const Radio = function({ name, title, explanation, className, children, error }) {
    const titleId = useId()
    const explanationId = useId()
    const errorId = useId()

    return (
        <div className={`radio-button ${className ? className : ''}`}>
            <label id={titleId} className="radio-button__label">{ title }</label>
            <p id={explanationId} className="radio-button__explanation">{ explanation }</p>
            <div
                className="radio-button__wrapper"
                role="radiogroup"
                aria-labelledby={ title ? titleId : undefined }
                aria-describedby={`${ explanation ? explanationId : '' } ${ error ? errorId : '' }`.trim() || undefined}
                aria-invalid={ error ? true : undefined }
            >
                { children }
            </div>
            <div id={errorId} className="radio-button__errors">{ error }</div>
        </div>
    )
}
