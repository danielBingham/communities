import React, { useEffect } from 'react'

import './Roadmap.css'

const Roadmap = function({}) {

    return (
        <article className="roadmap-view">
            <h1>Development Roadmap</h1>
            <p>The Roadmap is our current plan for the platform's high level
                development. It describes the big, high level things we still
                want to build.  There's a lot of small and medium stuff not
                included here.  <strong>The roadmap is subject to frequent
                change based on feedback and new information.</strong>  It's
            not a promise or a commitment, it's a loose plan, subject to
        change.</p>
            <h2>Completed</h2>
            <p>These are things that have already been built.</p>
            <ul>
                <li><strong>Posts</strong> -- The ability to share Posts of up to 10,000 characters with your friends with either a single attached link or a single attached image.</li>
                <li><strong>Comments</strong> -- You can leave Comments of up to 5,000 characters on Posts.</li>
                <li><strong>Consensus based Reactions</strong> -- You can React to a Post using "like", "dislike", or "demote". Borrowing from consensus decision making, "like" and "dislike" are both positive for the Activity feed, "demote" is negative.</li>
                <li><strong>Groups</strong> -- You can create Groups to organize your communities.</li>
                <li><strong>Public Posts</strong> -- You can make Posts public to make them visible to anyone on your profile page.</li>
                <li><strong>Post Sharing</strong> -- You can share public Posts to your own feed.</li>
                <li><strong>@mentions for Posts and Comments</strong> -- @mentions to allow users to directly reference and notify each other.</li>
                <li><strong>Site Moderation Controls</strong> -- Moderation controls to allow site administrators and moderators to moderate the site.</li>
                <li><strong>Group Moderation Controls</strong> -- Improved moderation controls for group administrators and moderators.</li>
                <li><strong>Subgroups</strong> -- The ability to create subgroups in groups in order to better organize large groups.</li>
                <li><strong>Video Uploads</strong> -- You can upload videos to your Posts.</li>
            </ul>
            <h2>Towards 1.0</h2>
            <p>These are things we need to build or do before we can consider the platform 1.0.</p>
            <ul>
                <li><strong>Location Based Feeds</strong> -- You can add your location and have feeds of public posts generated for your neighborhood, city, county, state/region, and nation.</li>
                <li><strong>Events</strong> -- You can create events to gather with your communities in the real world.</li>
                <li><strong>More Profile Information</strong> -- You can add more information to your profile: contact, socials, a longer about, schooling, etc and control who can see what.</li>
                <li><strong>Post Image Galleries</strong> -- You can share galleries of images on Posts.</li>
                <li><strong>Multi-factor Authentication</strong> -- Multi-factor authentication to protect user's accounts.</li>
                <li><strong>Accessibility</strong> -- We need to make sure the platform and apps are fully accessible.</li>
                <li><strong>Security Audit</strong> -- We need to get a security audit to ensure the platform is fully secure.</li>
            </ul>
            <h2>Future</h2>
            <p>Things we want to build eventually...</p>
            <ul>
                <li><strong>Community Moderation Controls</strong> -- Community moderation controls allowing users to add moderation tags to posts.  Also introduces demote thresholds to remove demoted posts from public feeds.</li> 
                <li><strong>Post Tagging</strong> -- You can add up to 5 Tags to a post.  You can browse feeds of posts for each Tag.  Tagging a post places it in the appropriate feed.</li>
                <li><strong>Friend Lists</strong> -- You can organize your friends into private lists.</li>
                <li><strong>Custom Feeds</strong> -- You can create custom feeds by combining and filtering all of the above elements: Friend Lists, Groups, Events, Location, and Tags.</li>
                <li><strong>Externally Public, Private and Hidden Profiles</strong> -- The ability to set your profile's visibility.</li>
                <li><strong>Organization Profiles</strong> -- Profile pages for governments, nonprofits, institutions, and local businesses.</li>
            </ul>
        </article>
    )


}

export default Roadmap
