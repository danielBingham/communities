import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getVersion } from '/state/system'

export const useVersion = function() {
    const config = useSelector((state) => state.system.configuration)
    const version = useSelector((state) => state.system.version)
    const location = useLocation()

    const [request, makeRequest ] = useRequest()

    useEffect(() => {
            makeRequest(getVersion())
    }, [ location ])

    useEffect(() => {
        const loadedVersion = config.version 
        console.log(`Version: ${version}, loadedVersion: ${loadedVersion}`)
        if ( loadedVersion !== version ) {
            window.location.reload(true)
        }
    }, [ version ])

    return [version, request]
}
