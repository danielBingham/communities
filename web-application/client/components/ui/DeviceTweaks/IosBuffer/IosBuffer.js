import React from 'react'

import { Capacitor } from '@capacitor/core'

import './IosBuffer.css'

const IosBuffer = function({}) {

    if ( Capacitor.getPlatform() === 'ios' ) {
        return (
            <div className="ios-buffer"></div>
        )
    }

    return null

}

export default IosBuffer
