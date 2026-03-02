import { Outlet } from 'react-router-dom'

import { useNativeDeepLinks } from '/lib/hooks/useNativeDeepLinks'
import { useAppState } from '/lib/hooks/useAppState'
import { useVersion } from '/lib/hooks/useVersion'
import { useScrollRestoration } from '/lib/hooks/useScrollRestoration'

import "./RootLayout.css"

const RootLayout = function() {
    
    useNativeDeepLinks()
    useAppState()
    useVersion()
    useScrollRestoration()

    return (
        <div id="root-layout" className="root-layout dark">
            <Outlet />
        </div>
    )
}

export default RootLayout 
