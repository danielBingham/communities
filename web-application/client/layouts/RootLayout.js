import { Outlet } from 'react-router-dom'

import { useNativeDeepLinks } from '/lib/hooks/useNativeDeepLinks'

const RootLayout = function() {
    
    useNativeDeepLinks()

    return (
        <div className="root-layout">
            <Outlet />
        </div>
    )
}

export default RootLayout 
