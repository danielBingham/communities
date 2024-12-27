import React, { useEffect } from 'react'

import './AboutPage.css'

const AboutPage = function(props) {

    useEffect(function() {
        if ( document.location.hash ) {
            document.querySelector(document.location.hash).scrollIntoView()
        }
    }, [])

    return (
        <div id="about-page">
            Communities is a user-supported <strong>non-profit social network</strong>.     
            Our goal is to help people build community,
            connect, and organize. <br />
            <p>We're not taking
                venture capital. We won't show you ads or suggested post spam. We're not selling your
                data.</p>
            <p>We want to <strong>de-enshitify the internet.</strong></p>
            <div className="beta">
                We're currently in invite-only beta.  If you have an invite, register through the link in your email.
            </div>
            <h2>What do you mean "non-profit"?</h2>
            <p>We're still figuring that out. In the strictest sense, we mean
            we aren't building this to make a profit. Obviously it needs to be
            sustainable and support a good living for those who dedicate
            themselves to building and maintaining it full time.  And we need
        to be able to cover the infrastructure costs.  But the goal is not to
        get rich or rule the world. Just to make it better.</p>
            <h2>So how is it structured?</h2>
            <p>Right now it's not. It's the side project of a single software
            engineer, Daniel Bingham. In the long run the goal is to
        figure out how to structure it as a multi-stakeholder cooperative.
        That is a cooperative governed democratically and collaboratively by
        those building it and those using it. How we get from here to there is
        still an open question.  As is how we structure the cooperative to
        resist take over by the billionaires and fascists while still being
        responsively democratic.</p>  
        </div>
    )

}

export default AboutPage
