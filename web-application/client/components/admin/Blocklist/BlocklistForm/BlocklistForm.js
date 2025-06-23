import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import * as shared from '@communities/shared'

import { useRequest } from '/lib/hooks/useRequest'

import { postBlocklists } from '/state/Blocklist'

import Button from '/components/generic/button/Button'
import Input from '/components/generic/input/Input'
import TextBox from '/components/generic/text-box/TextBox'
import ErrorModal from '/components/errors/ErrorModal'
import Spinner from '/components/Spinner'

const BlocklistForm = function({ onComplete, onCancel }) {
    const [domain, setDomain] = useState('')
    const [domainError, setDomainError] = useState(null)

    const [notes, setNotes] = useState('')
    const [notesError, setNotesError] = useState(null)

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const validate = function(field) {
        const errors = []

        if ( ! field || field === 'domain' ) {
            const domainValidationErrors = shared.validation.Blocklist.validateDomain(domain)
            if ( domainValidationErrors.length > 0) {
                setDomainError(domainValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
                errors.push(...domainValidationErrors)
            } else {
                setDomainError(null)
            }
        }

        if ( ! field || field === 'notes' ) {
            const notesValidationErrors = shared.validation.Blocklist.validateNotes(notes)
            if ( notesValidationErrors.length > 0 ) {
                setNotesError(notesValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
                errors.push(...notesValidationErrors)
            } else {
                setNotesError(null)
            }
        }

        return errors.length <= 0
    }
    
    const cancel = function() {
        setDomain('')
        setDomainError(null)
        setNotes('')
        setNotesError(null)

        if ( onCancel && typeof onCancel === 'function' ) {
            onCancel()
        }
    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! validate() ) {
            return
        }

        const blocklist = {
            userId: currentUser.id,
            domain: domain,
            notes: notes
        }

        makeRequest(postBlocklists(blocklist))
    }

    const onKeyDown = function(event) {
        if ( event.key === 'Enter' ) {
            onSubmit(event)
        }
    }

    useEffect(() => {
        if ( request && request.state === 'fulfilled' ) {
            if ( onComplete && typeof onComplete === 'function' ) {
                onComplete()
            }
        }
    }, [ request ])

    let baseErrors = null
    if ( request && request.state === 'failed' ) {
        if ( request.status === 500 ) {
            baseErrors = (
                <ErrorModal>
                    <p>Errors encountered while creating Blocklist.</p>
                    <p>Type: { request.error.type }</p>
                    <p>Message: { request.error.message} </p>
                    <p>This is probably a bug.  Please report it.</p>
                </ErrorModal>
            )
        } else {
            baseErrors = (
                <ErrorModal>
                    <p>Failed to add { domain } to the Blocklist.</p>
                    <p>{ request.error.message }</p>
                </ErrorModal>
            )
        }
    }

    const inProgress = request && request.state === 'pending'
    return (
        <form className="blocklist-form" onSubmit={onSubmit}>
            <Input
                name="domain"
                label="Domain"
                explanation="Domain you want to ban signups from."
                value={domain}
                className="domain"
                onKeyDown={onKeyDown}
                onBlur={ (event) => validate('domain') }
                onChange={ (event) => setDomain(event.target.value.toLowerCase()) } 
                error={domainError}
            />
            <TextBox
                name="notes"
                className="notes"
                label="Notes"
                explanation={`Any notes about this addition to the blocklist.`}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                error={notesError}
            />
            { inProgress && <Spinner /> }
            { ! inProgress && <div className="blocklist-form__controls">
                <Button onClick={(e) => cancel()}>Cancel</Button> 
                <input type="submit" name="submit" value="Submit" />
            </div> }
            { baseErrors }
        </form>
    )
}

export default BlocklistForm
