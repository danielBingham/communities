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
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import * as linkify from 'linkifyjs'
import "linkify-plugin-mention"

import logger from '/logger'

import UserMention from '/components/users/UserMention'

const TextWithMentions = function({ text }) {
    const host = useSelector((state) => state.system.host)

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
                const url = new URL(link.value)
                if ( url.origin === host ) {
                    views.push(<Link key={link.start} to={`${url.pathname}${url.search}${url.hash}`}>{ link.value }</Link>)
                } else {
                    views.push(<a target="_blank" key={link.start} href={link.href}>{ link.value }</a>)
                }
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
