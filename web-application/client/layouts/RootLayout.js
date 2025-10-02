import { Outlet } from 'react-router-dom'

import { useNativeDeepLinks } from '/lib/hooks/useNativeDeepLinks'
import { useAppState } from '/lib/hooks/useAppState'
import { useVersion } from '/lib/hooks/useVersion'

const RootLayout = function() {
    
    useNativeDeepLinks()
    useAppState()
    useVersion()

    return (
        <div className="root-layout">
            <Outlet />
        </div>
    )
}

export default RootLayout 
