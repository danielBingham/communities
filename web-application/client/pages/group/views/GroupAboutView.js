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

import can, { Actions, Entities } from '/lib/permission'

import { useGroupPermissionContext } from '/lib/hooks/Group'

import './GroupAboutView.css'

const GroupAboutView = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [ context, requests] = useGroupPermissionContext(currentUser, groupId)
    const group = context.group

    const canViewGroup = can(currentUser, Actions.view, Entities.Group, context)

    if ( canViewGroup !== true ) {
        return null
    }

    return (
        <div className="group-about-view">
            <article>
                <section className="group-about-view__about">
                    <h2>About This Group</h2>
                    { group.about }
                </section>
                { group.rules !== null && group.rules.length > 0 && <section className="group-about-view__rules">
                    <h2>Group Rules</h2>
                    { group.rules }
                </section> }
            </article>
        </div>
    )
}

export default GroupAboutView
