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

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams, useNavigate, Link } from 'react-router-dom'

import can, { Actions, Entities } from '/lib/permission'

import { useNewsQuery } from '/lib/hooks/News'

import NewsPost from '/components/about/NewsPost'
import NewsForm from '/components/about/NewsForm'
import Button from '/components/ui/Button'
import PaginationControls from '/components/PaginationControls'
import Spinner from '/components/Spinner'
import { RequestErrorContent } from '/components/errors/RequestError'

import './News.css'

/**
 * A page of News posts, newest first, with the page from `?page=`.  Site
 * admins can write a new post from the top of the list.
 */
const NewsList = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const canAdminSite = can(currentUser, Actions.admin, Entities.Site)

    const [ showForm, setShowForm ] = useState(false)

    const [ query, request ] = useNewsQuery()

    const navigate = useNavigate()

    let content = null
    if ( query !== null && query !== undefined ) {
        if ( query.list.length > 0 ) {
            content = query.list.map((slug) => <NewsPost key={slug} slug={slug} />)
        } else {
            content = ( <p className="news-view__empty">There's no news yet.</p> )
        }
    } else if ( request?.state === 'failed' ) {
        content = ( <RequestErrorContent message="Attempt to retrieve news" request={request} /> )
    } else {
        content = ( <Spinner /> )
    }

    return (
        <div className="news-view">
            { canAdminSite && ! showForm && <div className="news-view__controls">
                <Button type="primary" onClick={() => setShowForm(true)}>New Post</Button>
            </div> }
            { canAdminSite && showForm && <NewsForm
                onComplete={(news) => { setShowForm(false); navigate(`/about/news/${encodeURIComponent(news.slug)}`) }}
                onCancel={() => setShowForm(false)}
            /> }
            { content }
            <PaginationControls meta={query?.meta} />
        </div>
    )
}

const News = function({}) {
    const { url } = useParams()

    if ( url !== undefined && url !== null ) {
        return (
            <div className="news-view">
                <div className="news-view__back"><Link to="/about/news">&lt;- Back to News</Link></div>
                <NewsPost slug={url} />
            </div>
        )
    }

    return ( <NewsList /> )
}

export default News
