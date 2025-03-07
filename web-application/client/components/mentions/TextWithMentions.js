import React from 'react'
import { Link } from 'react-router-dom'
import { renderTextWithMentions } from '/lib/mentions'

import './TextWithMentions.css'

/**
 * TextWithMentions component renders text with @-mentions as links
 */
const TextWithMentions = ({ text, mentions = [] }) => {
  // If no mentions or text is empty, just return the text
  if (!mentions || mentions.length === 0 || !text) {
    return <span>{text}</span>
  }

  // Check if the text already contains mention placeholders
  const hasMentionPlaceholders = text.includes('@__MENTION_')
  
  let processedText = text
  
  // If the text doesn't have mention placeholders, we need to insert them
  if (!hasMentionPlaceholders) {
    // Simple regex to find @username patterns
    const mentionRegex = /@(\w+)/g
    let match
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedUsername = match[1]
      const matchedMention = mentions.find(m => m.username === mentionedUsername)
      
      if (matchedMention) {
        // Replace the @username with a placeholder
        const before = processedText.substring(0, match.index)
        const after = processedText.substring(match.index + match[0].length)
        processedText = before + `@__MENTION_${matchedMention.userId}__` + after
        
        // Update the regex lastIndex to account for the replacement
        mentionRegex.lastIndex = before.length + `@__MENTION_${matchedMention.userId}__`.length
      }
    }
  }

  // Create a map of mention placeholders to mention objects
  const mentionMap = {}
  mentions.forEach(mention => {
    mentionMap[`@__MENTION_${mention.userId}__`] = mention
  })

  // Render the text with mentions
  const segments = renderTextWithMentions(processedText, mentionMap)

  return (
    <span className="text-with-mentions">
      {segments.map((segment, index) => {
        if (typeof segment === 'string') {
          return <span key={index}>{segment}</span>
        } else if (segment.type === 'mention') {
          return (
            <Link 
              key={index}
              to={`/${segment.username}`}
              className="mention-link"
            >
              @{segment.name}
            </Link>
          )
        }
        return null
      })}
    </span>
  )
}

export default TextWithMentions
