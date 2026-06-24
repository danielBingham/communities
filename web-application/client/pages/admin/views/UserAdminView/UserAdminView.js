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
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import UserView from '/components/users/UserView'

import UserAdminPostView from './UserAdminPostView'
import UserAdminPostCommentView from './UserAdminPostCommentView'

import './UserAdminView.css'

const UserAdminView = function() {

    const [tab, setTab] = useState('posts')
    const { userId } = useParams()


    return (
        <div className="admin-user-view">
            <UserView id={userId} />
            <div className="user-admin-view__tab-pane">
                <div className="user-admin-view__tab-page__tabs">
                    <button type="button" onClick={() => setTab('posts')}>Posts</button>
                    <button type="button" onClick={() => setTab('comments')}>Comments</button>
                </div>
                { tab === 'posts' && <div className="user-admin-view__tab-pane__pane">
                    <UserAdminPostView userId={userId} /> 
                </div> }
                { tab === 'comments' && <div className="uesr-admin-view__tab-pane__pane"> 
                    <UserAdminPostCommentView userId={userId} />
                </div> }
            </div>
        </div>
    )
}

export default UserAdminView
