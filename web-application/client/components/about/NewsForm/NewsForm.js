/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media
 *  Copyright (C) 2022 - 2024 Daniel Bingham
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import * as shared from '@communities/shared'

import { useLocalStorage } from '/lib/hooks/useLocalStorage'
import { useRequest } from '/lib/hooks/useRequest'

import { postNews } from '/state/News'

import AreYouSure from '/components/AreYouSure'
import Button from '/components/ui/Button'
import Input from '/components/ui/Input'
import { TextBox } from '/components/ui/TextBox'
import Spinner from '/components/Spinner'
import { RequestErrorModal } from '/components/errors/RequestError'

import './NewsForm.css'

const schema = new shared.schema.NewsSchema()

/**
 * Today's date, written 'MM/DD/YYYY'.
 */
const getToday = function() {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${month}/${day}/${now.getFullYear()}`
}

const describeErrors = function(errors) {
    return errors.length > 0 ? errors.map((error) => error.message).join(' ') : null
}

/**
 * Write a new post for the News page.  Site admins only: the backend refuses
 * everyone else.
 *
 * The slug, which is the post's URL, is generated from the date and title,
 * and the author is the current user.  The draft is kept in local storage
 * until it's posted or discarded.
 *
 * @param {function} onComplete     (Optional) Called with the new post once
 * it has been created.
 * @param {function} onCancel   (Optional) Called when the draft is discarded.
 */
const NewsForm = function({ onComplete, onCancel }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [ title, setTitle ] = useLocalStorage('news.draft.title', '')
    const [ date, setDate ] = useLocalStorage('news.draft.date', getToday())
    const [ content, setContent ] = useLocalStorage('news.draft.content', '')

    const [ titleErrors, setTitleErrors ] = useState(null)
    const [ dateErrors, setDateErrors ] = useState(null)
    const [ contentErrors, setContentErrors ] = useState(null)
    const [ slugErrors, setSlugErrors ] = useState(null)

    const [ areYouSure, setAreYouSure ] = useState(false)

    const [ request, makeRequest ] = useRequest()

    const slug = shared.lib.news.generateNewsSlug(date, title)

    /**
     * Check the form's fields, showing any errors.
     *
     * @param {string} field    (Optional) Only check this field.  Checks them
     * all when it isn't given.
     * @param {object} values   (Optional) The values to check, for when one
     * has just changed.  Defaults to the form's current values.
     *
     * @return {boolean} Whether the checked fields are valid.
     */
    const validate = function(field, values) {
        const current = { title: title, date: date, content: content, ...values }

        let titleValidationErrors = []
        if ( ! field || field === 'title' ) {
            titleValidationErrors = schema.properties.title.validate(current.title, undefined, 'create')
            setTitleErrors(describeErrors(titleValidationErrors))
        }

        let dateValidationErrors = []
        if ( ! field || field === 'date' ) {
            dateValidationErrors = schema.properties.date.validate(current.date, undefined, 'create')
            setDateErrors(describeErrors(dateValidationErrors))
        }

        let contentValidationErrors = []
        if ( ! field || field === 'content' ) {
            contentValidationErrors = schema.properties.content.validate(current.content, undefined, 'create')
            setContentErrors(describeErrors(contentValidationErrors))
        }

        // The slug is generated, so its errors are the title's or date's
        // fault.  Only check it once those are fine.
        let slugValidationErrors = []
        if ( ! field && titleValidationErrors.length === 0 && dateValidationErrors.length === 0 ) {
            const currentSlug = shared.lib.news.generateNewsSlug(current.date, current.title)
            slugValidationErrors = schema.properties.slug.validate(currentSlug, undefined, 'create')
            setSlugErrors(slugValidationErrors.length > 0
                ? `We couldn't make a URL from that title and date.  Add some letters or numbers to the title.`
                : null)
        } else if ( field === 'title' || field === 'date' ) {
            setSlugErrors(null)
        }

        return titleValidationErrors.length === 0
            && dateValidationErrors.length === 0
            && contentValidationErrors.length === 0
            && slugValidationErrors.length === 0
    }

    /**
     * Update a field.  When it's showing an error, check it again as it's
     * edited, so the error goes away as soon as it's fixed rather than when
     * the field loses focus (which would move the Post button out from under
     * a click).
     */
    const onChange = function(field, setValue, hasErrors) {
        return function(event) {
            setValue(event.target.value)

            if ( hasErrors ) {
                validate(field, { [field]: event.target.value })
            }
        }
    }

    const isDirty = function() {
        return title !== '' || date !== getToday() || content !== ''
    }

    const resetForm = function() {
        setTitle('')
        setDate(getToday())
        setContent('')

        setTitleErrors(null)
        setDateErrors(null)
        setContentErrors(null)
        setSlugErrors(null)

        setAreYouSure(false)
    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! validate() ) {
            return
        }

        makeRequest(postNews({
            title: title,
            slug: slug,
            date: date,
            author: currentUser.name,
            content: content
        }))
    }

    const cancel = function() {
        resetForm()

        if ( onCancel && typeof onCancel === 'function' ) {
            onCancel()
        }
    }

    const handleCancel = function() {
        if ( isDirty() ) {
            setAreYouSure(true)
        } else {
            cancel()
        }
    }

    useEffect(() => {
        if ( request?.state === 'fulfilled' ) {
            resetForm()

            if ( onComplete && typeof onComplete === 'function' ) {
                onComplete(request.response.body.entity)
            }
        }
    }, [ request ])

    let baseError = null
    if ( titleErrors !== null || dateErrors !== null || contentErrors !== null || slugErrors !== null ) {
        baseError = (<span>One or more fields has an invalid value.  Please fix the error and try again!</span>)
    }

    const inProgress = request?.state === 'pending'

    return (
        <div className="news-form">
            <form onSubmit={onSubmit}>
                <Input
                    name="title"
                    type="text"
                    label="Title"
                    value={title}
                    className="news-form__title"
                    maxLength={511}
                    onBlur={(event) => validate('title')}
                    onChange={onChange('title', setTitle, titleErrors !== null || slugErrors !== null)}
                    error={titleErrors}
                />
                <Input
                    name="date"
                    type="text"
                    label="Date"
                    explanation="The date of the post, written MM/DD/YYYY.  Posts are listed newest first."
                    placeholder="MM/DD/YYYY"
                    value={date}
                    className="news-form__date"
                    maxLength={10}
                    onBlur={(event) => validate('date')}
                    onChange={onChange('date', setDate, dateErrors !== null || slugErrors !== null)}
                    error={dateErrors}
                />
                <div className="news-form__url">
                    <span className="news-form__url__label">URL:</span> <span className="news-form__url__value">/about/news/{ slug }</span>
                    { slugErrors && <div className="news-form__url__error">{ slugErrors }</div> }
                </div>
                <TextBox
                    name="content"
                    className="news-form__content"
                    label="Content"
                    explanation="The body of the post, written in Markdown."
                    value={content}
                    onBlur={(event) => validate('content')}
                    onChange={onChange('content', setContent, contentErrors !== null)}
                    error={contentErrors}
                />
                <div className="news-form__author">Posting as { currentUser?.name }.</div>
                <div className="news-form__errors">{ baseError }</div>
                { inProgress && <Spinner /> }
                { ! inProgress && <div className="news-form__controls">
                    <Button onClick={(event) => handleCancel()}>Cancel</Button>
                    <input type="submit" name="submit" value="Post" />
                </div> }
            </form>
            <AreYouSure
                isVisible={areYouSure}
                cancelLabel="Keep Editing"
                executeLabel="Discard Post"
                execute={cancel}
                cancel={() => setAreYouSure(false)}
            >
                <p>Are you sure you want to discard your post?</p>
            </AreYouSure>
            <RequestErrorModal message="Attempt to post news" request={request} />
        </div>
    )
}

export default NewsForm
