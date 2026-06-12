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
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import * as shared from '@communities/shared'

import getCaretCoordinates from 'textarea-caret'

import { useRequest } from '/lib/hooks/useRequest'

import { getUsers, clearUserQuery } from '/state/User'

import './TextAreaWithMentions.css'

const TextAreaWithMentions = function({ value, setValue, postId, groupId, placeholder, className }) {
    const textZoom = useSelector((state) => state.system.textZoom)

    const [ menuTop, setMenuTop ] = useState(0)
    const [ menuLeft, setMenuLeft ] = useState(0)

    // The index of the query representing the currently highlighted
    // suggested user.
    const [highlightedSuggestion, setHighlightedSuggestion] = useState(0)

    // The text of the current mention.  This is what the user has typed after
    // and including the mention trigger character, '@'.  Eg. @john d
    const [currentMention, setCurrentMention] = useState('')

    // The index of the start ('@' symbol) of the current mention.
    const [currentMentionIndex, setCurrentMentionIndex] = useState(0)

    // Are we currently in the process of mentioning someone?  Determines
    // whether we show the mention suggestion menu.
    const [areMentioning, setAreMentioning] = useState(false)

    const userDictionary = useSelector((state) => state.User.dictionary)
    const query = useSelector((state) => 'TextAreaWithMentions' in state.User.queries ? state.User.queries['TextAreaWithMentions'] : null)

    const [ request, makeRequest, resetRequest ] = useRequest()

    const timeoutId = useRef(null)
    const textareaRef = useRef(null)
    const mentionMenuRef = useRef(null)
    const cursorRef = useRef(null)

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

    // TODO This will kill the mention if the user types to a new line
    // scrolling the text area.  We're going to punt on this for now, but
    // should try to find a fix in the future.
    const onScrollInternal = function(event) {
        if ( areMentioning ) {
            clearMention()
        }
    }

    const onKeyDownInternal = function(event) {
        if ( query === null || query.list.length <= 0 ) {
            return
        }

        if ( event.key == 'Enter' ) {
            if ( areMentioning ) {
                event.preventDefault()
                selectSuggestion(highlightedSuggestion)
            }
        } else if ( event.key == 'ArrowDown' || ( ! event.shiftKey && event.key === 'Tab') ) {
            if ( areMentioning ) {
                event.preventDefault()
                if ( highlightedSuggestion + 1 < query.list.length ) {
                    setHighlightedSuggestion(highlightedSuggestion+1)
                } else {
                    setHighlightedSuggestion(query.list.length-1)
                }
            }
        } else if ( event.key == 'ArrowUp' || (event.shiftKey && event.key === 'Tab') ) {
            if ( areMentioning ) {
                event.preventDefault()
                if ( highlightedSuggestion-1 <= 0 ) {
                    setHighlightedSuggestion(0)
                } else {
                    setHighlightedSuggestion(highlightedSuggestion-1)
                }
            }
        } else if ( event.key == 'ArrowLeft' ) {
            if ( areMentioning && textareaRef.current !== null) {
                const cursorIndex = textareaRef.current.selectionStart
                // KeyDown fires before the cursor moves.
                if ( cursorIndex-1 <= currentMentionIndex ) {
                    clearMention()
                }
            }
        } else if ( event.key == 'Escape' ) {
            if ( areMentioning ) {
                event.preventDefault()
                clearMention()
            }
        } 
    }

    const selectSuggestion = (index) => {
        const user = userDictionary[query.list[index]]

        const newValue = value.substring(0, currentMentionIndex) + `@${user.username} ` + value.substring(currentMentionIndex+currentMention.length)
        // The +2 is so that we put the cursor after the space we just added at the end of the mention.
        cursorRef.current = currentMentionIndex + user.username.length + 2
        setValue(newValue)

        clearMention()
    }

    const onChangeInternal = function(event) {
        const text = event.target.value

        if ( textareaRef.current !== null ) {
            const cursorIndex = textareaRef.current.selectionStart

            // Trigger mentioning when the character immediately before the
            // cursor is the mention character, '@'.
            if ( text.at(cursorIndex-1) === '@' ) {
                setAreMentioning(true)
                setCurrentMentionIndex(cursorIndex-1)

                const caretPosition = getCaretCoordinates(textareaRef.current, cursorIndex-1)
                setMenuTop(caretPosition.top - textareaRef.current.scrollTop + 26)
                setMenuLeft(caretPosition.left - textareaRef.current.scrollLeft)
            }

            // If we are mentioning and we just deleted the '@' character, then unset mentioning.
            if ( areMentioning ) {
                // We're intentionally using `cursorIndex` here insead of
                // `cursorIndex-1`, because that will be the index of the
                // character we just deleted.
                if ( text.length < value.length && value.at(cursorIndex) === '@' ) {
                    setAreMentioning(false)
                }
            }

            if ( areMentioning ) {
                if ( cursorIndex <= currentMentionIndex ) {
                    clearMention()
                } else {
                    const lastMention = text.substring(currentMentionIndex, cursorIndex)
                    setCurrentMention(lastMention)

                    // If the mention has grown longer than the name field, then
                    // it's time to be done mentioning.
                    //
                    // TODO Reduce length of display name to 128 (or even 90 characters)
                    // which will cover the vast majority of cases.
                    if ( lastMention.length >= 512) {
                        clearMention()
                    } else {
                        suggestUsers(lastMention.substring(1))
                    }
                }
            }
        }

        if ( typeof setValue === 'function' ) {
            setValue(text) 
        }
    }

    useLayoutEffect(() => {
        if ( cursorRef.current !== null && textareaRef.current !== null ) {
            textareaRef.current.setSelectionRange(cursorRef.current, cursorRef.current)
            cursorRef.current = null
        }
    }, [ value ])

    // Focus the form on initial load.
    useEffect(function() {
        if ( textareaRef.current !== null ) {
            textareaRef.current.focus()
        }
    }, [])

    // Check the suggestions to see if there's an exact match by name for the
    // current mention. We're not going to worry about prefix shadowing, since
    // they can just select from the menu to select the one the way.  We have a
    // shadowing issue with autocomplete no matter how we handle it.
    //
    // We also don't need to worry about exact matches for username, because if
    // they've fully typed out a mention with an exact match by username,
    // then... they've self completed the mention.  We don't need to complete
    // it for them.
    useEffect(() => {
        if ( areMentioning ) {
            // Intentionally not including `query` or `userDictionary` in the
            // dependency array here.  We only want this to run when the mention
            // changes (as they type) because we don't want to blow away anything
            // they've typed later or screw with their cursor. It's okay if query
            // or userDictionary are a bit stale, since they'll probably get
            // updated on the next run.  By the time they've typed a complete
            // mention, it's highly likely we'll have the user in question in the
            // query or the userDictionary (unless they are on a really slow
            // connection).  In the case that they don't, it's better that the
            // autocomplete silently fail than it fire after they've moved on.
            //
            // They can always back space and correct the mention later.

            // Slice off the '@' character, so we can make an exact comparison.
            const mentionText = currentMention.substring(1)

            if ( query != null ) {
                for(let index = 0; index <  query.list.length; index++) {
                    const id = query.list[index]
                    const user = userDictionary[id]

                    // If it's an exact match for a user's display name (lower
                    // case), then complete the mention.
                    if ( mentionText.toLowerCase() === user.name.toLowerCase() ) {
                        selectSuggestion(index)
                        break
                    }  


                    // If it's an exact match for a user's username, then
                    // they've already fully completed a mention.  Close the
                    // mention menu.  They may continue with a shadowwed
                    // username, but we don't care if they do.  They're clearly
                    // manually completing the mention and no longer need the
                    // suggestions.
                    //
                    // TODO The username in question won't necessarily be
                    // included in the suggestions if it's very different from
                    // the name.  This is a known issue we may fix at a future
                    // date.
                    if ( mentionText.toLowerCase() === user.username.toLowerCase() ) {
                        clearMention()
                        break
                    }

                    // If the mentionText is not an exact match for the substring
                    // of its length, then we're in to the fuzzy matches and there
                    // shouldn't be any exact matches further down the list.  We
                    // can break the loop.
                    else if ( mentionText.toLowerCase() !== user.name.toLowerCase().substring(0, mentionText.length)) {
                        break
                    }
                }
            }
        }
    }, [ currentMention ])

    useEffect(() => {
        const bodyClickHandler = function(event) {
            if ( areMentioning ) {
                if ( mentionMenuRef.current && ! mentionMenuRef.current.contains(event.target) ) { 
                    clearMention()
                } else if ( mentionMenuRef.current === null ) {
                    clearMention()
                }
            }
        }

        if ( areMentioning ) {
            document.body.addEventListener('click', bodyClickHandler)
        }

        return () => {
            if ( areMentioning ) {
                document.body.removeEventListener('click', bodyClickHandler)
            }
        }

    }, [ areMentioning ])

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
                onKeyDown={onKeyDownInternal}
                onScroll={onScrollInternal}
                placeholder={placeholder}
                style={{ fontSize: textZoom + 'em' }}
            >
            </textarea> 
            { areMentioning && query !== null && query.list.length > 0 && 
                <div 
                    ref={mentionMenuRef}
                    className="text-area-with-mentions__suggestions" 
                    style={{ top: menuTop, left: menuLeft }}
                >
                    { userSuggestions }
                </div> 
            }
        </div>
        
    )
}

export default TextAreaWithMentions
