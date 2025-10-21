import * as linkify from 'linkifyjs'
import "linkify-plugin-mention"

import logger from '/logger'

import UserMention from '/components/users/UserMention'

const TextWithMentions = function({ text }) {
    const links = linkify.find(text)

    const views = []
    if ( links.length > 0 ) {
        links.sort((a, b) => a.start - b.start)

        let start = 0
        for(const link of links) {
            const section = text.slice(start, link.start)
            if ( section.length > 0 ) {
                views.push(<span key={start}>{ section }</span>)
            }
           
            start = link.end

            if ( link.type === 'mention' ) {
                views.push(<UserMention key={link.start} username={link.value.substring(1).trim()} />)
            } else if ( link.type === 'url' ) {
                views.push(<a target="_blank" key={link.start} href={link.href}>{ link.value }</a>)
            } else {
                views.push(<span key={link.start}>{ link.value }</span>)
                logger.error(`Invalid link type detected: ${link.type}.`)
            }
        }

        if ( links[links.length-1].end !== text.length ) {
            const finalSection = text.slice(start)
            views.push(<span key={start}>{ finalSection }</span>)
        }
    } else {
        views.push(
            <span key={text}>{ text }</span>
        )
    }

    return (
        <div className="text-with-mentions">
            { views }
        </div>
    )
}

export default TextWithMentions
