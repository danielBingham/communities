import React, { useState, useEffect } from 'react'

import { LinkIcon, XMarkIcon } from '@heroicons/react/24/solid'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'

import { postLinkPreviews } from '/state/linkPreviews'

import ErrorModal from '/components/errors/ErrorModal'
import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'

import './LinkForm.css'

const LinkForm = function({ setShowLinkForm, setLinkPreviewId }) {
    const [url, setUrl] = useState('')

    const [request, makeRequest] = useRequest()

    const close = function() {
        setShowLinkForm(false)
        setUrl('')
    }

    const submit = function() {
        const link = {
            url: url
        }

        makeRequest(postLinkPreviews(link))
    }

    useEffect(function() {
        if ( request && request.state == 'fulfilled') {
            setLinkPreviewId(request.response.body.entity.id)
        }
    }, [ request])

    const inProgress = request && request.state == 'pending'
    const failed = request && request.state == 'failed'

    if ( failed ) {
        logger.error(new Error(`Failed to load LinkPreview for Url(${url}).`))
    }

    return (
        <div className="link-form">
            { failed && <ErrorModal>
                <p>Attempt to retrieve link preview failed.  We can't add that link as a post attachment, but you can add it to the post body.</p>
                <p>The bug has been recorded and we'll look into it.</p> 
            </ErrorModal> }
            <input 
                type="text" 
                name="link" 
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter the url you'd like to add..."
                value={url}
            />
            { inProgress && <div className="link-form__buttons"><Spinner /></div> }
            { ! inProgress && <>
                <Button onClick={(e) => close()}><XMarkIcon /> <span className="button-text">Cancel</span></Button>
                <Button type="primary" onClick={(e) => submit()}><LinkIcon /> <span className="button-text">Add Link</span></Button>
            </> }
        </div>
    )

}

export default LinkForm
