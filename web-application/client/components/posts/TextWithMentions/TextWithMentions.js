import React from 'react'

import Linkify from 'react-linkify'

import * as shared from '@communities/shared'

import UserMention from '/components/users/UserMention'

const TextWithMentions = function({ text }) {
    const tokens = shared.lib.mentions.tokenizeMentions(text)
    const views = []

    for(let index = 0; index < tokens.length; index++) {
        if ( tokens[index].at(0) === '@' ) {
            const username = tokens[index].substring(1)
            views.push(<UserMention key={index} username={username} />)
        } else {
            views.push(<span key={index} ><Linkify>{ tokens[index] }</Linkify></span>)
        }
    }

    return (
        <div className="text-with-mentions">
            { views }
        </div>
    )
}

export default TextWithMentions
