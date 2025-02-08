import React, { useState, useEffect } from 'react'

import { useRequest } from '/lib/hooks/useRequest'

import { postLinkPreviews } from '/state/linkPreviews'

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

    let errorView = null
    if ( request && request.state == 'failed' ) {
        errorView = (
            <div className="error">Attempt to retrieve link preview failed.  We can't add that link as a post attachment, but you can add it to the post body.</div>
        )
    }

    const inProgress = request && request.state == 'pending'
    return (
        <div className="link-form">
            { errorView }
            <input 
                type="text" 
                name="link" 
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter the url you'd like to add..."
                value={url}
            />
            { inProgress && <div className="link-form__buttons"><Spinner /></div> }
            { ! inProgress && <div className="link-form__buttons">
                <Button type="secondary-warn" onClick={(e) => close()}>Cancel</Button>
                <Button type="primary" onClick={(e) => submit()}>Add Link</Button>
            </div> }
        </div>
    )

}

export default LinkForm
