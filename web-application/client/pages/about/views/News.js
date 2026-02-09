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

import { useParams } from 'react-router-dom'

import NewsPost from '/components/about/NewsPost'

import './News.css'

const posts = {
    '1-28-2026-release-0-10-0': {
        title: 'Release 0.10.0',
        date: '01/28/2026',
        author: 'Daniel Bingham',
        content: (
            <>
                <p>
                    Release 0.10.0 has been deployed!  
                </p>
                <p>
                    I think we managed it with no downtime (or very little
                    downtime) but I see some errors in the error tracker
                    suggesting some of you are hitting a little wonkiness.  If
                    you're still hitting a bit of wonkiness, try closing and
                    re-opening the app or refreshing your browser window.  That
                    should allow the code on your app to update. If wonkiness
                    persists, definitely reach out! (Making a note to improve the
                    update system.)
                </p>
                <p>
                    This release includes:
                </p>
                <ol>
                    <li>Video Posts!</li>
                    <li>Group Subscriptions</li>
                    <li>Security Hardening against Sha1-Hulud</li>
                    <li>A scattering of Bug Fixes</li>
                </ol>
                <h2>Video Posts!</h2>
                <p>
                    We now support video posts.  This is just the first
                    iteration, so it's a little rough around the edges still.
                    We support uploads up to 700 MB (~2 mins for raw phone
                    video) and processed videos up to 70 MB.  That means if you
                    pre-process it, you can potentially get it significantly
                    longer (I've gotten it up to 5 mins).  
                </p>
                <p>
                    There are still lots of improvements we can make.  Right
                    now, if you lose network connection or your phone goes to
                    sleep, the upload can fail.  We also don't show upload or
                    processing progress and it can take a long time (several
                    minutes).  So be patient with it.
                </p>
                <p>
                    One issue that should go away shortly: If you're on an
                    iPhone and you attempt to use "Take Video" while uploading,
                    that will fail until we push an update of the app to the
                    app store and then you update your app.  It has to do with
                    app permissions that we can't update without updating the
                    app in the app store itself.  We're going to submit that
                    update to the Apple store shortly and review usually takes
                    a few days.  We'll post when that process has finished!
                </p>
                <p>
                    We already have a list of improvements we plan to make to
                    it, but would still love your feedback on it!  Don't
                    hesitate to tell us if you run into issues, or have ideas
                    for improvements.
                </p>
                <h2>Group Subscriptions</h2>
                <p>
                    You can now subscribe to a group to be notified of each new
                    post in that group. You can also unsubscribe from it to get
                    no notifications from it (comments, mentions, etc).  This,
                    combined with Subgroups, should make groups an even more
                    powerful organizing tool.  You can now create Announcement
                    Subgroups, restricted to admins, and encourage folks to
                    subscribe to notifications on them in order to broadcast
                    out updates.
                </p>
                <h2>Sha1-hulud Hardening</h2>
                <p>
                    We made a bunch of changes to harden our system against the
                    new Sha1-hulud class of supply chain attacks.  These
                    attacks are pretty new and are very scary.  A bunch of
                    organizations much larger than us (and with good
                    reputations for handling security) were breached in the
                    fall through these attacks. 
                </p>
                <p>
                    We were not breached, but we needed to make sure we won't
                    be breached in the next attack. We spent a significant
                    amount of time studying the attack vector and coming up
                    with ways to protect our systems against the attack.  We
                    have reasonable protections in place now.
                </p>
                <h2>Bug Fixes</h2>
                <p>
                    There were a number of smaller bug fixes and one more
                    significant one.  Previously, posts shared out of groups
                    would failed to render unless the original post was also on
                    the feed in question.  That has now been fixed. Posts
                    shared out of groups should always render now.
                </p>
                <p>
                    As always, new releases come with a risk of new bugs.
                    Please tell us if you find any!
                </p>
                <h2>Upcoming</h2>
                <p>
                    The next week or two are going to be spent primarily on
                    outreach and fundraising, but once we get through that,
                    we're going to be working on optional location based
                    features.  The upcoming features include:
                </p>
                <ol>
                    <li>Find users near you</li>
                    <li>Local feeds for your city, county, state, and country</li>
                    <li>Events</li>
                </ol>
            </>
        )
    },
    '1-27-2026-winter-2026-transparency-update': {
        title: 'Winter 2026 Transparency Update',
        date: '01/27/2026',
        author: 'Daniel Bingham',
        content: (
            <>
                <p>
                    Welcome to all the new folks and hello to everyone who’s
                    been here a minute! 
                </p>
                <p>
                    It’s time for another transparency update.  
                </p>
                <p>
                    These are posts where we try to pull back the curtain on
                    Communities’ development, growth, and finances.  Our goal
                    is for Communities to become a cooperative, governed by workers
                    and users together. This thing belongs to all of us and we
                    will, eventually, all govern it together.  In order to govern
                    it, you need to know what’s going on!
                </p>
                <h2>TL;DR</h2>
                <p>
                    We got a $20k grant from the <a href="https://ahhahfoundation.org/">Ah HAH! Foundation</a> in December
                    that funds us through the end of February. (Thank you Ah
                    HAH! Foundation!) We’re currently at $560 / month in
                    contributions from 71 recurring contributors and we raised
                    an additional $125 in January from an additional 6 one time
                    contributors (Thank you!) 
                </p>
                <p>
                    We need to hit $1500 / month in recurring contributions by
                    the end of February in order for me to be able to continue
                    working on it full time through March.  If we don't hit
                    that, the site will stay up, but I'll drop back to part
                    time and development will slow substantially.  We need to
                    hit $8000 / month in recurring contributions for me to be
                    able to continue full time indefinitely. 
                </p>

                <h2>Long Version</h2>
                <p>
                    First, to set the stage a bit for new folks, Communities has
                    been in development since November 2024.  I’m the founder
                    and lead developer of the project (this is my admin account
                    from which I will post updates).  I’m currently the only
                    one working on it full time.  I’m being helped by a few
                    part time freelancers, a scattering of volunteers, and a
                    cadre of enthusiastic supporters who are each contributing
                    as they can.  
                </p>
                <p>
                    Communities is currently structured as an LCC with me as the
                    sole member.  We’re working on getting an operating
                    agreement in place that locks us into the cooperative
                    transition.  It prevents me from selling either the LLC or
                    the platform out of the LLC and requires us to transition
                    once we achieve financial sustainability.  We have a little
                    more work to do on it, but I’m hoping to have it in place
                    in the next few weeks and we’ll share it on the platform
                    once we have it.  
                </p>
                <p>
                    We’re currently in Open Beta, meaning there’s still a lot
                    of work to do and there are still bugs, but the platform is
                    ready for you to use it and to bring your friends – as long
                    as you’re willing to be patient with the occasional bugs
                    and don’t mind telling us when you find one ;)
                </p>
                <p>
                    Up through November 2025, Communities’ development was
                    mostly funded by my savings and some significant
                    contributions from family. As of the end of November 2025,
                    we had pretty much used up that runway.  
                </p>
                <p>
                    In December 2025, we got a $20,000 grant from the <a href="https://ahhahfoundation.org">Ah HAH!
                        Foundation</a>, a local family
                    foundation here in Bloomington, Indiana, that funded us
                    through the end of February 2026 and also funded the legal
                    work to put the operating agreement in place.  Thank you Ah
                    HAH! Foundation!
                </p>
                <p>
                    Communities’ business model is voluntary user
                    contributions.  We’re intentionally not calling it
                    “donation”, because it’s not a charity, but rather
                    collectively governed communal infrastructure.
                </p>
                <p>
                    We’re aiming for 10% of users contributing $10 / month,
                    because that gives us a comfortable amount of breathing
                    room.  However, we can potentially make this work with
                    significantly lower contribution rates – it will just mean
                    we won’t be able to moderate it as well, build as many
                    features as we want, and there might not be enough surplus
                    for us to build additional cooperative platforms (more on
                    that later).
                </p>
                <p>
                    As of this writing we’re bringing in $560 / month from 71
                    recurring contributors.  That means 5.75% of users are
                    contributing an average of $7.93 / month.  We’ve also
                    received $125 in one time contributions from 6 contributors
                    so far in January. Thank you to everyone who is
                    contributing or has contributed!
                </p>
                <p>
                    Our infrastructure costs vary. In October, November, and
                    December, they hovered around $320 / month.  In months
                    where we need to test major infrastructural changes, they
                    can be double that (because we have to run a whole second
                    environment to test the changes).  Examples are August,
                    when they were $525, and this month in January, which is on
                    track to be ~$600.  As we grow, the costs to run the
                    production environment will grow, while the cost to run the
                    staging environment should stay about the same. 
                </p>
                <p>
                    Our biggest cost is development time.  I can keep working
                    full time on Communities through the end of February,
                    thanks to the funding from Ah HAH!  If we can reach $1500 /
                    month in recurring contributions by the end of February,
                    then I can afford to keep going through March.  If we can
                    then reach $2500 / month in recurring contributions by the
                    end of March, I’ll be able to keep going through April and
                    so on up until we hit $8000 / month in recurring
                    contributions, at which point I can afford to work on it
                    full time indefinitely.
                </p>
                <p>
                    After that, each $10,000 to $20,000 / month in recurring
                    contributions will allow us to add an additional engineer,
                    QA, designer, community support, or moderator to the team.
                    That might seem like a lot, but that’s only 1000 to 2000 people
                    contributing $10 / month.  Barely anything in the grand scheme
                    of the internet!
                </p>
                <p>
                    We’re going to be working on raising additional grant
                    funding and may look into loan funding from either a
                    cooperative lender or a credit union.  But the best case
                    scenario would be finding enough early adopters willing to join
                    and support the beta!  At our current contribution rate we need
                    18,000 people to join the platform in order to hit baseline
                    financial sustainability.  
                </p>
                <p>
                    Given all this, I’m going to spend a good chunk of February
                    working on outreach, marketing, and fundraising so
                    development on the roadmap will be a little slower.
                </p>
                <p>
                    What happens if we don’t achieve that?  Well, I’ll just
                    have to go down to part time while I look for a full time
                    job to pay the bills.  I’ll keep developing the platform as
                    I am able to make time and will keep it up as long as I can
                    afford to. Contributions will be used to pay the
                    infrastructure costs and keep the platform up.
                </p>
                <p>
                    If you want to see what’s on the roadmap, you can see the
                    high level outline here:
                    <a href="https://communities.social/about/roadmap">https://communities.social/about/roadmap</a>
                </p>
                <p>
                    If you want to see the nitty gritty details, we’re developing
                    in the open, so you can watch it happening in real time on
                    our Github Repository here:
                    <a href="https://github.com/danielBingham/communities">https://github.com/danielBingham/communities</a>
                </p>
                <p>
                    Here’s the Github project we use to actively manage the detailed roadmap: <a href="https://github.com/users/danielBingham/projects/11/views/3">https://github.com/users/danielBingham/projects/11/views/3</a>
                </p>
                <p>
                    What about the cooperative conversion? I wrote a detailed
                    post laying out the current plan for how to approach that
                    here:
                    <a href="https://communities.social/about/news/11-21-2025-the-cooperative-conversion-plan">https://communities.social/about/news/11-21-2025-the-cooperative-conversion-plan</a>
                </p>
            </>
        )
    },
    '12-15-2025-release-0-9-2': {
        title: 'Release 0.9.2',
        date: '12/15/2025',
        author: 'Daniel Bingham',
        content: (
            <>
                <p>
                    Release 0.9.2
                </p>
                <p>
                    Deployed a small release today with some UX improvements and bug fixes.
                </p>
                <p>
                    Included in the release are:
                </p>
                <ul>
                    <li>
                        Significant improvements to the age gate.  We built a
                        simplified date field that allows you to type your date
                        with an enforced format.  We updated the age gate to no
                        longer keep the data of accounts that hit the age gate.
                    </li>
                    <li>
                        Added a one time contribution option to all
                        contribution pages and updated the text on the pages to
                        make it clearer that contributions are not required.  You
                        can set up a contribution, make a one time contribution, or
                        adjust an existing contribution here:
                        <a href="https://communities.social/account/contribute">https://communities.social/account/contribute</a>
                    </li>
                    <li>
                        Updated Group Moderation to notify moderators when a
                        post in a group is pending moderation.
                    </li>
                    <li>
                        Tuned the mentions search and fixed a bug in mentions
                        that prevented users with no friends from mentioning
                        anyone.
                    </li>
                    <li>
                        Group admins can now update Group titles.  All members
                        of the group will be notified of the change.
                    </li>
                    <li>
                        Friend request notifications will now link to the
                        requester's profile rather than your pending friend
                        requests list.
                    </li>
                    <li>
                        Images that fail to load will now just show as "No
                        Image" rather than an infinite spinner.
                    </li>
                    <li>
                        Link preview generation should now be more responsive
                        and faster.
                    </li>
                    <li>
                        You can now find links to the apps in the app stores in
                        the footer of the page.
                    </li>
                </ul>
                <p>
                    There were a number of smaller fixes, but those are the
                    significant ones!
                </p>
                <p>
                    As always:
                </p>
                <p>
                    New releases means a risk of new bugs.  Let us know if you find any: <a href="https://communities.social/about/contact">https://communities.social/about/contact</a>
                </p>
            </>
        )
    },
    '11-21-2025-the-cooperative-conversion-plan': {
        title: 'The Cooperative Conversion Plan',
        date: '11/21/2025',
        author: 'Daniel Bingham',
        content: (
            <>
                <p>
                    Now that Subgroups is out, I have a moment to take a breather and talk about the planned cooperative conversion.  
                </p>
                <p>
                    Currently, Communities is a single-member LLC.  I'm the
                    sole member.  It's being developed mostly by me, with the
                    help of a few freelancers and a scattering of volunteers.
                    Since we're bootstrapping it on a shoe-string budget, we
                    decided to focus on product development first and address the
                    cooperative structure once there was actually a community to
                    govern it.  The LLC is the bare minimum corporate structure we
                    felt safe operating with.
                </p>
                <p>
                    So what do we need to be able to start the cooperative
                    conversion?  Two things:  time to do the work (mostly
                    research and paperwork) and enough revenue to cover the
                    legal costs.
                </p>
                <p>
                    Our goal is to form a multi-stakeholder cooperative.  
                </p>
                <h2>Aside on Cooperatives: Skip if you're familiar with them.</h2>
                <p>
                    Not familiar with cooperatives?  Lets do a quick crash course.  
                </p>
                <p>
                    Cooperatives are democratically run businesses.  There are a bunch of different kinds of cooperatives, but you can broadly categorize them along two axes:
                </p>
                <ul>
                    <li>Who are the members (the stakeholders)?  Who's calling the shots?</li>
                    <li>Does membership come with ownership (do you have to buy in?) or participation?</li>
                </ul>
                <p>
                    You might be familiar with Grocery cooperatives or Credit
                    Unions, those are the two most common kinds of cooperative
                    in the US.  Both are "Consumer Cooperatives".  The Members
                    are the consumers - the shoppers in a grocery cooperative,
                    the people banking with the credit union.  In the case of a
                    Grocery cooperative, membership is usually purchased.  For
                    Credit Unions, it usually comes with opening an account.
                </p>
                <p>
                    Another kind of cooperative is the Worker Cooperative.  In
                    worker cooperatives, the members are the workers in the
                    business.  Sometimes there's a buy-in, sometimes there
                    isn't. You may be familiar with Equal Exchange -- they are
                    a worker cooperative.
                </p>
                <p>
                    In most cooperatives, membership comes with the right to vote for the Board of Directors, which then governs the business.
                </p>
                <p>
                    The vast majority of consumer and worker cooperatives are
                    structured as for-profit businesses and the members have to
                    purchase ownership in some way.  
                </p>
                <p>
                    However, there are also cooperatives that are structured as
                    non-profits, where membership comes from participation in
                    the cooperative.  I served as Board President of a housing
                    cooperative that was structured as a 501(c)3.  The members
                    were simply the people who rented from the cooperative.
                    Everyone who lived in one of the co-op's houses got a vote
                    on governance matters and got to vote for the board, for as
                    long as they lived in the co-op.
                </p>
                <h2>End of Aside on Cooperatives.</h2> 
                <p>
                    The goal for Communities is to become a non-profit,
                    multi-stakeholder cooperative.  In multi-stakeholder
                    cooperatives, there are multiple groups of members who
                    collaborate to govern the cooperative.  
                </p>
                <p>
                    In Communities' case, the groups will be the workers on the one hand and the users on the other hand.  
                </p>
                <p>
                    We're aiming for Communities to become a non-profit, so no
                    one will have to purchase ownership.  Instead, workers will
                    have a vote for as long as they are employed and users will
                    have a vote for as long as they are active (defined as
                    signing on at least once a month) and in good standing (not
                    sanctioned due to repeated moderation, banning, etc).  Half
                    the board will be elected by and from the users, the other
                    half by and from the workers.  The Executive Director will
                    serve as board facilitator and tie breaker.
                </p>
                <p>
                    As you can probably tell, there are a lot of questions that
                    still need answered.  Do we elect the Executive Director or
                    does the Board hire them?  How do we limit users to one
                    user, one vote?  Which of the 501 legal structures is the
                    right fit for this sort of organization?  (Can we fit it
                    into a 501 structure?). How do we run the elections?  How
                    do we ensure vocal minorities can't capture the board in
                    low turnout elections?
                </p>
                <p>
                    We've got some research and thinking to do before we put the structure in place.  
                </p>
                <p>
                    So here's the current plan.  
                </p>
                <p>
                    Right now, we're still heads down on building.  We have
                    limited runway in which to get this thing off the ground,
                    so all our time is going towards building the platform and
                    letting people know it exists. 
                </p>
                <p>
                    If we're able to achieve financial lift off, or if the
                    runway runs out and we successfully procure another source
                    of income, then we'll set about beginning the conversion.
                    Once we have enough capital to pay the lawyers, we'll do
                    the legal research into which of the 501 structures is the
                    best fit. Then we'll form that structure and recruit an
                    initial board.  
                </p>
                <p>
                    The first board will be appointed, rather than elected, and
                    tasked with drafting the permanent bylaws.  The initial
                    bylaws will clearly define a limited term (probably 2
                    years), after which new bylaws must be ratified and
                    elections for a new board held.  They will be tasked with
                    collecting feedback from users and workers and the bylaws
                    will be ratified by the users and workers.  
                </p>
                <p>
                    This gives us the best chance of getting the initial bylaws
                    right, and (hopefully) will give us the time and resources
                    to come up with the best possible answers for the remaining
                    questions.
                </p>
                <p>
                    It also means that we don't have to do two really hard
                    things at once now during our bootstrapping phase: build a
                    new platform from the ground up and navigate the creation
                    of a new democracy.  We can focus on building the platform
                    and, once there's a community ready to govern it, we can
                    turn our focus to navigating the creation of a new
                    democracy. 
                </p>
                <p>
                    So that's the current plan.  If you have thoughts on the
                    plan, the planned structure, or any of the open questions,
                    don't hesitate to share them!  
                </p>
                <p>
                    This thing belongs to all of us :)
                </p>
            </>
        )
    },
    '11-21-2025-release-0-9-0': {
        title: 'Release 0.9.0',
        date: '11/21/2025',
        author: 'Daniel Bingham',
        content: (
            <>
                <p>
                    Release 0.9.0 went live today!
                </p>
                <p>
                    This release includes Subgroups, the ability to create Groups within your Groups.  
                </p>
                <p>
                    Subgroups are fully fledged Groups.  Depending on their
                    visibility, people may join them without joining their
                    parent Group. Subgroups are bound by the visibility of
                    their parent Group.
                </p>
                <p>
                    For Public Groups:
                </p>
                <ul>
                    <li> All subgroups are the same as normal groups.  Public groups are Public, Private groups are Private, and Hidden groups are Hidden.</li>
                </ul>
                <p>
                    For Private groups:
                </p>
                <ul>
                    <li>Open subgroups of Private groups are Open to members of their parent group, and Private for non-members.</li>
                    <li>Private and Hidden subgroups are the same as normal Private and Hidden groups.</li>
                </ul>
                <p>
                    For Hidden groups:
                </p>
                <ul>
                    <li> Open subgroups of Hidden groups are Open to members of their parent group and Hidden for non-members.</li>
                    <li>Private subgroups of Hidden groups are Private to members of their parent group and Hidden for non-members.</li>
                </ul>
                <p>
                    Admins of parent Groups may add themselves to any Subgroups of their Group with full admin rights.
                </p>
                <p>
                    You can create Subgroups of Subgroups and create hierarchies of groups as deep as you need.
                </p>
                <p>
                    One less ideal aspect of the current implementation: Right
                    now, if you are an admin of a top-level Group and you want
                    to add yourself to a subgroup several levels down the
                    hierarchy, you will need to walk down the hierarchy, adding
                    yourself to the intervening groups before you can add
                    yourself to the lower layer in order to administrate it.
                    We plan to address this in a future release.
                </p>
                <p>
                    An example usage of this Subgroups might be organizing a
                    national movement.  You can create a national Group.
                    Within the top-level national Group, you could create
                    Subgroups for each State.  Within each State subgroup, you
                    could create additional Subgroups for each County, and so
                    on.
                </p>
                <p>
                    Another example usage of this might be creating a Subgroup
                    for Announcements that only admins and moderators can post
                    to.  Or you could create Subgroups for different topics of
                    conversation within your group to better organize the
                    feeds.  
                </p>
                <p>
                    As always, new releases means a risk of new bugs.  This one
                    especially had a lot of new ground to cover in testing.
                    There are 3 different group types (Public, Private, and
                    Hidden) and each of those have 3 different types of
                    subgroup (Open, Private, and Hidden) and each of those can
                    have 4 different potential posting permissions (Anyone,
                    Members, Approval, or Restricted) and they can also have
                    variety of member types (invited, requesting access, members,
                    moderators, admins, parent group member, parent group admin)
                    and all of these interplay with each other.  
                </p>
                <p>
                    When you put it all together there are well over 100
                    different configurations and cases we had to test.  There's
                    a good chance something slipped through with this one.  If
                    you find it, let us know:
                    <a href="https://communities.social/about/contact">https://communities.social/about/contact</a>
                </p>
                <p>
                    Next up we have to tackle some infrastructure maintenance
                    (upgrades and the like) and then I think we're going to
                    work on Video Posts and Image Galleries before diving into all
                    the location based features (Feeds and Events!)
                </p>
            </>
        )
    },
    '11-03-2025-release-0-8-0': {
        title: 'Release 0.8.0',
        date: '11/03/2025',
        author: 'Daniel Bingham',
        content: (
            <>
                <p>
                    Release 0.8.0 went live today.  This is a (relatively) small
                    release, since most of October was spent on marketing,
                    outreach, and fundraising rather than development, but it
                    still contains some pretty significant updates that are
                    worth calling out.
                </p>
                <h2>Places Menu and Global Feed</h2>
                <p>
                    The Feeds view now includes a Places menu with a Global feed of
                    all public posts on Communities.  This is to help us build
                    community now while the platform is small and also to lay
                    the foundation for the location based feeds feature coming
                    in the near future.  Any public posts made to feeds (but
                    not groups) will be visible on the global feed.
                </p>
                <h2>Friends of Friends List</h2>
                <p>
                    You can now view the friends of your friends (if they haven't
                    been turned off). We didn't originally implement this due
                    to privacy concerns, but as people have joined the platform
                    we've been thinking about how they're going to find each
                    other and rebuild their networks.  One of the easiest ways
                    to do it is to look at the friends of your friends.  So we
                    decided the benefits outweigh the risks as long as it can
                    be turned off.
                </p>
                <p>
                    Your friends will be able to see the list of your other friends
                    on your profile.  People who are not friends with you
                    cannot see the list.  You can turn the list off entirely in
                    your preferences, here: User Menu (Your Profile Picture) -&gt; Preferences
                </p>
                <h2>Auto-generated Link Previews and Username Migration</h2>
                <p>
                    We've removed the "Add Link" button and instead will
                    auto-generate link previews when you drop a link into the
                    text box.  This brings Communities in line with most other
                    social platform's behaviors.  
                </p>
                <p>
                    We will also no longer show an error when we can't generate
                    a link preview.  Unfortunately, showing link previews is a
                    moving target and one we're having a hard time keeping up
                    with.  AI Crawlers are not obeying the rules of the
                    internet and people are having to go to pretty extreme
                    lengths to block them.  The things they're doing to block
                    the AI crawlers, also affect things like our servers
                    pulling the information we need to show link previews.
                    Things are changing so fast that an approach that works on
                    Monday might fail by Friday.  
                </p>
                <p>
                    Given that, it doesn't make sense to show an error message
                    when we fail. Instead, the link will just be highlighted in
                    the post and we'll record the failure on the backend.
                    We'll do our best to keep up, but especially right now,
                    trying to get previews working on individual sites doesn't
                    seem like the best use of our development time.  
                </p>
                <p>
                    This also fixes the bug where links that contained `@`
                    would break (because we'd treat them as mentions).
                </p>
                <p>
                    As part of this change we used a library that can parse
                    both links and @mentions, but it couldn't handle @mentions
                    with a '.' character.  We were encountering other issues
                    caused by '.' in usernames and given that it's still early,
                    and usernames are only be used to link to profiles and for
                    mentions, we decided to change the username requirements
                    and migrate existing usernames.  Usernames may no longer
                    contain periods.  Any periods in usernames have been
                    replaced by '-'.  In the future, we'll allow usernames to
                    be updated in case you ended up with a username you're not
                    happy with!
                </p>
                <h2>Various and Sundry Bug fixes and small tweaks</h2>
                <p>
                    This release also includes a variety of bug fixes and small tweaks, including:
                </p>
                <ul>
                    <li>Better Email Validation</li>
                    <li>Field Validation in the Registration and Accept Invitation forms update immediately when a field changes (instead of when you click out of it)</li>
                    <li>Better caching for image files (you should see a lot fewer spinners)</li>
                    <li>Remove the Block button from your own profile</li>
                    <li>Improved the responsivity of Mention suggestions</li>
                    <li>Fixed a case where the Add Friend button could appear unresponsive</li>
                    <li>Fixed a bug that was age gating 18 year olds on certain days of the month</li>
                </ul>
                <h2>Upcoming</h2>
                <p>
                    The upcoming roadmap includes (not necessarily in the following order):
                </p>
                <ul>
                    <li>Sub-groups and Group Hierarchies: The ability to create groups in groups in order to better organize them.</li>
                    <li>Group Subscriptions: The ability to subscribe to a group and be notified of all new posts in a group.</li>
                    <li>User Locations and Find Users by Location: Users can enter their location on their profile and find other people in their area.</li>
                    <li>Location Feeds: If you enter your location we'll generate feeds of public posts in the Places menu for your City, County, State, and Country.</li>
                    <li>Events: The ability to create and organize events!</li>
                    <li>Video Uploads: The ability to upload video directly into posts.</li>
                    <li>Image Galleries: The ability to upload multiple images to a post and create galleries of images.</li>
                </ul>
                <p>
                    As always, new releases come with a risk of new bugs.  If you run into any, let us know: <a href="https://communities.social/about/contact">https://communities.social/about/contact</a>
                </p>
            </>
        )
    },
    '10-16-2025-fall-2025-transparency-update': {
        title: 'Fall 2025 Transparency Update',
        date: '10/16/2025',
        author: 'Daniel Bingham',
        content: (
            <>
                <p>
                    For a cooperative to be successful, it needs to operate with a
                    high degree of transparency.  As I can find the time in these
                    crazy early days, I'm going to try to write posts pulling back
                    the curtain as much as possible.
                </p>
                <p>
                    Let's start with finances.  
                </p>
                <p>
                    As of this writing we're bringing in $200 / month from 22
                    contributors.  With 257 users, that's a contribution rate
                    of ~8.5% and an average contribution of ~$9. 
                </p>
                <p>
                    We're working towards several financial milestones. 
                </p>
                <p>
                    The first is that we're bringing in enough contributions to
                    cover the infrastructure.  Right now, the infrastructure
                    costs ~$320 /month. That cost is going to steadily (but
                    slowly) rise with usage.  A very rough rule of thumb is
                    that the infrastructure costs about $0.08 per month per
                    daily active user with a floor at about $300 /month.
                </p>
                <p>
                    Before I continue, I should note that the following are
                    somewhat rough estimates.  They don't necessarily account
                    for things like payroll taxes which we will need to start
                    paying with the first hire, but they also include some
                    buffer to cover that unknown.
                </p>
                <p>
                    The second is enough that our primary developer (me) can
                    afford to work on it full time for the foreseeable future.
                    For that, we need to bring in about $7500 /month, or 750
                    people contributing at the requested $10 /month. (Health
                    care in the US is _expensive_ for a family of four.)
                </p>
                <p>
                    The third is the ability to hire a minimal team: a Quality
                    Analyst and another Software Engineer.  For that we need
                    about $50k /month, or 5,000 people contributing at an
                    average of $10 /month. 
                </p>
                <p>
                    The fourth milestone is the ability to hire a complete
                    software team, at which point we'll be able to really fly.
                    This team is composed of 3 Software Engineers, a UX
                    Designer, and a Quality Analyst.  For that we need about
                    about $100k / month, or 10,000 people contributing an
                    average of $10 /month.
                </p>
                <p>
                    Those numbers may sound high, at first glance, but when you
                    think about them in terms of the number of people
                    contributing per month it doesn't seem so unachievable.
                    There are well over 1.5 million people who have been
                    estimated to consistently show at pro-democracy protests.
                    If even 10% of those people join Communities (so 150,000
                    people) and 10% of those people contribute at an average of
                    $10 / month (less than most of us are paying for
                    streaming), then we're there and then some.  We've got the
                    complete team needed for the platform to really thrive.  
                </p>
                <p>
                    To give you some idea of the scaling power of a small
                    engineering team, the original team of 13 that built
                    Instagram famously scaled it to hundreds of millions of
                    users and tens of million daily active users.  With only a
                    team of 13.
                </p>
                <p>
                    With that said, in the long run we want to do a really good
                    job of moderating this platform.  That probably means
                    eventually hiring a reasonably large moderation team.
                    Exactly what that looks like, how big it will be, and what
                    it will cost remains to be determined.  We'll share our
                    thoughts on that as they evolve.
                </p>
                <p>
                    What happens if we don't reach those contribution levels?  
                </p>
                <p>
                    We'll keep the platform up as long as we can afford to.  As
                    the primary developer, I'm currently the only one working
                    on the platform full time.  From November 2024 to May 2025,
                    I worked on it part time, getting up at 5 am to make
                    progress on it before starting my day job and then going to
                    bed with the children.  
                </p>
                <p>
                    I can continue to work on it full time for another month or two
                    before I need to shift to job hunting at least part time.
                    I'm exploring raising non-extractive capital from various
                    cooperative financing institutions, if that comes through
                    that will extend the runway.  
                </p>
                <p>
                    If I have to shift back to part time, I will continue to work
                    on and develop the platform as I am able.  The platform is
                    also open source, so I will do some work to make it easier
                    for other volunteers to contribute as well.  Any
                    contributions will be used on Communities, to fund the
                    infrastructure or to fund another run of full time
                    development.
                </p>
                <p>
                    So, if you'd like this platform to succeed, how can you help?  
                </p>
                <p>
                    The first thing you can do is share the platform far and wide.
                    Tell all your friends about it.  Tell your networks about
                    it.  Encourage people to move over from corporate platforms.
                </p>
                <p>
                    The next thing you can do is contribute and encourage your friends to contribute (if you can afford to): <a href="https://communities.social/account/contribute">https://communities.social/account/contribute</a>
                </p>
                <p>
                    Especially at this early stage, contributions have an
                    outsized impact.  The sooner we can hire a QA, the sooner
                    we'll be able to release mostly with out introducing new bugs.
                    The sooner we can hire additional engineers, the sooner we
                    can build additional features, the sooner we can fix those
                    little interface annoyances,  the sooner we can squash those
                    bugs.  The sooner we can hire a talented UX Designer the
                    sooner we can build interfaces that are both intuitive and
                    truly beautiful.
                </p>
                <p>
                    So that's the finances.  
                </p>
                <p>
                    In the next post, we'll share the plans for the nonprofit, cooperative conversion and what we need to make that happen.
                </p>
            </>

        )
    },
    '10-06-2025-release-0-7-0': {
        title: 'Release 0.7.0',
        date: '10/06/2025',
        author: 'Daniel Bingham',
        content: (
            <>
                <p>
                    Release 0.7.0 has been deployed!
                </p>
                <p>
                    With this release Communities now has apps in both the
                    iOS and Android app stores.  We had to implement a few
                    things to pass app store review:
                </p>
                <ul>
                    <li>
                        You can now block users from their profile page.
                        Blocked users won't be able to see your posts or
                        your user profile, you will still be able to see
                        their profile, but not their posts.  
                    </li>
                    <li>
                        We now ask for your birthdate on registration.
                        This is required by various laws so that we can
                        keep people under the age of 18 off the platform.
                        It used to be 13, but a number of jurisdictions
                        have increased the age to 18 and we don't have the
                        resources to maintain different age gates for
                        different jurisdictions right now.
                    </li>
                </ul>
                <p>
                    As with any release there may be bugs, and let us know if you find any!
                </p>
            </>
        )
    },
    '09-24-2025-release-0-6-0': {
        title: 'Release 0.6.0',
        date: '09/24/2025',
        author: 'Daniel Bingham',
        content: (
            <>
                <p>
                    Release 0.6.0 has been deployed!
                </p>
                <p>
                    This release includes some significant UX improvements
                    as well as all the changes necessary to support the
                    mobile apps.  
                </p>
                <p>
                    I'll be submitting the Android and IOS apps for review
                    over the next few days.  That review could take
                    anywhere from days to weeks.  We'll cross our fingers for
                    days.
                </p>
                <p>
                    Aside from the mobile apps themselves, this release includes:
                </p>
                <ul>
                    <li> 
                        A design overhaul to make the views and the sub-navigation menus more consistent.  
                    </li>
                    <li>
                        All member and group lists should now be searchable.
                    </li>
                    <li>
                        Each view includes a relevant "create" button ("Create Post" for feeds, "Invite Friends" for friends, "Create Group" for groups). 
                    </li>
                    <li>
                        A significant overhaul of the invite UX.  You can now invite friends from a comma separate list of email addresses. It should be much easier to invite them now!
                    </li>
                    <li>
                        A significant overhaul of Group Member management.  It should be much easier to manage members in groups now.
                    </li>
                    <li>
                        This includes an overhaul of the Group invite flow.  It should be a lot easier to invite friends to a group, or invite contacts from a comma separated list of emails.
                    </li>
                    <li>
                        A notification system overhaul (again).  While
                        implementing push notifications for mobile, we also
                        implemented them for desktop.  You can turn them off in the
                        notification settings.  You'll also get notifications
                        instantly on both mobile and desktop without having to
                        refresh. 
                    </li>
                    <li>
                        These posts!  Site Admins can now make Announcement
                        and Info posts to everyone's feed.  Announcements are
                        for major site announcements (release, policy changes,
                        etc). Info are for general site information - things
                        like how tos, extended discussion of new features, and
                        requests for feedback.  You can turn either or both of
                        them off on your Preferences page: User Menu (Your Profile Picture) -&gt; Preferences.
                    </li>
                </ul>
                <p>
                    This release also includes various and sundry bug fixes, but of course, with any release there's always a risk of new bugs.  If you spot any, let us know!
                </p>
            </>
        )
    },
}

const News = function({}) {
    const { url } = useParams()

    if ( url !== undefined && url !== null && url in posts) {
        const post = posts[url]
        return (
            <div className="news-view">
                <div className="news-view__back"><a href="/about/news">&lt;- Back to News</a></div>
                <NewsPost url={`/about/news/${url}`} title={post.title} date={post.date} author={post.author}>
                    { post.content }
                </NewsPost>
            </div>
        )
    } else {
        const postViews = []
        for(const [url, post] of Object.entries(posts)) {
            postViews.push(
                <NewsPost url={`/about/news/${url}`} title={post.title} date={post.date} author={post.author}>
                    { post.content }
                </NewsPost>
            )
        }

        return (
            <div className="news-view">
                { postViews }
            </div>
        )
    }


}

export default News
