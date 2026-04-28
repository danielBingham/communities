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
import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Device } from '@capacitor/device'

import logger from '/logger'

import { patchDevice } from '/state/authentication'
import { setAppVersion, setAppBuild } from '/state/system'

import { useRequest } from '/lib/hooks/useRequest'

export const useDevice = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const device = useSelector((state) => state.authentication.device)

    const [ request, makeRequest ] = useRequest()
    const dispatch = useDispatch()

    const recordDeviceInfo = async function() {
        try { 
            let deviceInfo = {}

            if ( Capacitor.isPluginAvailable('App') ) {
                const appInfo = await App.getInfo()
                deviceInfo = {
                    ...deviceInfo,
                    appBuild: appInfo.build,
                    appName: appInfo.name,
                    appVersion: appInfo.version,
                    appId: appInfo.id
                }

                dispatch(setAppVersion(appInfo.version))
                try { 
                    dispatch(setAppBuild(parseInt(appInfo.build, 10)))
                } catch (error) {
                    logger.error(`Failed to parse build number: `, error)
                }
            }


            if ( Capacitor.isPluginAvailable('Device') ) {
                const id = await Device.getId()
                const info = await Device.getInfo()

                deviceInfo = {
                    ...deviceInfo,
                    ...id,
                    ...info,
                }
            } else {
                deviceInfo.platform = Capacitor.getPlatform()
            }

            makeRequest(patchDevice(deviceInfo))
        } catch (error) {
            logger.error(error)
        }
    }

    useEffect(function() {
        if ( currentUser !== null && device === null ) {
            recordDeviceInfo().catch(function(error) {
                logger.error(error)
            })
        }
    }, [ currentUser, device ])

    return [ device, request]
}
