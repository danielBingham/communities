import React from 'react'

import { Capacitor } from '@capacitor/core'

import './AndroidBuffer.css'

const AndroidBuffer = function({}) {

    if ( Capacitor.getPlatform() === 'android' ) {
        return (
            <div className="android-buffer"></div>
        )
    }

    return null

}

export default AndroidBuffer
