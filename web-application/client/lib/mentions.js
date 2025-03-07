/**
 * Utility functions for handling @-mentions in posts and comments
 */

/**
 * Parse text to find @-mention patterns and extract the mention information
 * @param {string} text - The text to parse for mentions
 * @param {Array} mentions - Array of mention objects with userId and username
 * @returns {Object} Object with parsedText (with mentions replaced with placeholders) and mentionMap
 */
export const parseMentions = (text, mentions = []) => {
  if (!text || !mentions || mentions.length === 0) {
    return { parsedText: text, mentionMap: {} };
  }

  const mentionMap = {};
  let parsedText = text;

  // Sort mentions by position in descending order to avoid index shifting
  const sortedMentions = [...mentions].sort((a, b) => b.position - a.position);

  // Replace each mention with a placeholder
  sortedMentions.forEach((mention) => {
    if (mention.position !== undefined && mention.length !== undefined) {
      const mentionId = `@__MENTION_${mention.userId}__`;
      mentionMap[mentionId] = mention;

      // Replace the mention in the text with the placeholder
      parsedText = 
        parsedText.substring(0, mention.position) + 
        mentionId + 
        parsedText.substring(mention.position + mention.length);
    }
  });

  return { parsedText, mentionMap };
};

/**
 * Render text with @-mentions as links
 * @param {string} text - The text containing mention placeholders
 * @param {Object} mentionMap - Map of mention placeholders to mention objects
 * @returns {Array} Array of text segments and React elements for mentions
 */
export const renderTextWithMentions = (text, mentionMap) => {
  if (!text) return [];
  if (!mentionMap || Object.keys(mentionMap).length === 0) return [text];

  const segments = [];
  let lastIndex = 0;

  // Regular expression to find mention placeholders
  const mentionRegex = /@__MENTION_([0-9a-f-]+)__/g;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const matchedText = match[0];
    const startIndex = match.index;
    
    // Add text before the mention
    if (startIndex > lastIndex) {
      segments.push(text.substring(lastIndex, startIndex));
    }
    
    // Add the mention as a special segment
    const mention = mentionMap[matchedText];
    if (mention) {
      segments.push({
        type: 'mention',
        userId: mention.userId,
        username: mention.username,
        name: mention.name
      });
    } else {
      segments.push(matchedText);
    }
    
    lastIndex = startIndex + matchedText.length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    segments.push(text.substring(lastIndex));
  }
  
  return segments;
};

/**
 * Extract mentions from text as the user types
 * @param {string} text - The text to extract mentions from
 * @param {number} cursorPosition - Current cursor position in the text
 * @returns {Object} Object with mentionData (if a mention is being typed) and cleanText
 */
export const extractMentionData = (text, cursorPosition) => {
  if (!text) return { mentionData: null, cleanText: '' };

  // Find the @ symbol before the cursor
  const textBeforeCursor = text.substring(0, cursorPosition);
  const atIndex = textBeforeCursor.lastIndexOf('@');
  
  // If no @ found or @ is followed by a space, return null
  if (atIndex === -1 || (atIndex < textBeforeCursor.length - 1 && textBeforeCursor[atIndex + 1] === ' ')) {
    return { mentionData: null, cleanText: text };
  }
  
  // Extract the text between @ and cursor
  const mentionText = textBeforeCursor.substring(atIndex + 1);
  
  // If there's a space in the mention text, it's not a valid mention
  if (mentionText.includes(' ')) {
    return { mentionData: null, cleanText: text };
  }
  
  return {
    mentionData: {
      query: mentionText,
      position: atIndex,
      cursorPosition
    },
    cleanText: text
  };
};

/**
 * Create a mention object from a user
 * @param {Object} user - User object
 * @param {number} position - Position in the text where the mention starts
 * @param {string} query - The query text that was used to find this user
 * @returns {Object} Mention object
 */
export const createMention = (user, position, query) => {
  return {
    userId: user.id,
    username: user.username,
    name: user.name,
    position,
    length: query.length + 1, // +1 for the @ symbol
    displayText: `@${user.name}`
  };
};

/**
 * Insert a mention into text
 * @param {string} text - Original text
 * @param {Object} mention - Mention object with position and displayText
 * @param {number} cursorPosition - Current cursor position
 * @returns {Object} Object with updated text and new cursor position
 */
export const insertMention = (text, mention, cursorPosition) => {
  const beforeMention = text.substring(0, mention.position);
  const afterMention = text.substring(cursorPosition);
  
  // Replace the @query with the display text plus a space
  const newText = beforeMention + mention.displayText + ' ' + afterMention;
  const newCursorPosition = mention.position + mention.displayText.length + 1; // +1 for the space
  
  return { text: newText, cursorPosition: newCursorPosition };
};

/**
 * Convert mentions from display format to storage format
 * @param {string} text - Text with display mentions (@Name)
 * @param {Array} mentions - Array of mention objects
 * @returns {Object} Object with cleanText (with mentions replaced with placeholders) and storageMentions
 */
export const convertMentionsForStorage = (text, mentions) => {
  if (!mentions || mentions.length === 0) {
    return { cleanText: text, storageMentions: [] };
  }

  // Sort mentions by position in descending order to avoid index shifting
  const sortedMentions = [...mentions].sort((a, b) => b.position - a.position);
  let cleanText = text;

  // Replace display mentions with placeholders in the text
  sortedMentions.forEach(mention => {
    const mentionPlaceholder = `@__MENTION_${mention.userId}__`;
    cleanText = 
      cleanText.substring(0, mention.position) + 
      mentionPlaceholder + 
      cleanText.substring(mention.position + mention.displayText.length);
  });

  // Convert to storage format
  const storageMentions = mentions.map(mention => ({
    userId: mention.userId,
    username: mention.username,
    name: mention.name
  }));

  return { cleanText, storageMentions };
};
