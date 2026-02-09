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
import { TableRow, TableCell } from '/components/ui/Table'
import { DotsMenu } from '/components/ui/DotsMenu'
import DateTag from '/components/DateTag'

import UserAdminUpdateStatus from './UserAdminUpdateStatus'
import UserAdminDelete from './UserAdminDelete'

import './UserAdminTableRow.css'

const UserAdminTableRow = function({ user }) {
    return (
        <TableRow className="user-admin-table__row">
            <TableCell>{ user.id }</TableCell>
            <TableCell>{ user.name }</TableCell> 
            <TableCell>{ user.username }</TableCell> 
            <TableCell>{ user.email }</TableCell> 
            <TableCell>{ user.status }</TableCell> 
            <TableCell>{ user.siteRole}</TableCell>
            <TableCell><DateTag timestamp={user.lastAuthenticationAttemptDate} /></TableCell>
            <TableCell><DateTag timestamp={user.createdDate} /></TableCell>
            <TableCell>
                <DotsMenu>
                    <UserAdminUpdateStatus user={user} requiredStatus="unconfirmed" status="confirmed" text="Confirm" />
                    <UserAdminUpdateStatus user={user} requiredStatus="confirmed" status="banned" text="Ban" />
                    <UserAdminUpdateStatus user={user} requiredStatus="banned" status="confirmed" text="Unban" />
                    <UserAdminDelete user={user} />
                </DotsMenu>
            </TableCell>
        </TableRow>
    )
}

export default UserAdminTableRow
