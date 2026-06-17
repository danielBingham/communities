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

import './TextBox.css'

const TextBox = function({ label, explanation, placeholder, name, className, value, onChange, onBlur, onFocus, error }) {

    const id = useId()
    const explanationId = useId()
    const errorId = useId()

    const onChangeInternal = function(event) {
        if ( onChange ) {
            onChange(event)
        }
    }

    const onBlurInternal = function(event) {
        if ( onBlur ) {
            onBlur(event)
        }
    }

    const onFocusInternal = function(event) {
        if ( onFocus ) {
            onFocus(event) 
        }
    }

    return (
        <div className={`text-box ${className ? className : ''}`}>
            { label && <label htmlFor={`${name}-${id}`}>{ label }</label> }
            { explanation && <p id={explanationId} className="text-box_explanation">{explanation}</p> }
            <textarea name={name} 
                id={`${name}-${id}`}
                value={value} 
                aria-describedby={`${ explanation ? explanationId : '' } ${ error ? errorId : '' }`.trim() || undefined}
                aria-invalid={ error ? true : undefined }
                onChange={onChangeInternal}
                onFocus={onFocusInternal}
                onBlur={onBlurInternal}
                placeholder={placeholder}
            ></textarea>
            { error && <p id={errorId} className="text-box_error">{ error }</p>}
        </div>

    )

}

export default TextBox
