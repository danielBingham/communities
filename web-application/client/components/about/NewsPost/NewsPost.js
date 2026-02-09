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

import './NewsPost.css'

const NewsPost = function({title, url, date, author, children}) {
    return (
        <article id="" className="news-post">
            <h1 className="news-post__title"><a href={url}>{ title }</a></h1>
            <div className="news-post__byline">
                posted on <span className="news-post__date">{ date }</span> by <span className="news-post__author">{ author }</span>
            </div>
            <section className="news-post__body">
                { children }
            </section>
        </article>
    )
}

export default NewsPost
