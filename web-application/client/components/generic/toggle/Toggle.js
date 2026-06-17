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

import './Toggle.css'

const Toggle = function({ onClick, toggled, className, label, explanation, ariaLabel }) {

    const labelId = useId()
    const explanationId = useId()

    const onClickInternal = function(event) {
        event.preventDefault()
        
        onClick(event)
    }


    if ( label || explanation ) {
        return (
            <div className="toggle__wrapper">
                <div className="toggle__label-wrapper">
                    <div id={labelId} className="toggle__label">
                        { label }
                    </div>
                    <div id={explanationId} className="toggle__explanation">
                        { explanation }
                    </div>
                </div>
                <a href=""
                    role="switch"
                    aria-checked={toggled === true}
                    aria-labelledby={label ? labelId : undefined}
                    aria-describedby={explanation ? explanationId : undefined}
                    aria-label={label ? undefined : ariaLabel}
                    onClick={onClickInternal} className={`toggle ${toggled ? 'on' : 'off'} ${className ? className : ''}`}>
                    <span className={`toggle__switch`} aria-hidden="true"></span>
                </a>
            </div>
        )
    } else {
        return (
            <a href=""
                role="switch"
                aria-checked={toggled === true}
                aria-label={ariaLabel}
                onClick={onClickInternal} className={`toggle ${toggled ? 'on' : 'off'} ${className ? className : ''}`}>
                <span className={`toggle__switch`} aria-hidden="true"></span>
            </a>
        )
    }

}

export default Toggle
