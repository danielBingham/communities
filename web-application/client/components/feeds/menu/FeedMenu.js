import React, { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { QueueListIcon as QueueListIconOutline} from '@heroicons/react/24/outline'
import { QueueListIcon as QueueListIconSolid, UsersIcon, SparklesIcon } from '@heroicons/react/24/solid'

import { useLocalStorage } from '/lib/hooks/useLocalStorage'

import './FeedMenu.css'

const FeedMenu = function() {
    const [open, setOpen] = useLocalStorage('FeedMenu.state', false)

    return (
        <div className="feed-menu">
            <a href="" onClick={(e) => { e.preventDefault(); setOpen( ! open)}} className="header">{ open ? <QueueListIconOutline /> : <QueueListIconSolid /> } Feeds</a>
            { open && <menu className="feed-menu__feeds">
                <li><NavLink to="/"><SparklesIcon /> Everything</NavLink></li>
                <li><NavLink to="/f/friends"><UsersIcon /> Friends</NavLink></li>
            </menu> }
        </div>
    )

}

export default FeedMenu
