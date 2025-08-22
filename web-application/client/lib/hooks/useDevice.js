import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { Device } from '@capacitor/device'

import { patchDevice } from '/state/authentication'

import { useRequest } from '/lib/hooks/useRequest'

export const useDevice = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const device = useSelector((state) => state.authentication.device)

    const [ request, makeRequest ] = useRequest()

    const recordDeviceInfo = async function() {
        const id = await Device.getId()
        const info = await Device.getInfo()

        const deviceInfo = {
            ...id,
            ...info
        }

        makeRequest(patchDevice(deviceInfo))
    }

    useEffect(function() {
        if ( currentUser !== null && device === null ) {
            recordDeviceInfo()
        }
    }, [ currentUser, device ])

    return [ device, request]
}
