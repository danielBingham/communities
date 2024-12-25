import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { postLinkPreviews, cleanupRequest } from '/state/linkPreviews'

import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'

import './LinkForm.css'

const LinkForm = function({ setShowLinkForm, setLinkPreviewId }) {
    const [url, setUrl] = useState('')

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.linkPreviews.requests ) {
            return state.linkPreviews.requests[requestId]
        } else {
            return null
        }

    })

    const dispatch = useDispatch()

    const close = function() {
        setShowLinkForm(false)
        setUrl('')
    }

    const submit = function() {
        const link = {
            url: url
        }

        setRequestId(dispatch(postLinkPreviews(link)))
    }

    useEffect(function() {
        if ( request && request.state == 'fulfilled') {
            setLinkPreviewId(request.result.entity.id)
        }
    }, [ request])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    if ( request && request.state == 'pending' ) {
        return (
            <div className="link-form">
                <Spinner local={true} />
            </div>
        )
    }

    let errorView = null
    if ( request && request.state == 'failed' ) {
        errorView = (
            <div className="error">Attempt to retrieve link preview failed.  We can't add that link as a post attachment, but you can add it to the post body.</div>
        )
    }

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
            <Button type="secondary-warn" onClick={(e) => close()}>Cancel</Button>
            <Button type="primary" onClick={(e) => submit()}>Add Link</Button>
        </div>
    )

}

export default LinkForm
