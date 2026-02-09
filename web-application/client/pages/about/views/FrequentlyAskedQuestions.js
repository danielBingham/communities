import React, { useEffect } from 'react'

import './FrequentlyAskedQuestions.css'

const FrequentlyAskedQuestions = function({}) {

    return (
        <article className="faq">
            <h1>Frequently Asked Questions</h1>
            <section id="who-owns-this">
                <h2>Who owns this?</h2>
                <p>
                    At the moment, Communities is owned by our founder, <a href="/about/team#daniel-bingham">Daniel Bingham</a>.
                    In the long run, the goal is to make it a nonprofit,
                    multi-stakeholder cooperative.  That means no one will own
                    it and we will democratically govern it.
                </p>
            </section>
            <section id="how-is-it-structured">
                <h2>How is it currently structured?</h2>
                <p>
                    Communities is currently incorporated as Communities Social
                    LLC with Daniel Bingham as the sole member. The LLC is a
                    temporary legal structure allowing us to operate during our
                    bootstrap phase.  Our goal is to convert it to a
                    multi-stakeholder cooperative as soon as we can afford to
                do so.
                </p>
                <p>
                    Communities Social LLC is governed by an <a href="/about/operating-agreement">operating
                        agreement</a> that prevents Daniel from selling it and legally
                    requires us to convert Communities into a cooperative as
                    soon as we achieve financial sustainability, defined as
                    being able to pay our bills including a full time salary.
                </p>
            </section>

            <section id="what-is-a-multi-stakeholder-cooperative">
                <h2>What is a multi-stakeholder cooperative?</h2>
                <p>
                    A multi-stakeholder cooperative is a cooperative that is
                    governed by multiple different classes of stakeholders.
                </p>
                <p>
                    Cooperatives are democratically governed businesses.  They
                    come in several flavors.
                </p>
                <p>
                    The most common is the Consumer Cooperative. In consumer
                    cooperatives, the consumers purchase shares and
                    democratically govern the cooperative through their shares.
                    Usually one share per person and one vote per share.
                </p>
                <p>
                    Grocery cooperatives and credit unions are two common forms
                    of consumer cooperatives.
                </p>
                <p>
                    Another common type is the Worker Cooperative, which is a
                    business democratically governed by its workers. Often one
                    worker, one vote.
                </p>
                <p>
                    A multi-stakeholder cooperative defines different classes
                    of member who collaborate to govern the cooperative. Often
                    some combination of workers, consumers, and investors.
                </p>
                <p>
                    We're working towards a multi-stakeholder cooperative governed by its workers
                    and consumers (users).
                </p>
            </section>

            <section id="why-non-profit">
                <h2>Why non-profit?</h2>
                <p>
                    We aren't building this to make a profit. It just needs to
                    be sustainable.
                </p>
                <p>
                    That means we need to cover the infrastructure costs and
                    support a good living for those who dedicate themselves to
                    building and maintaining it full time.
                </p> 
                <p>
                    We also don't want to deal with equity shares. We don't
                    want people to have buy-in to vote. We don't want people to
                    be able to buy and sell shares.
                </p>  
                <p>
                    We want it to be an institution that we all govern together,
                    not property to be bought and sold.
                </p>
                <p>
                    Given that, a nonprofit structure makes the most sense.
                </p>
                <p>
                    However, we'll have to see what is actually possible when
                    dig into the legal research.  Our goal is to form one of
                    the 501(c) nonprofits, but we may discover we need a
                    multi-entity structure or that there isn't actually an
                    applicable 501(c) structure we can fit into. 
                </p>
                <p>
                    We'll work collaboratively and transparently with the
                    community when we get there, and ensure the community has a
                    strong voice in the structure we wind up with.
                </p>
            </section>

            <section>
                <h2>How will it be governed?</h2>
                <p>
                    It will be governed democratically. We're still working out the exact structure.
                </p>
                <p>
                    The current thinking is that half the board will be elected
                    by and from the workers and the other half will be elected
                    by and from the users. With the Executive Director serving
                    as board facilitator and tie breaker.
                </p>
                <p>
                    We're also thinking about provisions for elements of direct
                    democracy: potentially a system of referenda.  And ensuring
                    any major decisions, including modifying the by-laws, must
                    be ratified by super-majorities of both the membership and
                    the workers.
                </p>
                <p>
                    Things like board size, board term, and how the elections
                    will be run are still being determined.
                </p>
                <p>
                    We'll be developing the democratic structure in the open
                    and in collaboration with the membership and workers when
                    we get there.  So if you stick around, you can help us
                    design and develop it!
                </p>
            </section>

            <section>
                <h2>How is it funded?</h2>
                <p>
                    By you.  We're asking everyone who uses the platform to <a
                        href="/about/contribute">contribute</a> to its upkeep,
                    if you can. Think of it less as a donation and more as a
                    "pay what you can", sliding scale subscription. 
                </p>
                <p>
                    <strong>You don't have to contribute to use the
                    platform.</strong> The scale goes to zero if you need it
                    to, but this will only work if enough people do their part
                    and contribute.
                </p>
                <p>
                    We're aiming for at least 10% of users to contribute an
                    average of $10/month.  If we achieve that, we'll have a
                    comfortable amount of breathing room and can ensure that we can
                    moderate this platform to the standard we all desire.
                </p>
                <p>
                    Currently about 6% of users are contributing an average of
                    just under $8/month.  We can make that work, but it might
                    be a little tight.
                </p>
                <p>
                    Not everyone can contribute, but if you can, please do!
                </p>
            </section>

            <section>
                <h2>Is it Open Source?</h2>
                <p>Yes.  It is <a href="https://github.com/danielbingham/communities">open source</a> under the <a href="https://github.com/danielbingham/communities?tab=AGPL-3.0-1-ov-file#readme">GPL 3.0 license.</a></p>
                <p>This is primarily for transparency, accountability, and
                contribution purposes, but would also allow the platform to be
                forked as a last resort.</p>
            </section>

            <section>
                <h2>Is it federated or decentralized with an open protocol?</h2>
                <p>
                    It is not federated or decentralized. 
                </p>
                <p>
                    You can't actually build a federated social platform that
                    allows for friends-only communication.  The moment a post
                    leaves an instance, you no longer have control over what
                    happens to it.
                </p>
                <p>
                    There are several other unsolved Very Hard Unsolved Problems in
                    decentralized and federated systems that need to be solved
                    before they are usable enough for many people.
                </p>
                <p>
                    So we're trying a different approach to solving for
                    enshittification: cooperative governace.
                </p>
            </section>

            <section id="beta">
                <h2>What does it mean for it to be a "beta"?</h2>
                <p>
                    It means it's still very much under development. There are
                    design imperfections.  There will be bugs.  There are
                    features we want to build that we haven't gotten to build
                    yet.
                </p>
                <p>
                    It also means we haven't put all the proper security
                    controls in place or been audited yet.
                </p>
                <p> 
                    If you join now, you're getting in early and helping us get
                    established. You're also agreeing that things may break on
                    you and when it does you'll tell us about it!
                </p>
                <p>
                    During the beta, <strong>you use the platform at your own
                        risk.</strong>
                </p>
            </section>

            <section>
                <h2>What does it mean to try to build healthy social media?</h2>
                <p>
                    It means we're intentionally trying to build a tool for
                    building community, maintaining connections, and having
                    healthy, productive dialogs.  We're <em>not</em> trying to
                    addict you so that we can sell your attention.
                </p>
                <p>
                    This has direct impacts on design decisions.  Among the
                    choices we've already made:
                </p>
                <ul>
                    <li>
                        We use traditional paging instead of infinite scroll.
                        This is to intentionally build in break points that
                        might prompt you to put down the phone and walk away.
                    </li>
                    <li>
                        We only notify you when there's something you might
                        want to act on.  This means we don't notify you for
                        reactions or shares to your posts.  We're trying to
                        minimize the unnecessary dopamine hits.
                    </li>
                    <li>
                        We use a friend model and not a follower model. The
                        goal is to build real connections with people, not
                        build audiences.
                    </li>
                    <li>
                        We plan to build custom feeds to give you as much
                        control as possible over your feeds, what you see and
                    when.
                    </li>
                </ul>
                <p>
                    There's a lot more we can do once we have the time to
                    really dig into the research.  We'll keep looking for ways
                    to make this critical communication tool healthier, less
                    distracting, and more useful.
                </p>
            </section>

            <section>
                <h2>May I share sexually explicit, NSFW,  or graphic content here?</h2>
                <p>
                    <strong>Not right now.</strong>  In the long run, it will
                    be up to the community to decide whether to allow sexually
                    explicit or graphic content.
                </p>
                <p>
                    There are a lot of moderation challenges that come with
                    sexually explicit content and a lot of nuance in how to
                    potentially allow it while maintaining a healthy and
                    non-abusive community space.
                </p>
                <p>
                    We want to let the community form around the platform and
                    become strong before we tackle that challenging topic. We
                    also don't have the resources or tools to moderate it
                    appropriately yet.
                </p>
                <p>
                    So for now <strong>sexually explicit and graphic content is
                        not allowed on Communities</strong>.
                </p>
            </section>
        </article>
    )


}

export default FrequentlyAskedQuestions
