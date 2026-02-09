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

import { GlobeAltIcon } from '@heroicons/react/24/outline'

import danielBinghamProfile from './daniel-bingham-profile.jpg'
import linkedInLogo from './linkedin.png'
import blueskyLogo from './bluesky.svg'
import githubLogo from './github.svg'
import mastodonLogo from './mastodon.svg'

import './Team.css'

const Team = function({}) {

    return (
        <article className="team-view">
            <h1>Team</h1>
            <p>Our team is currently composed of one full time developer (our founder) and a handful of very part time freelancers and volunteers.</p>
            <section id="daniel-bingham" className="team-view__team-member">
                <img src={danielBinghamProfile} className="team-view__team-member__profile" />
                <h2 className="team-view__team-member__name">Daniel Bingham</h2>
                <div className="team-view__team-member__title">Founder, Lead Developer</div>
                <div className="team-view__team-member__socials">
                    <span className="team-view__team-member__socials__linkedIn">
                        <a href="https://www.linkedin.com/in/daniel-bingham-672043174/" target="_blank"><img src={linkedInLogo} className="team-view__team-member__socials__logo" /></a>
                    </span>
                    <span className="team-view__team-member__socials__bluesky">
                        <a href="https://bsky.app/profile/danielbingham.bsky.social" target="_blank"><img src={blueskyLogo} className="team-view__team-member__socials__logo" /></a>
                    </span>
                    <span className="team-view__team-member__socials__mastodon">
                        <a href="https://mastodon.social/@danielbingham" target="_blank"><img src={mastodonLogo} className="team-view__team-member__socials__logo" /></a>
                    </span>
                    <span className="team-view__team-member__socials__github">
                        <a href="https://github.com/danielbingham" target="_blank"><img src={githubLogo} className="team-view__team-member__socials__logo" /></a>
                    </span>
                    <span className="team-view__team-member__socials__website">
                        <a href="https://theroadgoeson.com" target="_blank"><GlobeAltIcon className="team-view__team-member__socials__logo" /></a>
                    </span>
                </div>
                <div className="team-view__team-member__biography">
                    <p>
                        Daniel Bingham is an experienced software engineer,
                        engineering leader, activist, and cooperator.  He
                        learned to code at age 13 and has been a full stack
                        software engineer for over 16 years.  He's worked at
                        companies as diverse as GE, EllisLab, Ceros, and Flexa.
                        At EllisLab, he worked on <a href="https://expressionengine.com/" target="_blank">ExpressionEngine</a>, a highly
                        flexible CMS system. At <a href="https://www.ceros.com/" target="_blank">Ceros</a>, he joined a venture
                        funded startup building a powerful creative design
                        platform as Engineer #4, eventually becoming Director
                    of DevOps after founding and leading their DevOps team.
                    </p>
                    <p>
                        When not writing code, Daniel is an activist, municipal
                        policy advocate, and cooperator.  He has been an
                        activist going back to Occupy and has participated in
                        multiple local activism campaigns. He's an
                        experienced cooperator, having helped to organize a
                        reform movement in support of a union drive in
                        his local <a href="https://bloomingfoods.coop/" target="_blank">grocery cooperative</a>, and serving as
                        Board President of a
                        501(c)3 <a href="https://bloomingtoncooperative.org/" target="_blank">housing cooperative</a> for three years. He's been
                        deeply involved in his municipal government, serving on
                        the transition team of former mayor John
                        Hamilton, acting as Co-chair of Bloomington's Task
                        Force on Government Innovation, and running for <a href="https://bsquarebulletin.com/2019-bloomington-primary-council-candidate-district-2-daniel-bingham/" target="_blank">Bloomington City Council</a>.
                    </p>
                    <p>He has a firm belief in democracy and is committed to building a democratic economy.</p>
                </div>
            </section>
        </article>
    )


}

export default Team
