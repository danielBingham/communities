import React from 'react'
import { createPortal } from 'react-dom'

import Button from '/components/generic/button/Button'

import './BlockConfirmation.css'

const BlockConfirmation = function({ isVisible, cancel, execute  }) {

    return isVisible ? createPortal(
            <div className="modal-wrapper">
                <div className="modal-overlay" onClick={(e) => cancel()}></div>
                <div className="block-confirmation">
                    <div className="content">
                        <h1>Are you sure you want to block?</h1>
                        <p>Block is intended to act as community moderation, and
                        should only be used on posts deserving of censorship.</p>
                        <p>Posts appropriate for blocking are:</p>
                        <ul>
                            <li>Misinformation / Disinformation / Blatant propaganda</li>
                            <li>Spam / AI Slop</li>
                            <li>Abuse (Psychological, Emotional, or Threats of Physical)</li>
                            <li>Hate</li>
                            <li>Fascism / Nazism</li>
                        </ul>
                        <p>If this post doesn't fit into one of the above
                            categories, then it is not appropriate to block it.
                            Please use "dislike" instead to express your
                            displeasure, or ignore the post entirely.</p>
                        <p><em>Blocks are not currently anonymous.  We're seeking feedback on this point.</em></p>
                    </div>
                    <div className="buttons">
                        <Button type="secondary" onClick={(e) => cancel() }>Cancel</Button> 
                        <Button type="primary-warn" onClick={execute}>Yes</Button>
                    </div>
                </div>
            </div>,
            document.body
        ) : null 
}

export default BlockConfirmation
