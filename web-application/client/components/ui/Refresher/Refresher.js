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

import { useRef, useEffect, useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

import { Capacitor } from '@capacitor/core'

import './Refresher.css'

const MAX = 360 
const THRESHOLD = 180 
const k = 1 
const tension = function(x) {
  return MAX * (1 - Math.exp((-k * x) / MAX));
}

// Inspiration from: https://www.strictmode.io/articles/react-pull-to-refresh
const Refresher = function({ onRefresh }) {

    const ref = useRef(null)
   
    useEffect(function() {
        if ( Capacitor.getPlatform() !== 'ios' && Capacitor.getPlatform() !== 'android' ) {
            return
        }

        const handleStart = function(event) {
            if ( ! ref.current ) {
                return
            }

            if ( window.scrollY > 0 ) {
                return
            }

            if ( event.touches.length <= 0 ) {
                return
            }

            ref.current.style.display = 'block'

            const initialY = event.touches[0].screenY
            let shouldRefresh = false

            const handleMove = function(event) {
                if ( ! ref.current ) {
                    return
                }

                if ( event.touches.length <= 0 ) {
                    return
                }

                const currentY = event.touches[0].screenY
                const dY = currentY - initialY 
                const translation = tension(dY)
                const rotation = dY

                if ( dY > THRESHOLD ) {
                    shouldRefresh = true
                } else if ( dY <= THRESHOLD ) {
                    shouldRefresh = false
                }

                ref.current.style.transform = `translateX(-50%) translateY(${translation}px) rotate(${rotation}deg)`
            }

            const handleEnd = function(event) {
                if ( ! ref.current ) {
                    return
                }

                ref.current.style.transform = `translateX(-50%)`

                document.body.removeEventListener('touchmove', handleMove)
                document.body.removeEventListener('touchend', handleEnd)
                document.body.removeEventListener('touchcancel', handleCancel)

                if ( shouldRefresh && onRefresh) {
                    onRefresh()
                }
            }
            const handleCancel = function(event) {
                if ( ! ref.current ) {
                    return
                }

                ref.current.style.transform = `translateX(-50%)`
                document.body.removeEventListener('touchmove', handleMove)
                document.body.removeEventListener('touchend', handleEnd)
                document.body.removeEventListener('touchcancel', handleCancel)
            }

            document.body.addEventListener('touchmove', handleMove)
            document.body.addEventListener('touchend', handleEnd)
            document.body.addEventListener('touchcancel', handleCancel)
        }

        document.body.addEventListener('touchstart', handleStart)

        return () => {
            if ( Capacitor.getPlatform() !== 'android' && Capacitor.getPlatform !== 'ios' ) {
                return
            }

            document.body.removeEventListener('touchstart', handleStart)
        }
    }, [])

    if ( Capacitor.getPlatform() !== 'ios' && Capacitor.getPlatform() !== 'android' ) {
        return null
    }

    return (
        <div ref={ref} className='refresher'>
            <ArrowPathIcon />
        </div>
    )
}

export default Refresher
