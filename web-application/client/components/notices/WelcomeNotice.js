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

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'

import { patchUser } from '/state/User'

import Button from '/components/ui/Button'
import Modal from '/components/generic/modal/Modal'
import Video from '/components/ui/Video'

import './WelcomeNotice.css'

const WelcomeNotice = function({}) {
    const [isVisible, setIsVisible] = useState(true)
    const [videoFailed, setVideoFailed] = useState(false)

    const [ request, makeRequest] = useRequest()
    const apiRoot = useSelector((state) => state.system.api)

    const navigate = useNavigate()

    const currentUser = useSelector((state) => state.authentication.currentUser)

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

    if ( ! currentUser ) {
        logger.error(`Attempt to show WelcomeNotice with no logged in user.`, new Error('Tried to show welcome notice to no user.'))
        return null
    }

    let introVideoUrl = null
    try {
        const url = new URL('./assets/intro-video.mp4', apiRoot)
        introVideoUrl = url.href
    } catch (error) {
        logger.error(`Failed to generate intro video url: `, error)
    }

    if ( introVideoUrl === null || videoFailed === true) {
        return (
            <Modal key="video-fallback" isVisible={isVisible} setIsVisible={setIsVisible} hideX={true}>
                <div className="welcome-notice">
                    <h1>Welcome to Communities</h1>
                    <p>
                        Communities is designed to be a place for you
                        to connect with your friends, family, and neighbors
                        rather than a place to follow creators.
                    </p>
                    <p>
                        To get started, invite some friends and start posting
                        for each other!
                    </p>
                    <p>
                        Communities is funded by user contributions so that we
                        never need to monetize your attention. The ask is $10 /
                        month, but it's a sliding scale and you don't have to
                        contribute to be here.
                    </p>
                    <div className="welcome-notice__close">
                        <Button type="success" onClick={(e) => { setIsVisible(false); navigate('/account/contribute') }}>Contribute</Button>
                        <Button type="primary" onClick={(e) => setIsVisible(false)}>Get Started</Button>
                    </div>
                </div>
            </Modal>
        )
    }

    return (
        <Modal key="video" isVisible={isVisible} setIsVisible={setIsVisible} hideX={true}>
            <div className="welcome-notice">
                <h1>Welcome to Communities</h1>
                <p>Let us show you around!</p>
                <Video className="welcome-notice__intro" src={introVideoUrl} preload="auto" onError={() => setVideoFailed(true)} />
                <div className="welcome-notice__close">
                    <Button type="success" onClick={(e) => { setIsVisible(false); navigate('/account/contribute') }}>Contribute</Button>
                    <Button type="primary" onClick={(e) => setIsVisible(false)}>Get Started</Button>
                </div>
            </div>
        </Modal>
    )
}

export default WelcomeNotice
