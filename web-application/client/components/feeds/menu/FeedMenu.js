import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, NavLink } from 'react-router-dom'

import { QueueListIcon as QueueListIconOutline} from '@heroicons/react/24/outline'
import { QueueListIcon as QueueListIconSolid, UsersIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { UserGroupIcon as UserGroupIconOutline } from '@heroicons/react/24/outline'
import { UserGroupIcon as UserGroupIconSolid} from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'
import { useLocalStorage } from '/lib/hooks/useLocalStorage'

import { getGroups } from '/state/groups'

import GroupImage from '/components/groups/view/GroupImage'

import './FeedMenu.css'

const FeedMenu = function() {
    const [width, setWidth] = useState(window.innerWidth)
    const [feedsIsOpen, setFeedsIsOpen] = useLocalStorage('FeedMenu.feedsIsOpen', false)
    const [groupsIsOpen, setGroupsIsOpen] = useLocalStorage('FeedMenu.feedsIsOpen', false)

    const [groupsRequest, makeGroupsRequest] = useRequest()

    const groupDictionary = useSelector((state) => state.groups.dictionary)
    const groups = useSelector((state) => 'FeedMenu' in state.groups.queries ? state.groups.queries['FeedMenu'].list : [])
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const setIsOpen = (menu) => {
        if ( menu === 'feeds' ) {
            setFeedsIsOpen(! feedsIsOpen)
        } else if ( menu === 'groups' ) {
            setGroupsIsOpen(! groupsIsOpen)
        }

        if ( width < 1220 ) {
            if ( menu === 'feeds' ) {
                setGroupsIsOpen(false)
            } else if ( menu === 'groups' ) {
                setFeedsIsOpen(false)
            }
        }
    }

    const closeMenus = () => {
        if ( width < 1220 ) {
            setFeedsIsOpen(false)
            setGroupsIsOpen(false)
        }
    }

    useEffect(() => {
        const handleWindowResize = () => setWidth(window.innerWidth)

        window.addEventListener('resize', handleWindowResize)

        return () => {
            window.removeEventListener('resize', handleWindowResize)
        }
    }, [])

    useEffect(() => {
        if ( feedsIsOpen && groupsIsOpen && width < 1220 ) {
            closeMenus()
        }
    }, [ width ])

    useEffect(() => {
        if ( currentUser ) {
            makeGroupsRequest(getGroups('FeedMenu', { userId: currentUser.id }))
        }

    }, [ currentUser ])

    const groupViews = []
    for(const groupId of groups) {
        const group = groupDictionary[groupId]

        groupViews.push(<li key={group.slug}>
            <GroupImage groupId={groupId} /> <NavLink to={`/g/${group.slug}`} onClick={() => closeMenus()}>{ group.title }</NavLink> 
        </li>)
    }

    const feedsMenu = (
        <menu className="feed-menu__feeds">
            <li><NavLink to="/" onClick={() => closeMenus()}><SparklesIcon  /> Everything</NavLink></li>
            <li><NavLink to="/f/friends" onClick={() => closeMenus()}><UsersIcon /> Friends</NavLink></li>
        </menu>
    )

    const groupsMenu = (
        <menu className="group-feed-menu__groups">
            { groupViews }
            <li className="view-more" >
                <Link to="/groups">All Groups</Link>
            </li>
        </menu>
    )

    if ( width >= 1220 ) {
        return (
            <div className="feed-menu">
                <menu className="feed-menu__menu">
                    <li>
                        <div className="feed-menu__sub-menu">
                            <a href="" onClick={(e) => { e.preventDefault(); setIsOpen('feeds')}} className="header">{ feedsIsOpen ? <QueueListIconOutline /> : <QueueListIconSolid /> } <span className="nav-text">Feeds</span></a>
                            { feedsIsOpen && feedsMenu }
                        </div>
                    </li>
                    <li>
                        <div className="feed-menu__sub-menu">
                            <a href="" onClick={(e) => { e.preventDefault(); setIsOpen('groups')}} className="header">{ groupsIsOpen ? <UserGroupIconOutline /> : <UserGroupIconSolid /> }<span className="nav-text">Groups</span></a>
                            { groupsIsOpen && groupsMenu }
                        </div>
                    </li>
                </menu>
            </div>
        )
    } else {
        return (
            <div className="feed-menu">
                <menu className="feed-menu__menu">
                    <li>
                        <a href="" onClick={(e) => { e.preventDefault(); setIsOpen('feeds')}} className="header">{ feedsIsOpen ? <QueueListIconOutline /> : <QueueListIconSolid /> } <span className="nav-text">Feeds</span></a>
                    </li>
                    <li>
                        <a href="" onClick={(e) => { e.preventDefault(); setIsOpen('groups')}} className="header">{ groupsIsOpen ? <UserGroupIconOutline /> : <UserGroupIconSolid /> }<span className="nav-text">Groups</span></a>
                    </li>
                </menu>
                { (feedsIsOpen || groupsIsOpen) && <div className="feed-menu__sub-menu">
                    { feedsIsOpen && feedsMenu }
                    { groupsIsOpen && groupsMenu }
                </div> }
            </div>
        )


    }

}

export default FeedMenu
