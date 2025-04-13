import React, { useEffect } from 'react'

import './Roadmap.css'

const Roadmap = function({}) {

    useEffect(function() {
        if ( document.location.hash ) {
            document.querySelector(document.location.hash).scrollIntoView({
                block: 'center'
            })
        }
    }, [])

    return (
        <article className="roadmap-view">
            <p>The Roadmap is our current plan for the platform's development.
            The features described here are the things we've either already
        built or would like to build.  <strong>The roadmap is subject to
        frequent change based on feedback and new information.</strong>  It's
        not a promise or a commitment, it's a loose plan, subject to
        change.</p>
            <h2>Completed</h2>
            <ul>
                <li><strong>Posts</strong> -- The ability to share Posts of up to 10,000 characters with your friends with either a single attached link or a single attached image.</li>
                <li><strong>Comments</strong> -- You can leave Comments of up to 5,000 characters on Posts.</li>
                <li><strong>Consensus based Reactions</strong> -- You can React to a Post using "like", "dislike", or "demote". Borrowing from consensus decision making, "like" and "dislike" are both positive for the Activity feed, "demote" is negative.</li>
                <li><strong>Groups</strong> -- You can create Groups to organize your communities.</li>
                <li><strong>Public Posts</strong> -- You can make Posts public to make them visible to anyone on your profile page.</li>
                <li><strong>Post Sharing</strong> -- You can share public Posts to your own feed.</li>
            </ul>
            <h2>Future</h2>
            <ul>
                <li><strong>@mentions for Posts and Comments</strong> -- @mentions to allow users to directly reference and notify each other.</li>
                <li><strong>Multi-factor Authentication</strong> -- Multi-factor authentication to protect user's accounts.</li>
                <li><strong>Site Moderation Controls</strong> -- Moderation controls to allow site administrators and moderators to moderate the site.</li>
                <li><strong>Community Moderation Controls</strong> -- Community moderation controls allowing users to add moderation tags to posts.  Also introduces demote thresholds to remove demoted posts from public feeds.</li> 
                <li><strong>Location Based Feeds</strong> -- You can add your location and have feeds of public posts generated for your neighborhood, city, county, state/region, and nation.</li>
                <li><strong>Events</strong> -- You can create events to gather with your communities in the real world.</li>
                <li><strong>Post Image Galleries</strong> -- You can share galleries of images on Posts.</li>
                <li><strong>Video Uploads</strong> -- You can upload videos to your Posts.</li>
                <li><strong>Post Tagging</strong> -- You can add up to 5 Tags to a post.  You can browse feeds of posts for each Tag.  Tagging a post places it in the appropriate feed.</li>
                <li><strong>Friend Lists</strong> -- You can organize your friends into private lists.</li>
                <li><strong>Custom Feeds</strong> -- You can create custom feeds by combining and filtering all of the above elements: Friend Lists, Groups, Events, Location, and Tags.</li>
            </ul>
        </article>
    )


}

export default Roadmap
