import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRequest } from '/lib/hooks/useRequest'
import { searchUsersForMention } from '/state/users'
import UserTag from '/components/users/UserTag'

import './MentionsDropdown.css'

/**
 * MentionsDropdown component displays a dropdown of users matching a query
 * when a user types '@' in a text input
 */
const MentionsDropdown = ({ 
  mentionData, 
  onSelectMention, 
  onClose,
  position = 'bottom'
}) => {
  const [users, setUsers] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchRequest, makeSearchRequest] = useRequest()
  const dropdownRef = useRef(null)
  const previousQueryRef = useRef('')
  const dispatch = useDispatch()
  
  // Get users from the state
  const userState = useSelector(state => state.users)

  // Fetch users matching the query
  useEffect(() => {
    if (mentionData && mentionData.query !== undefined) {
      // Only make a new request if the query has changed and is at least 1 character
      if (mentionData.query !== previousQueryRef.current && mentionData.query.length >= 1) {
        previousQueryRef.current = mentionData.query
        makeSearchRequest(searchUsersForMention(mentionData.query))
      }
    }
  }, [mentionData, makeSearchRequest])

  // Update users list when search results change
  useEffect(() => {
    if (searchRequest && searchRequest.state === 'fulfilled' && mentionData) {
      const queryName = `mention-search-${mentionData.query}`
      
      if (userState.queries[queryName]) {
        const userList = userState.queries[queryName].list
          .map(id => userState.dictionary[id])
          .filter(Boolean)
        
        setUsers(userList)
        setSelectedIndex(0)
      }
    }
  }, [searchRequest, userState, mentionData])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!mentionData) return
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % Math.max(1, users.length))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + users.length) % Math.max(1, users.length))
          break
        case 'Enter':
          e.preventDefault()
          if (users.length > 0) {
            handleSelectUser(users[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        default:
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mentionData, users, selectedIndex, onSelectMention, onClose])

  // Scroll selected item into view
  useEffect(() => {
    if (dropdownRef.current && users.length > 0) {
      const selectedElement = dropdownRef.current.querySelector('.selected')
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, users])

  const handleSelectUser = (user) => {
    if (onSelectMention && mentionData) {
      onSelectMention(user, mentionData.position, mentionData.query)
    }
  }

  if (!mentionData || users.length === 0) {
    return null
  }

  return (
    <div 
      className={`mentions-dropdown ${position}`} 
      ref={dropdownRef}
    >
      <ul>
        {users.map((user, index) => (
          <li 
            key={user.id}
            className={index === selectedIndex ? 'selected' : ''}
            onClick={() => handleSelectUser(user)}
          >
            <div className="user-info">
              <UserTag id={user.id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MentionsDropdown
