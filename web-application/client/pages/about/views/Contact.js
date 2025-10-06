import React, { useEffect } from 'react'

import './Contact.css'

const Contact = function({}) {

    return (
        <article className="contact">
                    <h1>Contact Us!</h1>
            <h2>Feedback and Discussion</h2>
            <p>We're eager for your feedback and ideas. We maintain a public
            group on the platform, <a href="/group/communities-feedback-and-discussion">Communities Feedback and Discussion Group</a>, that anyone can post to for discussion
                of the platform and its direction.</p>
            <p>If you have thoughts, feedback,
            ideas, feel free to post them there!  We actively participate in
                the discussions in the group.</p>
            <h2>Support</h2>
            <p>If you have any issues with the platform that require our direct
            assistance, please reach
            out to us directly at <a
                href="mailto:contact@communities.social">contact@communities.social</a>.</p>
                <p>We monitor that email during working hours on business days in the
            US Eastern timezone and will get back to you as quickly as we can.
            We're a tiny team right now, so it may take several business days at times. Please be
            patient with us right now as we try to get this thing off the ground!</p>

            <h2>Open Beta</h2>
            <p>Communities is currently in Open Beta.  Which means there will still be some bugs.</p>  
            <p>If you encounter bugs you have three avenues for reporting
                available to you: post 
                in <a href="/group/communities-feedback-and-discussion">Communities Feedback and Discussion</a>, <a href="mailto:contact@communities.social">email us</a>, or <a href="https://github.com/danielbingham/communities/issues">open an issue</a> in the <a href="https://github.com/danielbingham/communities">Github Repository</a>. Any of them
            works, and you should use the one you are most comfortable
            with!</p>
           
            <h2>General Contact</h2>
            <p>For any other issue, you can reach us at <a href="mailto:contact@communities.social">contact@communities.social</a></p>


        </article>
    )


}

export default Contact
