import React, { useEffect } from 'react'

import './Contact.css'

const Contact = function({}) {

    useEffect(function() {
        if ( document.location.hash ) {
            document.querySelector(document.location.hash).scrollIntoView({
                block: 'center'
            })
        }
    }, [])

    return (
        <article className="contact">
                    <h1>Contact Us!</h1>
            <h2>Feedback and Discussion</h2>
            <p>We're eager for your feedback and ideas. We maintain a public group on the platform that anyone can post to for public discussion of the platform and its direction. If you have thoughts, feedback, ideas, feel free to post them there!  We actively participate in the discussions in the group.</p>
            <p><a href="/group/communities-feedback-and-discussion">Communities Feedback and Discussion Group</a></p>
            <h2>Support</h2>
            <p>If you have any issues with the platform that require our direct assistant, especially issues managing a contribution, please reach out to us directly at <a href="mailto:contact@communities.social">contact@communities.social</a>.  We monitor that email during working hours on business days in the US Eastern timezone and will get back to you as quickly as we can.  It may take up to a full business day at times, so please be patient with us right now.</p>

            <h2>Open Beta</h2>
            <p>Communities is currently in Open Beta.  Which means there will probably (definitely) still be some bugs.</p>  
            <p>If you encounter bugs you have three avenues for reporting available to you: post in Communities Feedback and Discussion, email us, or open an issue in the Github Repository. Any of them works, and you should use the one you are most comfortable with!</p>
            
            <p>If you have any issues you might have with contributions.  Please don't hesitate to contact us.</p>
            <p>You can reach us at <a href="mailto:contact@communities.social">contact@communities.social</a></p>


        </article>
    )


}

export default Contact
