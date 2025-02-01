import React, { useState } from 'react'

import Modal from '/components/generic/modal/Modal'

const CompleteRegistrationNotice = function() {

    const [isVisible, setIsVisible] = useState(true)

    return (
        <Modal isVisible={isVisible} setIsVisible={setIsVisible} noClose={true}>
            <p>You haven't completed your registration yet.  Please return to
            the link from the invite in your email and complete your
                registration.  You won't be able to use the site until you do
            so.</p>
            <p>The token in your invitation is necessary to complete your registration.</p>
            <p>If you need help, don't hesitate to reach out to <a
            href="mailto:contact@communities.social">contact@communities.social</a>.</p>
        </Modal>
    )
}

export default CompleteRegistrationNotice


