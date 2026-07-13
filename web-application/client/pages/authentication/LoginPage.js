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
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { Page, PageLeftGutter, PageRightGutter, PageBody } from '/components/generic/Page'
import Card from '/components/ui/Card'

import LoginForm from '/components/authentication/LoginForm'

import './LoginPage.css'

const LoginPage = function(props) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const pendingUserId = useSelector((state) => state.authentication.pendingUserId)

    const navigate = useNavigate()

    useEffect(function() {
        if ( currentUser || pendingUserId ) {
            navigate('/')
        }
    }, [ currentUser, pendingUserId ])

    return (
        <Page id="login-page">
            <PageLeftGutter></PageLeftGutter>
            <PageBody>
                <Card className="login-page__card">
                    <LoginForm /> 
                </Card>
           </PageBody>
            <PageRightGutter></PageRightGutter>
        </Page>
    )
}

export default LoginPage
