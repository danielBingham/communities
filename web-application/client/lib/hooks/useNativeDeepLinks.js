import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

export const useNativeDeepLinks = function() {

    const navigate = useNavigate()

    useEffect(() => {
        if ( Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android' ) {
            App.addListener('appUrlOpen', (event) => {
                const url = new URL(event.url)
                const path = url.pathname + url.hash + url.search
                navigate(path)
            })
        }

        return () => {
            if ( Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android' ) {
                App.removeAllListeners()
            }
        }
    }, [])

}
