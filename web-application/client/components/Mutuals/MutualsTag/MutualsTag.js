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

import { useFeature } from '/lib/hooks/feature'

import Modal from '/components/generic/modal/Modal'

import UserTag from '/components/users/UserTag'

import './MutualsTag.css'

const MutualsTag = function({ id }) {

    const [showList, setShowList] = useState(false)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const mutuals = useSelector((state) => id in state.Mutuals.dictionary ? state.Mutuals.dictionary[id] : null)

    const hasMutualFriends = useFeature('feat-491-mutual-friends')

    useEffect(() => {
        setShowList(false)
    }, [ id ])

    if ( hasMutualFriends !== true ) {
        return null
    }

    if ( currentUser.id === id ) {
        return null
    }

    if ( mutuals === undefined || mutuals === null || ! Array.isArray(mutuals) || mutuals.length <= 0 ) {
        return null
    }

    const mutualViews = []
    for(const mutual of mutuals) {
        mutualViews.push(<UserTag key={mutual} id={mutual} />)
    }

    return (
        <>
            <a href="" onClick={(e) => { e.preventDefault(); setShowList(true) }}>{ mutuals.length} mutual friend{ mutuals.length > 1 ? 's' : '' }</a>
            <Modal className="mutuals-tag__modal" isVisible={showList} setIsVisible={setShowList}>
                { mutualViews }
            </Modal>
        </>
    )


}

export default MutualsTag
