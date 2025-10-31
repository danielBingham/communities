import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import * as shared from '@communities/shared'

import getCaretCoordinates from 'textarea-caret'

import { useRequest } from '/lib/hooks/useRequest'

import { getUsers, clearUserQuery } from '/state/User'

import { DropdownMenu, DropdownMenuBody, DropdownMenuItem } from '/components/ui/DropdownMenu'

import './TextAreaWithMentions.css'

const TextAreaWithMentions = function({ value, setValue, postId, groupId, placeholder, className }) {
    const [ menuTop, setMenuTop ] = useState(0)
    const [ menuLeft, setMenuLeft ] = useState(0)

    // The index of the query representing the currently highlighted
    // suggested user.
    const [highlightedSuggestion, setHighlightedSuggestion] = useState(0)

    const [currentMention, setCurrentMention] = useState('')
    const [areMentioning, setAreMentioning] = useState(false)

    const userDictionary = useSelector((state) => state.User.dictionary)
    const query = useSelector((state) => 'TextAreaWithMentions' in state.User.queries ? state.User.queries['TextAreaWithMentions'] : null)

    const [ request, makeRequest, resetRequest ] = useRequest()

    const timeoutId = useRef(null)
    const textareaRef = useRef(null)

    const dispatch = useDispatch()

    /**
     * Clear the suggestions list.
     */
    const clearSuggestions = function() {
        dispatch(clearUserQuery({ name: 'TextAreaWithMentions' }))
    }

    const clearMention = function() {
        setAreMentioning(false)
        setCurrentMention('')
        clearSuggestions()
        setHighlightedSuggestion(0)
        
        if ( timeoutId.current ) {
            clearTimeout(timeoutId.current)
        }
    }

    /**
     * Query the backend for a list of suggested users matching the given name.
     *
     * @param {string} name The name or partial name of the user we want to
     * query for.
     */
    const suggestUsers = function(name) {
        if ( timeoutId.current ) {
            clearTimeout(timeoutId.current)
        }
        timeoutId.current = setTimeout(function() {
            if ( name.length > 0) {
                clearSuggestions()
                const params = { mention: name }
                if ( postId ) {
                    params.postId = postId
                }
                if ( groupId ) {
                    params.groupId = groupId
                }
                makeRequest(getUsers('TextAreaWithMentions', params))
            } 
        }, 150)
    }

    const onKeyDown = function(event) {
        if ( query === null || query.list.length <= 0 ) {
            return
        }

        if ( event.key == 'Enter' ) {
            event.preventDefault()
            selectSuggestion(highlightedSuggestion)
        } else if ( event.key == 'ArrowDown' || ( ! event.shiftKey && event.key === 'Tab') ) {
            event.preventDefault()
            if ( highlightedSuggestion + 1 < query.list.length ) {
                setHighlightedSuggestion(highlightedSuggestion+1)
            } else {
                setHighlightedSuggestion(query.list.length-1)
            }
        } else if ( event.key == 'ArrowUp' || (event.shiftKey && event.key === 'Tab') ) {
            event.preventDefault()
            if ( highlightedSuggestion-1 <= 0 ) {
                setHighlightedSuggestion(0)
            } else {
                setHighlightedSuggestion(highlightedSuggestion-1)
            }
        } else if ( event.key == 'Escape' ) {
            event.preventDefault()
            clearMention()
        } 
    }

    const selectSuggestion = (index) => {
        const user = userDictionary[query.list[index]]

        const indexOfLastMention = value.lastIndexOf('@')
        const newValue = value.substring(0, indexOfLastMention) + `@${user.username} `
        setValue(newValue)

        clearMention()
    }

    const onChangeInternal = function(event) {
        const text = event.target.value

        // Only trigger mentioning if we're increasing the length of `value`
        // (eg. we're typing forward and not deleting).
        if ( text.length > value.length && text.endsWith('@') ) {
            if ( ! areMentioning ) {
                setAreMentioning(true)
            }
        }

        if ( areMentioning ) {
            const indexOfLastMention = text.lastIndexOf('@')
            let lastMention = ''
            if ( indexOfLastMention === -1 ) {
                clearMention()
            } else {
                lastMention = text.substring(indexOfLastMention)
                setCurrentMention(lastMention)
            }

            if ( textareaRef.current !== null ) {
                const caretPosition = getCaretCoordinates(textareaRef.current, indexOfLastMention)
                setMenuTop(caretPosition.top+26)
                setMenuLeft(caretPosition.left)
            }

            suggestUsers(lastMention.substring(1))
        }

        if ( typeof setValue === 'function' ) {
            setValue(text) 
        }
    }

    // Focus the form on initial load.
    useEffect(function() {
        if ( textareaRef.current !== null ) {
            textareaRef.current.focus()
        }
    }, [])

    // Construct the suggestions list.
    const userSuggestions = []
    if ( query !== null ) {
        for(let index = 0;  index < query.list.length; index++) {
            const id = query.list[index]
            const user = userDictionary[id]
            userSuggestions.push(
                <a key={user.username} 
                    id={user.id} 
                    className={index === highlightedSuggestion ? "suggestion highlight" : "suggestion"} 
                    onClick={(e) => { e.preventDefault(); selectSuggestion(index) }}
                >
                    { user.name }
                </a>
            )
        }
    }

    return (
        <div className={`text-area-with-mentions ${className ? className : '' }`}>
            <textarea 
                ref={textareaRef}
                value={value}
                onChange={onChangeInternal}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
            >
            </textarea> 
            { areMentioning && query !== null && query.list.length > 0 && <div className="text-area-with-mentions__suggestions" style={{ top: menuTop, left: menuLeft }}>
                { userSuggestions }
            </div> }
        </div>
        
    )
}

export default TextAreaWithMentions
