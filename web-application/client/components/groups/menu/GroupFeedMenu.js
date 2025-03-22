import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, NavLink } from 'react-router-dom'

import { UserGroupIcon as UserGroupIconOutline } from '@heroicons/react/24/outline'
import { UserGroupIcon as UserGroupIconSolid} from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'
import { useLocalStorage } from '/lib/hooks/useLocalStorage'

import { getGroups } from '/state/groups'

import GroupImage from '/components/groups/view/GroupImage'

import './GroupFeedMenu.css'

const GroupFeedMenu = function() {

    const [open, setOpen] = useLocalStorage('GroupFeedMenu.state', false)

    const [request, makeRequest] = useRequest()

    const groupDictionary = useSelector((state) => state.groups.dictionary)
    const groups = useSelector((state) => 'GroupFeedMenu' in state.groups.queries ? state.groups.queries['GroupFeedMenu'].list : [])
    const currentUser = useSelector((state) => state.authentication.currentUser)

    useEffect(() => {
        if ( currentUser ) {
            makeRequest(getGroups('GroupFeedMenu', { userId: currentUser.id }))
        }

    }, [ currentUser ])

    const groupViews = []
    for(const groupId of groups) {
        const group = groupDictionary[groupId]

        groupViews.push(<li key={group.slug}>
            <GroupImage groupId={groupId} width={30} /> <NavLink to={`/g/${group.slug}`}>{ group.title }</NavLink> 
        </li>)
    }
    return (
        <div className="group-feed-menu">
            <a href="" onClick={(e) => { e.preventDefault(); setOpen( ! open)}} className="header">{ open ? <UserGroupIconOutline /> : <UserGroupIconSolid /> }<span className="nav-text">Groups</span></a>
            { open && <menu className="group-feed-menu__groups">
                { groupViews }
                <li className="view-more" >
                    <Link to="/groups">View More</Link>
                </li>
            </menu> }
        </div>
    )

}

export default GroupFeedMenu
