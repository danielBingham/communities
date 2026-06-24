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

import Button from '/components/ui/Button'

import './UserAccountSecurityView.css'

const UserAccountSecurityView  = function() {

    return (
        <menu className="user-account-security-view">
            <li className="user-account-security-view__menu-item">
                <label>Change Email</label>
                <div className="user-account-security-view__menu-item__explanation">Update your password.</div>
                <div className="user-account-security-view__menu-item__action"><Button type="primary" href="/account/security/change-email">Change Password</Button></div>
            </li>
            <li className="user-account-security-view__menu-item">
                <label>Change Password</label>
                <div className="user-account-security-view__menu-item__explanation">Update your email.</div>
                <div className="user-account-security-view__menu-item__action"><Button type="primary" href="/account/security/change-password">Change Password</Button></div>
            </li>
            <li className="user-account-security-view__menu-item">
                <label>Setup Multi-factor Authentication</label>
                <div className="user-account-security-view__menu-item__explanation">Setup Multi-factor Authentication to secure your account against password theft.</div>
                <div className="user-account-security-view__menu-item__action"><Button type="primary" href="/account/security/setup-multifactor">Setup Multi-factor Authentication</Button></div>
            </li>
        </menu>
    )

}

export default UserAccountSecurityView
