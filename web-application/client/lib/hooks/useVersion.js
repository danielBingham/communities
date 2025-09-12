import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

import { useRequest } from '/lib/hooks/useRequest'

import { getVersion } from '/state/system'

export const useVersion = function() {
    const clientVersion = useSelector((state) => state.system.clientVersion)
    const serverVersion = useSelector((state) => state.system.serverVersion)

    const location = useLocation()

    const [request, makeRequest ] = useRequest()

    const updateMobile = async function() {
        const url = new URL('/dist/dist.zip', config.host).href
        const bundle = await CapacitorUpdater.download({
            version: version,
            url: url 
        })
        await CapacitorUpdater.set(bundle)
    }

    useEffect(() => {
        makeRequest(getVersion())
    }, [ location ])

    useEffect(() => {
        if ( clientVersion !== serverVersion) {
            if ( Capacitor.getPlatform() === 'web' ) {
                window.location.reload(true)
            } else if ( Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android' ) {
                updateMobile()
            }
        }
    }, [ serverVersion, clientVersion ])

    return [clientVersion, request]
}
