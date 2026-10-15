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
import { Link, useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

import { PencilIcon } from '@heroicons/react/24/outline'

import can, { Actions, Entities } from '/lib/permission'

import { useNews } from '/lib/hooks/News'

import Button from '/components/ui/Button'
import Spinner from '/components/Spinner'
import Error404 from '/components/errors/Error404'
import { RequestErrorContent } from '/components/errors/RequestError'

import './NewsPost.css'

/**
 * Render links in a post's Markdown: links within Communities navigate in
 * the app, and links off of Communities open in a new tab, the way the
 * hand written posts did.
 */
const NewsPostLink = function({ node, href, children, ...props }) {
    if ( typeof href === 'string' && href.startsWith('/') && ! href.startsWith('//') ) {
        return ( <Link to={href} {...props}>{ children }</Link> )
    } else if ( typeof href === 'string' && /^https?:\/\//i.test(href) ) {
        return ( <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{ children }</a> )
    }

    return ( <a href={href} {...props}>{ children }</a> )
}

const markdownComponents = {
    a: NewsPostLink
}

/**
 * A News post, with its content rendered from Markdown.  Site admins get an
 * Edit Post button, which opens the post in NewsForm.
 *
 * Raw HTML in the Markdown is shown as text rather than rendered, and links
 * are limited to safe protocols (react-markdown's defaults).
 *
 * @param {string} slug     The post's slug.
 */
const NewsPost = function({ slug }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const canAdminSite = can(currentUser, Actions.admin, Entities.Site)

    const [news, request] = useNews(slug)

    const location = useLocation()

    if ( news === null ) {
        return ( <Error404 /> )
    }

    if ( news === undefined ) {
        if ( request?.state === 'failed' ) {
            return ( <RequestErrorContent message="Attempt to retrieve news post" request={request} /> )
        }

        return ( <Spinner /> )
    }

    return (
        <article className="news-post">
            <h1 className="news-post__title"><Link to={`/about/news/${encodeURIComponent(news.slug)}`}>{ news.title }</Link></h1>
            <div className="news-post__byline">
                posted on <span className="news-post__date">{ news.date }</span> by <span className="news-post__author">{ news.author }</span>
            </div>
            { canAdminSite && <div className="news-post__controls">
                <Button href={`/admin/news/${encodeURIComponent(news.slug)}/edit?origin=${encodeURIComponent(location.pathname + location.search)}`}>
                    <PencilIcon /> Edit Post
                </Button>
            </div> }
            <section className="news-post__body">
                <ReactMarkdown components={markdownComponents}>{ news.content }</ReactMarkdown>
            </section>
        </article>
    )
}

export default NewsPost
