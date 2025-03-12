import React, { useEffect } from 'react'

import './FrequentlyAskedQuestions.css'

const FrequentlyAskedQuestions = function({}) {

    useEffect(function() {
        if ( document.location.hash ) {
            document.querySelector(document.location.hash).scrollIntoView({
                block: 'center'
            })
        }
    }, [])

    return (
        <article className="faq">

            <section>
                <h2>What do you mean "non-profit"?</h2>
                <p>We aren't building this to make a profit. It just needs
                    to be sustainable.</p>
                <p>That means we need to cover the
                    infrastructure costs and support a good living for those who
                    dedicate themselves to building and maintaining it full
                time.</p> 
                <p>Our intention is to build communal infrastructure. Ephasis on communal.</p>
            </section>

            <section>
                <h2>How is it structured?</h2>
                <p>Currently, it's the side project of a single 
                    engineer.</p>
                <p> If we're able to raise enough funding to build a team, then it will be
                    structured as a multi-stakeholder cooperative.</p>
                <p>A multi-stakeholder cooperative is one
                    governed democratically and collaboratively by its workers 
                    and its users.</p>
            </section>

            <section>
                <h2>How is it funded?</h2>
                <p>By you: the people who use it.  We're asking everyone who uses the platform to
                contribute to its upkeep. Think of it less as a
                donation and more as a sliding scale subscription, where the scale
                goes to zero if you need it to.</p>
            </section>

            <section>
                <h2>What does it mean for it to be a "beta"?</h2>
                <p>It means it's still very much under development. It's messy.
                    There are design imperfections.  There will be bugs.  There are
                    features we want to build that we haven't gotten to build yet.</p>
                <p> If you join now, you're getting in early, but you're also
                    agreeing to help us test - meaning you agree that things may
                break on you and when it does you'll tell us about it!</p>
                <p>Also, please be careful about what you post at this stage.  We'll do our best to keep your private posts private, but we can make no guarantees during the beta. Software development is hard, and it takes a lot of brains to make sure we don't mess up.  Right now we don't have enough brains to guarantee that with any reasonable certainty. So, during the beta, <strong>please understand that you use the platform at your own risk.</strong></p>
            </section>

            <section>
                <h2>What can you do so far?</h2>
                <p>Currently you can share text posts to your friends with attached
                    links or images. Posts are currently limited to a single image,
                    but we plan to introduce galleries soon. Your friends can
                comment and react to those posts.</p>
                <p>We use a two-way friend model rather than a one-way follower
                    model. The goal is to foster social relationships, not
                    parasocial.</p>
                <p>There's an algorithmic feed with a very simple activity based
                algorithm and a chronological feed that just shows posts in the
                    order they were posted.  Both are easily accessible.</p>
                <p>The algorithmic feed borrows from consensus decision making. The
                "like" and "dislike" reactions both increase the post's activity
                    score in the algorithm, as do comments. The "block" reaction
                    decreases the post score in the algorithm, meaning it will drop
                    in the algorithmic feed.</p>
                <p>Block is intended to be used on posts
                    deserving of moderation and censureship: misinformation,
                    disinformation, spam, slop, hate, abuse, and violations of the
                    paradox of tolerance.  In the future, we plan to implement
                    block thresholds that will remove a post with a high-enough
                    proportion of blocks from the feed entirely.</p>
                <p>The idea behind this system is that it allows users to be the
                first layer of moderation on the platform.  Then the moderation
            team can be a second layer, moderating the moderators.  We'll build an
            appeal system for blocked posts and posts that were found to not be
            deserving of block will be unblocked.  If users are found to be
            consistently abusing block to attempt to silence legitimate dissent or
            marginalized people, then they'll lose the right to block.</p>
            </section>

            <section>
                <h2>What hasn't been built yet?</h2>
                <p> Building software is an experimental process. To do it well,
                    you have build prototypes, put them in front of users, and
                    watch to see if they work the way you think they will. That's
                    the approach we'll take, though we'll use an opt-in approach
                    for the experimental testing stage.</p>
                <p>We have lots of ideas to try.</p>
                <p>Public posts and post sharing are
                    planned.</p>
                <p>We want to introduce post tagging and the ability to
                    build feeds around tags or sets of tags. The idea is that this
                    would allow people to find and build communities of shared
                    interest. </p>
                <p>We also want to build features for building location
                    feeds.  The idea is that you could add your location and we
                    would then generate feeds of posts for your neighborhood, city,
                    county, state/region, and country. You could opt in to your own
                    posts being shown in those feeds.  The thought is that this
                    would allow people to build communities of place.</p>
                <p>We also have
                    ideas around building events and event planning features to
                    help people get off the screen and gather in the real world.
                    And we'll keep brainstorming and seeking more ideas from
                    users.</p>
                <p>All of the brainstorming and experimenting will be guided by our
                    ultimate goals:</p> 
                <ul>
                    <li>Help people find each other, build 
                        community, and organize.</li>
                    <li>Foster an environment of accurate information and
                        healthy dialog.</li>
                </ul>
            </section>
        </article>
    )


}

export default FrequentlyAskedQuestions
