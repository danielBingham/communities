import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getLinkPreview } from '/state/LinkPreview'

export const useLinkPreview = function(linkPreviewId) {
    const linkPreview = useSelector((state) => {
        if ( ! linkPreviewId ) {
            return null 
        }

        if ( ! (linkPreviewId in state.LinkPreview.dictionary ) ) {
            return undefined
        }

        return state.LinkPreview.dictionary[linkPreviewId] 
    })

    const [request, makeRequest ] = useRequest()

    useEffect(() => {
        if ( linkPreviewId  && linkPreview === undefined && request?.state !== 'pending') {
            makeRequest(getLinkPreview(linkPreviewId))
        }
    }, [ linkPreviewId, linkPreview, request ])

    return [linkPreview, request]
}
