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
            <h1>Welcome to Communities!</h1>
            <p>Communities is a user-supported social media platform that will be a
                non-profit, multi-stakeholder cooperative.</p>
            <p className="beta">Communities is currently in Open Beta.  You're
            welcome to use it, but it's not finished and there will still be
            some bugs.</p>
            <h2>Social, Not Parasocial</h2>
            <p>Communities is designed to enable real, social
                connection. It's a platform where you can find communities of
                place and interest.  Where you can organize, collaborate,
                communicate and then gather in the real world.</p>
            <h2>Healthy Social Media</h2>
            <p>It's
                intentionally designed <em>not</em> to addict you or hold your
                attention. Rather it's designed to allow you to see the
                updates that are important to you, have interesting and
                fulfilling conversations, and then walk away.</p>
            <h2>User Supported and User Governed</h2>
            <p>We're not taking venture capital (or any equity investment).
            We're not going to show you ads or suggested post spam.  We're not
                going to sell your data. And we'll write those constraints
                into the bylaws.</p>
            <p>It will be supported by you -- its users -- through a sliding
            scale subscription.  All users are asked to <a
                href="/about/contribute">contribute $10/month</a> if they can,
                but the scale goes all the way down to zero if
                you need it to. You don't have to contribute to use the
                platform.</p>
            <h2>Anti-Enshittification</h2>
            <p>Communities is structurally and technically designed to resist <a href="https://en.wikipedia.org/wiki/Enshittification">enshittification</a>. </p>
            <p> It will be structured as a multi-stakeholder cooperative,
                governed collaboratively by you -- its users -- and us -- its
                workers.  The bylaws will be written so that any major changes
                to them have to be ratified by a super-majority of the workers
                and a majority of the active users, ensuring that the structure
                can resist billionaire and corporate takeover.</p>
            <p>You legally own the data you put on the platform and only grant
                Communities the minimal license necessary to function. Meaning
                we're not allowed to sell it.</p>
            <h3>Open Source and Open API</h3>
            <p>The Communities platform is <a href="https://github.com/danielbingham/communities">open source</a> for transparency and accountability purposes.</p>
            <p>In the future, we plan to build an open API and documented
                exportable data structures. This will allow anyone to build on
                top of it and allow you to leave and take your data with you,
            if you need to.</p> <h2>Social Media We Govern, Together</h2>
            <p>Because we govern it and control it collectively, we can ensure
            it stays healthy, helpful, and ours -- forever.</p>
        </article>
    )


}

export default About
