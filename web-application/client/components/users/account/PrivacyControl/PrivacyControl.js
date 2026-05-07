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

import { 
    UserIcon,
    UsersIcon,
    UserGroupIcon,
    GlobeAltIcon
} from '@heroicons/react/24/solid'

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuBody, DropdownMenuItem } from '/components/ui/DropdownMenu'

import './PrivacyControl.css'

const PrivacyControl = function({ value, setValue, className, label, explanation }) {

    const options = {
        'me': { label: 'Just You', icon: UserIcon },
        'friends': { label: 'Friends', icon: UsersIcon },
        'friends-of-friends': { label: 'Friends of Friends', icon: UserGroupIcon },
        'public': { label: 'Anyone', icon: GlobeAltIcon }
    }

    let valueInternal = value || 'me'
    if ( ! (valueInternal in options) ) {
        valueInternal = 'me' 
    }

    const menuOptionViews = []
    for(const [option, labels] of Object.entries(options)) {
        const label = labels.label
        const Icon = labels.icon
        menuOptionViews.push(
            <DropdownMenuItem key={option} onClick={() => setValue(option)}><Icon /> { label }</DropdownMenuItem>
        )
    }

    const currentLabel = options[valueInternal].label
    const CurrentIcon = options[valueInternal].icon

    return (
        <div className={`privacy-control ${ className ? className : ''}`}>
            <div className="privacy-control__label-wrapper">
                <div className="privacy-control__label">
                    { label }
                </div>
                <div className="privacy-control__explanation">
                    { explanation }
                </div>
            </div>
            <DropdownMenu className="privacy-control__menu" autoClose={true} >
                <DropdownMenuTrigger className="privacy-control__menu__button"><CurrentIcon /> { currentLabel }</DropdownMenuTrigger>
                <DropdownMenuBody> { menuOptionViews }</DropdownMenuBody>
            </DropdownMenu>
        </div>
    )

}

export default PrivacyControl
