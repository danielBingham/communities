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
import './About.css'

const About = function({}) {

    return (
        <article className="about-view">
            <h1>Welcome to Communities!</h1>
            <p>
                Communities is a user-supported social media platform that is
                working towards becoming a non-profit, multi-stakeholder
                cooperative. It's a democratically governed social network
                build to support democracy.
            </p>
            <p className="beta">
                Communities is currently in <a href="/about/faq#beta">Open
                Beta</a>.  You're welcome to use it, but it's not finished and
                there will still be some bugs.
            </p>
            <h2>Back to the Beginning</h2>
            <p>
                Remember the olden days of social media? It used to be a
                powerful tool for connecting. You could keep up with your
                friends, stay in touch with acquaintances, and find people you
                otherwise would have lost touch with. It allowed you to build
                connection with far more people than you would have been able
                to without it.
            </p>
            <p> 
                Because it allowed us to connect to each other it was also a
                powerful tool for organizing social movements. People used it
                to organize for social and economic justice during the Occupy
                movement. They used it to organize for democracy and human
                rights during the Arab Spring. It helped pro-democracy,
                anti-authoritarian, and social justice movements the world
                over. 
            </p>
            <p>
                Then, slowly but steadily, the oligarchs enshittified it. They
                tweaked the algorithm, introduced suggested posts, shoved more
                and more ads into your feed.  Suddenly, you can barely even
                find the posts of the people you're connected with.
            </p>
            <p>
                Now it's all addiction and distraction.  Anything to keep
                you scrolling.
            </p>
            <p>
                Communities is about getting back to what it used to be, and
                then evolving it forward into something better than it ever
                was.
            </p>
            <h2>Social, Not Parasocial</h2>
            <p>
                Communities is designed to enable real, social connection. It's
                built around two-way connections, using a Friend model rather
                than a follower model. We've already built Groups, so you can
                gather with like minded people and organize, and we're working
                on Events, so that you can gather in the real world. 
            </p>
            <p>
                We're building a platform where you can organize, communicate, and
                collaborate. Our goal is to help people build community, not
                audiences.           
            </p>
            <h2>Governed, Not Owned</h2>
            <p>
                We're working towards making Communities a nonprofit,
                multi-stakeholder cooperative. What does that mean?  It means
                no one will own it, and we will all govern it together. Workers
                and users will collaborate to build and steward the platform so
                that it stays a healthy, useful commons for all of us.
            </p>
            <p>
                We're still working out the exact structure.  The current
                thinking is to create a nonprofit organization in which the
                bylaws define the structure of the democracy.  Half the board
                would be elected by and from the users, the other half by and
                from the workers.  The bylaws would also include avenues for
                direct democracy in certain instances, and would require
                certain decisions to be ratified by a super majority of workers
                and users. All of it is structured to ensure users and workers stay in
                control of the platform and are able to govern it
                collaboratively.
            </p>
            <p>
                We're going to be building the democracy in collaboration with
                the early users. So join us and help us figure out what a
                truly democratic internet could look like!
            </p>
            <h2>User Supported</h2>
            <p>
                When the oligarchs fund a software platform, they control it.
                If you can't see where the money comes from, it's either coming
                from investor's pockets (so they can addict you and extract a
                return later) or its coming from your attention and your
                data.
            </p>
            <p>
                Communities is not funded by the oligarchs.  It's funded by
                directly you, and so you will be in control. 
            </p>
            <p>
                It's supported by users through a "Pay what you can" sliding
                scale subscription.  We're asking for a contribution of <a
                    href="/about/contribute">$10/month</a>, but the scale goes
                all the way down to zero. <strong>The contribution is
                    voluntary.</strong> You don't have to contribute to use the
                platform.
            </p>
            <p>
                We're aiming for 10% of users contributing the requested
                $10/month on average. That will give us some breathing room
                and ensure we can moderate the platform to a high standard. But
                we can potentially make the platform work with a significantly
                lower level of contributions.  
            </p>
            <h2>Built in Support of Democracy</h2>
            <p>
                We stated building Communities in order to build a platform to
                help people organize in defense of democracy.  We used a
                Friend model, because movements are build around real social
                connections.  We implemented Groups first, because they are a
                critical tool movements have used to organize for a decade and
                a half.  We're working on Events next, to help people gather in
                the real world.
            </p>
            <p>
                We're thinking hard about how to prevent the spread of
                misinformation, disinformation, and propaganda. How can we
                build tools that will help people find accurate information?
            </p>
            <p>
                Social media has become the public square, but all too often
                the public dialog leaves much to be desired. How could we
                design a social platform that encouraged healthy dialog and
                deliberation? What could we build that would help people engage
                with democratic institutions in order to direct them and hold
                power accountable?
            </p>
            <p>
                What could a pro-democracy social network look like?
            </p>
            <h2>Built for Mental and Social Health</h2>
            <p>
                We're intentionally designing Communities <em>not</em> to
                addict you or hold your attention. Rather we're designing it to
                allow you to see the updates that are important to you, have
                interesting and fulfilling conversations, and then walk away.
            </p>
            <p>
                We're already making decisions with this goal in mind. We only
                send notifications for events that you might need to respond to
                (comments) or that you might wish to be alerted to
                (moderation decisions).  We don't send them merely to trigger
                dopamine hits (reactions or shares). 
            </p>
            <p>
                We're going to continue studying the research to try to figure
                out how to reduce the addictive nature of social media and
                ensure its a useful tool for communication, and not built for
                distraction.
            </p>
            <h2>Open Source</h2>
            <p>
                The Communities platform is <a href="https://github.com/danielbingham/communities">open
                    source</a> for transparency and accountability purposes.
                We're developing in the open so you can watch us work, and you
                can audit the code yourself to ensure we're acting in good
                faith.
            </p>
            <h2>Social Media We Govern, Together</h2>
            <p>
                Because we all fund it and govern it together, we can ensure it
                stays healthy, helpful, and ours -- forever.
            </p>
        </article>
    )


}

export default About
