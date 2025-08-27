import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { Capacitor } from '@capacitor/core'
import { Device } from '@capacitor/device'

import { patchDevice } from '/state/authentication'

import { useRequest } from '/lib/hooks/useRequest'

export const useDevice = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const device = useSelector((state) => state.authentication.device)

    const [ request, makeRequest ] = useRequest()

    const recordDeviceInfo = async function() {
        let deviceInfo = {}
        if ( Capacitor.isPluginAvailable('Device') ) {
            const id = await Device.getId()
            const info = await Device.getInfo()


            deviceInfo = {
                ...id,
                ...info
            }
        } else {
            deviceInfo.platform = Capacitor.getPlatform()
        }

        makeRequest(patchDevice(deviceInfo))
    }

    useEffect(function() {
        if ( currentUser !== null && device === null ) {
            recordDeviceInfo().catch(function(error) {
                console.error(error)
            })
        }
    }, [ currentUser, device ])

    return [ device, request]
}
