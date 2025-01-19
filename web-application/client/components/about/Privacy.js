import React, { useEffect } from 'react'

import './Privacy.css'

const Privacy = function({}) {

    useEffect(function() {
        if ( document.location.hash ) {
            document.querySelector(document.location.hash).scrollIntoView({
                block: 'center'
            })
        }
    }, [])

    return (
        <article class="privacy">
                    <h1>Privacy Policy</h1>
            <ol>
                <li>You
                    retain ownership of your content and share it under a
                Creative Commons CC-By 4.0 license.</li>

                <li>During the beta, we make no guarantees about the privacy of
                    content shared on the platform. Once the platform is stable
                    we hope to make some reasonable guarantees, but in the
                    meantime, use at your own risk.</li>

                <li>The Communities team
                may need to view your content during moderation, debugging, or
                    other tasks necessary for the operation of the platform.</li>

                <li> We will not sell your content or information.  We only collect
                    the information necessary for the platform to function.</li>

                <li> We will need to share some of your information with 3rd party data processors where it is
                    necessary for the functioning of the platform.  For example:  sending
                    notification emails through PostMark (our email provider), storing your data in our database on AWS (our infrastructure provider), or sharing billing information with Stripe (our billing provider).</li>
            </ol>

            <h2>Third Party Processors</h2>

Our third party processors currently consist of:

            <ul>
                <li><a href="https://aws.amazon.com">Amazon Web Services (AWS)</a>: Our hosting and cloud infrastructure provider.  All data is stored in AWS' cloud.</li>
                <li><a href="https://postmark.com">PostMark</a>: Our email provider.</li>
                <li><a href="https://stripe.com">Stripe</a>: Our billing and payments provider.</li>
            </ul>

        We may add additional providers as needed.
        </article>
    )


}

export default Privacy
