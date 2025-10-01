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
import { useSelector } from 'react-redux'

import { NoSymbolIcon } from '@heroicons/react/24/outline'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'
import { useUser } from '/lib/hooks/User'
import { useUserRelationship } from '/lib/hooks/UserRelationship'

import { deleteUserRelationship, postUserRelationships } from '/state/UserRelationship'

import AreYouSure from '/components/AreYouSure'
import Button from '/components/ui/Button'

const BlockButton = function({ userId }) {
    const [areYouSure, setAreYouSure] = useState(false)
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [user, userRequest] = useUser(userId)
    const [relationship, relationshipRequest] = useUserRelationship(currentUser.id, userId)

    const [request, makeRequest] = useRequest()


    const block = function() {
        // We're always going to post the block, even if there's an existing
        // relationship.  The endpoint will delete the previous relationship
        // when a block is posted.  This is because currentUser, the blocking
        // user, always needs to be `userId` and the blocked user `relationId`.
        // Blocked users aren't allowed to delete the blocking relationship.
        // Only the blocking user.
        const relationship = {
            userId: currentUser.id,
            relationId: userId,
            status: 'blocked'
        }
        makeRequest(postUserRelationships(relationship))
        setAreYouSure(false)
    }

    const unblock = function() {
        makeRequest(deleteUserRelationship(relationship))
        setAreYouSure(false)
    }

    if ( user === undefined) {
        return null
    }

    if ( user === null ) {
        logger.error('Attempting to show the BlockButton for a non-existent user.')
        return null
    }

    if ( relationship?.status === 'blocked' ) {
        return (
            <>
                <Button type="warn" onClick={() => setAreYouSure(true)}><NoSymbolIcon /> Unblock</Button>
                <AreYouSure 
                    className="block-button__confirmation"
                    isVisible={areYouSure}
                    isPending={request?.state === 'pending'}
                    execute={unblock}
                    cancel={() => setAreYouSure(false)}
                >
                    <p><strong>Are you sure you want to unblock { user.name }?</strong></p>
                    <p>This will allow them to see and interact with your public posts again.  It will also allow them to send you a friend request.</p>
                </AreYouSure>
            </>

        )

    } else {
        return (
            <>
                <Button type="warn" onClick={() => setAreYouSure(true)}><NoSymbolIcon /> Block</Button>
                <AreYouSure 
                    className="block-button__confirmation"
                    isVisible={areYouSure}
                    isPending={request?.state === 'pending'}
                    execute={block}
                    cancel={() => setAreYouSure(false)}
                >
                    <p><strong>Are you sure you want to block { user.name }?</strong></p>
                    <p>If they are you friend you will unfriend them.  They will not able to see or interact with any of your posts, including your public posts.</p>
                </AreYouSure>
            </>

        )
    }


}

export default BlockButton
