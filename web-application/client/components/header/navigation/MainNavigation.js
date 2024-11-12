import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {  Link } from 'react-router-dom'

import { 
    HomeIcon,
    ChevronUpIcon, 
    ChevronDownIcon, 
    BookOpenIcon, 
    TagIcon, 
    UserCircleIcon, 
    DocumentIcon,
    DocumentCheckIcon,
    QuestionMarkCircleIcon,
    NewspaperIcon
} from '@heroicons/react/24/outline'
import { GlobeAltIcon } from '@heroicons/react/24/outline'

import './MainNavigation.css'

/**
 * Display primary navigation for the site.
 *
 * @param {object} props    The standard React props object - empty in this case.
 */ 
const MainNavigation = function(props) {

    const [ menuVisible, setMenuVisible ] = useState(false)

    const menuRef = useRef(null)

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    const toggleMenu = function(event) {
        event.preventDefault()

        setMenuVisible( ! menuVisible )
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        const onBodyClick = function(event) {
            if ( menuRef.current && ! menuRef.current.contains(event.target) ) {
                setMenuVisible(false)
            } 
        }
        document.body.addEventListener('mousedown', onBodyClick)

        return function cleanup() {
            document.body.removeEventListener('mousedown', onBodyClick)
        }
    }, [ menuVisible, menuRef ])

    // ======= Render ===============================================

    return (
        <>
            <div id="about-navigation" className="navigation-block">
                <Link to="/"><HomeIcon />Home</Link>
                <Link to="/about"><QuestionMarkCircleIcon />About</Link>
            </div>
        </>
    )

}

export default MainNavigation 
