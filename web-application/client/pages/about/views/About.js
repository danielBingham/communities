import React, { useEffect } from 'react'

import './About.css'

const About = function({}) {

    useEffect(function() {
        if ( document.location.hash ) {
            document.querySelector(document.location.hash).scrollIntoView({
                block: 'center'
            })
        }
    }, [])

    return (
        <article className="about-view">
            Communities is a user-supported <strong>non-profit social network</strong>.     
            Our goal is to help people build community,
            connect, and organize. <br />
            <p>We're not taking
                venture capital. We won't show you ads or suggested post spam. We're not selling your
                data.</p>
            <p>We want to <strong>de-enshittify the internet.</strong></p>
            <div className="beta">
                We're currently in invite-only beta.  If you have an invite, register through the link in your email. Beta means there will be bugs, please use at your own risk.
            </div>

            <h1>How It Works</h1>
            <p>Communities currently supports text posts that can have either a single link or a single image attached.</p>
            <p>Posts are only visible to friends, who can comment or react to them.</p>
            <p>Posts may be up to 10,000 characters long.  Comments may be up to 5,000 characters.</p>
            <p>Posts are viewable in either an algorithmic feed or a chronological one.</p>
            <p>Friends may react to posts using "Like", "Dislike", or "Block".</p>
            <p>Reactions and comments both affect the post's rank in the
            algorithmic feed.  Likes, Dislikes, and comments are positive, increasing the
        post's rank.  Blocks are negative, intended for community self-moderation, and
                    decrease the post's rank.</p> 
            <p>If you Block and comment, the comment will not count toward a post's rank and you are encouraged to comment on posts you Block to explain your reasons, <em>provided you feel safe doing so.</em></p>
            <p>Reactions are not anonymous, so the poster and others can see how you reacted.</p>

            <h3>Healthier Social Media (Work in Progress)</h3>
            <p>We've made a number of decisions aimed at improving the health of social media.</p>
            <p><strong>Viewed posts aren't hidden.</strong>  Posts you've already seen are not removed from either of your feeds.  This is both to help you find them again, and so that you can view all of the posts and feel confident that you have.</p>
            <p><strong>No infinite scroll.</strong>  We intentionally chose to use classic paging in order to build in a break point and give you a chance to decide to walk away when you need to.</p>
            <p><strong>Comment notifications only.</strong> You only receive notifications for comments, not reactions.  We aren't looking to dopamine addict you, only let you know when there's a comment you might want to respond to.</p>
            <p>We'll continue seeking feedback, studying the research, and trying to find ways to make this critical communication tool healthier.</p>
            <h3>We Need Your Feedback!</h3>
            <p>Communities is currently in beta.  We want feedback on everything, but especially the algorithm.  Please share your thoughts with <a href="mailto:contact@communities.social">contact@communities.social</a>.</p>
            <p>In the future, we plan to build a space on the platform itself for open meta-discussion of the platform and its systems.</p>
        </article>
    )


}

export default About
