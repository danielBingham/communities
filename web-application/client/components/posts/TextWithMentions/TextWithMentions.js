import * as linkify from 'linkifyjs'
import "linkify-plugin-mention"

import logger from '/logger'

const TextWithMentions = function({ text }) {
    const links = linkify.find(text)
    console.log(text)

    links.sort((a, b) => a.start - b.start)
    console.log(links)

    let start = 0
    const views = []
    for(const link of links) {
        const section = text.slice(start, link.start)
        if ( section.length > 0 ) {
            views.push(<span key={start}>{ section }</span>)
        }
       
        start = link.end

        if ( link.type === 'mention' ) {
            views.push(<a key={link.start} href={link.href}>{ link.value }</a>)
        } else if ( link.type === 'url' ) {
            views.push(<a target="_blank" key={link.start} href={link.href}>{ link.value }</a>)
        } else {
            views.push(<span key={link.start}>{ link.value }</span>)
            logger.error(`Invalid link type detected: ${link}.`)
        }
    }

    return (
        <div className="text-with-mentions">
            { views }
        </div>
    )
}

export default TextWithMentions
