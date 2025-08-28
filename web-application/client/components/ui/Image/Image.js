import { Capacitor } from '@capacitor/core'

import FetchImage from './FetchImage/FetchImage'
import HtmlImage from './HtmlImage/HtmlImage'

import './Image.css'

const Image = function({ id, src, width, ref, onLoad }) {

    if ( Capacitor.getPlatform() === 'web' || Capacitor.getPlatform() === 'android' ) {
        return ( <HtmlImage id={id} src={src} width={width} ref={ref} onLoad={onLoad} /> )
    } else if ( Capacitor.getPlatform() === 'ios' ) {
        return ( <FetchImage id={id} src={src} width={width} ref={ref} onLoad={onLoad} /> )
    } else {
        logger.error(`Unhandled Platform(${Capacitor.getPlatform()}) in Image.`) 
        return null
    }
}

export default Image 
