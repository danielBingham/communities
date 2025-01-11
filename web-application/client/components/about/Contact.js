import React, { useEffect } from 'react'

import './Contact.css'

const Contact = function({}) {

    useEffect(function() {
        if ( document.location.hash ) {
            document.querySelector(document.location.hash).scrollIntoView()
        }
    }, [])

    return (
        <article class="contact">
                    <h1>Contact Us!</h1>
            <p>Communities is currently in beta.  Which means we want your feedback!</p>  
            <p>Please email us the details of any bugs you find, any weirdness
                you encounter, anything that's unclear or hard to use.</p>  
            <p>We also
            welcome your ideas for features or changes.  In the future, we hope
            to add an area for public discussion of changes.</p>
            <p>If you have any issues you might have with contributions.  Please don't hesitate to contact us.</p>
            <p>You can reach us at <a href="mailto:contact@communities.social">contact@communities.social</a></p>


        </article>
    )


}

export default Contact
