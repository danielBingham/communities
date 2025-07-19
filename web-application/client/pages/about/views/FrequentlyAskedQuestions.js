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
            <h1>Frequently Asked Questions</h1>
            <section>
                <h2>What do you mean "non-profit"?</h2>
                <p>We aren't building this to make a profit. It just needs
                    to be sustainable.</p>
                <p>That means we need to cover the
                    infrastructure costs and support a good living for those who
                    dedicate themselves to building and maintaining it full
                time.</p> 
                <p>We haven't formed the cooperative structure yet,
                but the goal is to form it as one of the 501(c) non-profits
            when we do.</p>
            </section>

            <section>
                <h2>How is it structured?</h2>
                <p>Communities is currently incorporated as Communities
                Social, LLC. The LLC is a temporary legal structure allowing
                    us to operate during our bootstrap phase.</p>
                <p> If we're able to achieve financial sustainability, then
                    we'll convert the LLC to a 501(c) non-profit structured as
                    a multi-stakeholder cooperative. There's a clause in the
                LLC's Operating Agreement requiring this conversion.</p>
                <p>A multi-stakeholder cooperative is one
                    governed democratically and collaboratively by its workers 
                    and its users.</p>
            </section>

            <section>
                <h2>How will it be governed?</h2>
                <p>It will be governed democratically.</p>
                <p>We're still working out the exact structure.  The current
                thinking is that half the board will be elected by and from the
            workers and the other half will be elected by and from the users.
            With the Executive Director serving as board facilitator and tie
                breaker.</p>
                <p>Things like board size, board term, and how the elections
                will be run are still being determined.</p>
            </section>

            <section>
                <h2>How is it funded?</h2>
                <p>By you.  We're asking everyone who uses the platform to <a href="/about/contribute">contribute</a> to 
                    its upkeep. Think of it less as a donation
                    and more as a "pay what you can", sliding scale subscription. </p>
                <p>The scale
                    goes to zero if you need it to, but this will only work if enough people do their part and contribute.</p>
            </section>

            <section>
                <h2>Is it Open Source?</h2>
                <p>Yes.  It is <a href="https://github.com/danielbingham/communities">open source</a> under the <a href="https://github.com/danielbingham/communities?tab=AGPL-3.0-1-ov-file#readme">GPL 3.0 license.</a></p>
                <p>This is primarily for transparency, accountability, and
                contribution purposes, but would also allow the platform to be
                forked as a last resort.</p>
            </section>

            <section id="beta">
                <h2>What does it mean for it to be a "beta"?</h2>
                <p>It means it's still very much under development. There are
                    design imperfections.  There will be bugs.  There are
                features we want to build that we haven't gotten to build
                    yet.</p>
                <p>It also means we haven't put all the proper security
                controls in place or be audited yet.</p>
                <p> If you join now, you're getting in early and helping us
                    get established. You're also agreeing to help us test -
                    meaning you agree that things may break on you and when it
                does you'll tell us about it!</p>
                <p>During the beta, <strong>you use the platform at your own
                    risk.</strong></p>
            </section>

            <section>
                <h2>How is it healthy social media?</h2>
                <p>It means we're intentionally trying to build a tool for
                building community, maintaining connections, and having healthy, 
            productive dialogs.  We're <em>not</em> trying
        to addict you so that we can sell your attention.</p>
                <p>This has direct impacts on design decisions.  Among the choices we've already made:</p>
                <ul>
                    <li>We use traditional paging instead of infinite scroll.  This is to intentionally build in break points that might prompt you to put down the phone and walk away.</li>
                    <li>We only notify you when there's something you might want to act on.  This means we don't notify you for reactions or shares to your posts.  We're trying to minimize the unnecessary dopamine hits.</li>
                    <li>We use a friend model and not a follower model. The goal is to build real connections with people, not build audiences.</li>
                    <li>We plan to build custom feeds to give you as much control as possible over your feeds, what you see and when.</li>
                </ul>
                <p>There's a lot more we can do once we have the time to really dig into the research.  We'll keep looking for ways to make this critical communication tool healthier, less distracting, and more useful.</p>
            </section>
        </article>
    )


}

export default FrequentlyAskedQuestions
