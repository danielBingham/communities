import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, NavLink } from 'react-router-dom'

import { QueueListIcon as QueueListIconOutline, MapPinIcon as MapPinIconOutline } from '@heroicons/react/24/outline'
import { QueueListIcon as QueueListIconSolid, MapPinIcon as MapPinIconSolid, GlobeAltIcon, UsersIcon, SparklesIcon, PlusIcon } from '@heroicons/react/24/solid'
import { UserGroupIcon as UserGroupIconOutline } from '@heroicons/react/24/outline'
import { UserGroupIcon as UserGroupIconSolid} from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'
import { useLocalStorage } from '/lib/hooks/useLocalStorage'

import { getGroups } from '/state/Group'

import GroupImage from '/components/groups/view/GroupImage'
import { CreatePostButton } from '/components/posts/PostForm'

import './FeedMenu.css'

const FeedMenu = function() {
    const [width, setWidth] = useState(window.innerWidth)
    const [feedsIsOpen, setFeedsIsOpen] = useLocalStorage('FeedMenu.feedsIsOpen', false)
    const [placesIsOpen, setPlacesIsOpen] = useLocalStorage('FeedMenu.placesIsOpen', false)
    const [groupsIsOpen, setGroupsIsOpen] = useLocalStorage('FeedMenu.feedsIsOpen', false)
    const [groupsPage, setGroupsPage] = useLocalStorage('FeedMenu.groupsPage', 1)

    const [groupsRequest, makeGroupsRequest] = useRequest()

    const groupDictionary = useSelector((state) => state.Group.dictionary)

    const groupsQuery = useSelector((state) => 'FeedMenu' in state.Group.queries ? state.Group.queries['FeedMenu'] : undefined)
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const setIsOpen = (menu) => {
        if ( menu === 'feeds' ) {
            setFeedsIsOpen(! feedsIsOpen)
        } else if ( menu === 'groups' ) {
            setGroupsIsOpen(! groupsIsOpen)
        } else if ( menu === 'places' ) {
            setPlacesIsOpen(! placesIsOpen)
        }

        if ( width <= 1220 ) {
            if ( menu === 'feeds' ) {
                setGroupsIsOpen(false)
                setPlacesIsOpen(false)
            } else if ( menu === 'groups' ) {
                setFeedsIsOpen(false)
                setPlacesIsOpen(false)
            } else if ( menu === 'places' ) {
                setFeedsIsOpen(false)
                setGroupsIsOpen(false)
            }
        }
    }

    const closeMenus = () => {
        if ( width <= 1220 ) {
            setFeedsIsOpen(false)
            setGroupsIsOpen(false)
            setPlacesIsOpen(false)
        }
    }

    const pageGroups = function(page) {
        if ( page <= 0 ) {
            setGroupsPage(1)
        } else if ( page >= groupsQuery?.meta.numberOfPages ) {
            setGroupsPage(groupsQuery?.meta.numberOfPages)
        } else {
            setGroupsPage(page)
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
        if ( feedsIsOpen && groupsIsOpen && width <= 1220 ) {
            closeMenus()
        }
    }, [ width ])

    useEffect(() => {
        if ( currentUser ) {
            makeGroupsRequest(getGroups('FeedMenu', { page: groupsPage, memberStatus: 'member' }))
        }

    }, [ currentUser, groupsPage ])

    const groupViews = []
    if ( groupsQuery ) {
        for(const groupId of groupsQuery.list) {
            const group = groupDictionary[groupId]

            groupViews.push(<li key={group.slug}>
                <GroupImage groupId={groupId} width={30}/> <NavLink to={`/g/${group.slug}`} onClick={() => closeMenus()}>{ group.title }</NavLink> 
            </li>)
        }
    }

    const feedsMenu = (
        <menu className="feed-menu__feeds">
            <li><NavLink to="/" onClick={() => closeMenus()}><SparklesIcon  /> Everything</NavLink></li>
            <li><NavLink to="/f/friends" onClick={() => closeMenus()}><UsersIcon /> Friends</NavLink></li>
        </menu>
    )

    const placesMenu = (
        <menu className="feed-menu__places">
            <li><NavLink to="/p/global" onClick={() => closeMenus()}><GlobeAltIcon /> Global</NavLink></li>
        </menu>
    )


    const groupsMenu = (
        <menu className="group-feed-menu__groups">
            { groupViews.length > 0 ? groupViews : <li>No groups.</li> }
            { groupsQuery?.meta.numberOfPages > 1 && <li>
                <div className="groups-feed-menu__pages">
                    <a className={groupsPage === 1 ? 'disabled' : ''} href="" onClick={(e) => { e.preventDefault(); pageGroups(groupsPage-1) }}>Prev</a>
                    <span>Page {groupsPage}</span>
                    <a className={groupsPage === groupsQuery?.meta.numberOfPages ? 'disabled' : ''} href="" onClick={(e) => { e.preventDefault(); pageGroups(groupsPage+1) }}>Next</a>
                </div>
            </li> }
        </menu>
    )

    if ( width > 1220 ) {
        return (
            <div className="feed-menu">
                <menu className="feed-menu__menu">
                    <li><CreatePostButton type="button" /></li>
                    <li>
                        <div className="feed-menu__sub-menu">
                            <a href="" onClick={(e) => { e.preventDefault(); setIsOpen('feeds')}} className="header">{ feedsIsOpen ? <QueueListIconSolid/> : <QueueListIconOutline/> } <span className="nav-text">Your Feeds</span></a>
                            { feedsIsOpen && feedsMenu }
                        </div>
                    </li>
                    <li>
                        <div className="feed-menu__sub-menu">
                            <a href="" onClick={(e) => { e.preventDefault(); setIsOpen('places')}} className="header">{ placesIsOpen ? <MapPinIconSolid /> : <MapPinIconOutline /> } <span className="nav-text">Place Feeds</span></a>
                            { placesIsOpen && placesMenu }
                        </div>
                    </li>
                    <li>
                        <div className="feed-menu__sub-menu">
                            <a href="" onClick={(e) => { e.preventDefault(); setIsOpen('groups')}} className="header">{ groupsIsOpen ? <UserGroupIconSolid/> : <UserGroupIconOutline/> }<span className="nav-text">Group Feeds</span></a>
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
                    <li><CreatePostButton type="button" /></li>
                    <li>
                        <a href="" onClick={(e) => { e.preventDefault(); setIsOpen('feeds')}} className="header">{ feedsIsOpen ? <QueueListIconSolid/> : <QueueListIconOutline/> } <span className="nav-text">Your Feeds</span></a>
                    </li>
                    <li>
                        <a href="" onClick={(e) => { e.preventDefault(); setIsOpen('places')}} className="header">{ placesIsOpen ? <MapPinIconSolid /> : <MapPinIconOutline /> } <span className="nav-text">Place Feeds</span></a>
                    </li>
                    <li>
                        <a href="" onClick={(e) => { e.preventDefault(); setIsOpen('groups')}} className="header">{ groupsIsOpen ? <UserGroupIconSolid/> : <UserGroupIconOutline/> }<span className="nav-text">Group Feeds</span></a>
                    </li>
                </menu>
                { (feedsIsOpen || placesIsOpen || groupsIsOpen) && <div className="feed-menu__sub-menu">
                    { feedsIsOpen && feedsMenu }
                    { placesIsOpen && placesMenu }
                    { groupsIsOpen && groupsMenu }
                </div> }
            </div>
        )


    }

}

export default FeedMenu
