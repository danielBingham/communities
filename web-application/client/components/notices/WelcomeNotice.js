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
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { patchUser } from '/state/User'

import Button from '/components/ui/Button'
import Modal from '/components/generic/modal/Modal'
import Image from '/components/ui/Image'

import './WelcomeNotice.css'

const WelcomeNotice = function({}) {
    const [isVisible, setIsVisible] = useState(true)

    const [ request, makeRequest] = useRequest()

    const navigate = useNavigate()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    if ( ! currentUser ) {
        console.error(new Error(`Attempt to show WelcomeNotice with no logged in user.`))
        return null
    }

    useEffect(function() {
        if ( ! isVisible ) {
            const notices = JSON.parse(JSON.stringify(currentUser.notices))

            notices.welcomeNotice = true

            const userPatch = {
                id: currentUser.id,
                notices: notices
            }

            makeRequest(patchUser(userPatch))
        }
    }, [ isVisible ])

    return (
        <Modal isVisible={isVisible} setIsVisible={setIsVisible} noClose={true}>
            <div className="welcome-notice">
                <h1>Welcome to Communities</h1>
                <p>Let us show you around!</p>
                <Image className="welcome-notice__intro" src="/api/0.0.0/assets/daniel-headshot.jpg" crossOrigin={true} />
                <p className="welcome-notice__ask">Communities is user funded. That means you stay in control and we never have to show you ads.  If you can chip in, please do!</p>
                <div className="welcome-notice__close">
                    <Button type="success" onClick={(e) => { setIsVisible(false); navigate('/account/contribute') }}>Contribute</Button>
                    <Button type="primary" onClick={(e) => setIsVisible(false)}>Get Started</Button>
                </div>
            </div>
        </Modal>
    )
}

export default WelcomeNotice
