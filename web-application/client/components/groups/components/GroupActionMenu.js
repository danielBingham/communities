import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { Cog6ToothIcon } from '@heroicons/react/24/solid'

import GroupMembershipButton from '/components/groups/components/GroupMembershipButton'
import Button from '/components/generic/button/Button'

import './GroupActionMenu.css'

const GroupActionMenu = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const currentMember = useSelector((state) => groupId !== null 
        && groupId in state.groupMembers.byGroupAndUser 
        && currentUser && currentUser.id in state.groupMembers.byGroupAndUser[groupId] 
            ? state.groupMembers.byGroupAndUser[groupId][currentUser.id] : null)

    const navigate = useNavigate()

    const isAdmin = currentMember && currentMember.role == 'admin'
    return (
        <menu className="group-action-menu">
            { isAdmin && <li><Button type="primary" onClick={() => navigate(`/groups/admin/${groupId}`)}><Cog6ToothIcon /><span className="text"> Admin</span></Button></li> }
            <li><GroupMembershipButton groupId={groupId} userId={currentUser.id} /></li>
        </menu>
    )
}

export default GroupActionMenu
