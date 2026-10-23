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
import { useParams, useSearchParams } from 'react-router-dom'

import NewsForm from '/components/about/NewsForm'

import './NewsFormView.css'

/**
 * Write a new News post (/admin/news/create) or edit one
 * (/admin/news/:slug/edit).  `?origin=` is where to go if the form is
 * cancelled, as with editing a post.
 */
const NewsFormView = function() {
    const { slug } = useParams()
    const [ searchParams ] = useSearchParams()

    return (
        <div className="news-form-view">
            <h2>{ slug ? 'Edit News Post' : 'New News Post' }</h2>
            <NewsForm slug={slug} origin={searchParams.get('origin')} />
        </div>
    )
}

export default NewsFormView
