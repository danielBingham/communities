import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

import { useRequest } from '/lib/hooks/useRequest'

import { getVersion } from '/state/system'

export const useVersion = function() {
    const config = useSelector((state) => state.system.configuration)
    const version = useSelector((state) => state.system.version)
    const location = useLocation()

    const [request, makeRequest ] = useRequest()

    const updateMobile = async function() {
        console.log(`Getting bundle: ${config.host + '/dist/dist.zip'}.`)
        const bundle = await CapacitorUpdater.download({
            version: version,
            url: config.host + '/dist/dist.zip'
        })
        console.log(`Got bundle: `, JSON.stringify(bundle))
        await CapacitorUpdater.set(bundle)
    }

    useEffect(() => {
        if ( config !== null ) {
                makeRequest(getVersion())
        }
    }, [ config, location ])

    useEffect(() => {
        if ( config !== null ) {
            const loadedVersion = config.version 
            if ( loadedVersion !== version ) {
                if ( Capacitor.getPlatform() === 'web' ) {
                    window.location.reload(true)
                } else if ( Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android' ) {
                    updateMobile()
                }
            }
        }
    }, [ version, config ])

    return [version, request]
}
