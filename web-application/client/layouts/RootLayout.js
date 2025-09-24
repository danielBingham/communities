import { Outlet } from 'react-router-dom'

import { useNativeDeepLinks } from '/lib/hooks/useNativeDeepLinks'
import { useAppState } from '/lib/hooks/useAppState'

const RootLayout = function() {
    
    useNativeDeepLinks()
    useAppState()


    return (
        <div className="root-layout">
            <Outlet />
        </div>
    )
}

export default RootLayout 
