import { Capacitor } from '@capacitor/core'

import FetchImage from './FetchImage/FetchImage'
import HtmlImage from './HtmlImage/HtmlImage'

import './Image.css'

const Image = function({ id, src, width, ref, onLoad }) {

    if ( id ) {
        return ( <FetchImage id={id}  width={width} ref={ref} onLoad={onLoad} /> )
    } else if ( src ) {
        return ( <HtmlImage src={src} width={width} ref={ref} onLoad={onLoad} /> )
    }

    /*if ( Capacitor.getPlatform() === 'web' || Capacitor.getPlatform() === 'android' ) {
    } else if ( Capacitor.getPlatform() === 'ios' ) {
        return ( <FetchImage id={id} src={src} width={width} ref={ref} onLoad={onLoad} /> )
    } else {
        logger.error(`Unhandled Platform(${Capacitor.getPlatform()}) in Image.`) 
        return null
    }*/
}

export default Image 
