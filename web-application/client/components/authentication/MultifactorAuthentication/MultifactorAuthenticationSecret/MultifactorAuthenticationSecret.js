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
import { useState, useEffect, useId } from 'react'
import { useSelector } from 'react-redux'

import QRCode from 'qrcode'
import { generateURI } from 'otplib'

import { Clipboard } from '@capacitor/clipboard'

import { DocumentDuplicateIcon } from '@heroicons/react/24/solid'

import logger from '/logger'

import Input from '/components/ui/Input'
import Spinner from '/components/Spinner'
import Alert from '/components/ui/Alert'

import './MultifactorAuthenticationSecret.css'

const CopyState = {
    Success: 'success',
    Error: 'error'
}

const MultifactorAuthenticationSecret = function() {

    const qrDescriptionId = useId()
    const secretDescriptionId = useId() 

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const secret = useSelector((state) => state.authentication.multifactorSecret)

    const [ dataUrl, setDataUrl ] = useState(null) 
    const [ copyState, setCopyState ] = useState(null)

    const generateQRCode = async function() {
        const uri = generateURI({
            issuer: "Communities",
            label: currentUser.email,
            secret: secret
        })

        // `qrcode` has an undocumented promise api.  If you don't provide a
        // callback function in the manner documented, it will return a promise
        // instead of relying on the callback.
        //
        // @see https://github.com/soldair/node-qrcode/blob/master/lib/server.js:67
        try { 
            const qrDataUrl = await QRCode.toDataURL(uri)
            setDataUrl(qrDataUrl)
        } catch (error) {
            logger.error(`Failed to generate Multifactor Secret QR Code: `, error)
        }
    }

    const copySecret = async function(event) {
        try { 
            await Clipboard.write({
                string: secret 
            })

            setCopyState(CopyState.Success)
        } catch (error) {
            logger.error(`Failed to write link to clipboard: `, error)
            setCopyState(CopyState.Error)
        }
    }

    useEffect(() => {
        if ( secret !== null ) {
            generateQRCode()
        }
    }, [ secret ])

    return (
        <div aria-label="Multifactor Authentication Secret QR Code" aria-describedby={`${qrDescriptionId} ${secretDescriptionId}`} className="multifactor-authentication-secret">
            { copyState === CopyState.Success ? <Alert type="success" timeout={2000} onClear={() => setCopyState(null)}>Secret copied.</Alert> : null }
            { copyState === CopyState.Error ? <Alert type="error" timeout={2000} onClear={() => setCopyState(null)}>Failed to copy secret.</Alert> : null }

            { dataUrl !== null && <img alt="A QR Code providing the authenticator app with your multifactor authentication secret." src={dataUrl} /> }
            { dataUrl === null && <div aria-label="Loading QR Code..." className="multifactor-authentication-secret__loading"><Spinner /></div> }
            <p id={qrDescriptionId} className="multifactor-authentication-secret__description">Follow this QR Code from your authenticator app to setup your app with your Communities authentication.</p>
            <div className="multifactor-authentication-secret__secret">
                <Input name="secret" value={secret ?? ''}>
                    <button type="button" aria-label="Copy Secret" title="Copy Secret" className="multifactor-authentication-secret__copy-secret" onClick={copySecret}><DocumentDuplicateIcon /></button>
                </Input>
                <p id={secretDescriptionId}>If you're having touble with the QR Code, you can copy the secret above and manually enter it into your authenticator app.</p>
            </div>
        </div>
    )
} 

export default MultifactorAuthenticationSecret
