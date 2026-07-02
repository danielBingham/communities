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
import Card from '/components/ui/Card'

import './UserAccountSecurityView.css'

const UserAccountSecurityView  = function() {

    return (
        <div className="user-account-security-view">
            <h2>Account Security</h2>
            <Card className="user-account-security-view__menu-card">
                <p>Account security management options.</p>
                <menu className="user-account-security-view__menu">
                    <li className="user-account-security-view__menu-item">
                        <div className="user-account-security-view__menu-item__description">
                            <label>Change Email</label>
                            <div className="user-account-security-view__menu-item__explanation">Update your email.</div>
                        </div>
                        <div className="user-account-security-view__menu-item__action">
                            <Button type="primary" href="/account/security/change-email">Change Email</Button>
                        </div>
                    </li>
                    <li className="user-account-security-view__menu-item">
                        <div className="user-account-security-view__menu-item__description">
                            <label>Change Password</label>
                            <div className="user-account-security-view__menu-item__explanation">Update your password.</div>
                        </div>
                        <div className="user-account-security-view__menu-item__action">
                            <Button type="primary" href="/account/security/change-password">Change Password</Button>
                        </div>
                    </li>
                    <li className="user-account-security-view__menu-item">
                        <div className="user-account-security-view__menu-item__description">
                            <label>Setup Multi-factor Authentication</label>
                            <div className="user-account-security-view__menu-item__explanation">Setup Multi-factor Authentication (MFA) to secure your account against password theft.</div>
                        </div>
                        <div className="user-account-security-view__menu-item__action">
                            <Button type="primary" href="/account/security/setup-multifactor">Setup MFA</Button>
                        </div>
                    </li>
                </menu>
            </Card>
        </div>
    )

}

export default UserAccountSecurityView
