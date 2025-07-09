import React, { useEffect } from 'react'

import './TermsOfService.css'

const TermsOfService = function({}) {

    useEffect(function() {
        if ( document.location.hash ) {
            document.querySelector(document.location.hash).scrollIntoView({
                block: 'center'
            })
        }
    }, [])

    return (
        <article className="tos">
            <h1>Terms of Service</h1>
            <ol>
                <li><strong>Use at your own risk.</strong> Communities is
                    currently in beta.  The platform is provided "as is" and we
                    make no guarantees about its functioning.  We cannot
                    gaurantee that data submitted to the platform will not be
                    lost.  Once the platform is out of beta and stable we will
                    be able to make some reasonable guarantees, but until then
                    use it at your own risk.</li>

                <li><strong>We may remove users.</strong> We reserve the right
                    to remove users from the platform who violate any laws,
                    sanctions, or the community standards. </li>

                <li><strong>You own your content.</strong> You retain ownership of
                    and responsibility for all content you generate.    You agree to share it on the platform
                    under a <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons CC-BY 4.0 open license</a>, allowing it to
                    be reproduced and distributed freely so long as you are
                    appropriately attributed.</li>

                <li><strong>We may remove content.</strong> We reserve the right to remove any content that
                    violates the community standards.</li>

                <li><strong>Community Standards.</strong> You may not engage in harassment, abuse, or hate
                    speech.  You may not use the platform to distribute spam, misinformation, or
                    perpetrate fraud.</li>

            </ol>
        </article>
    )


}

export default TermsOfService
