import { useState, useEffect } from 'react'


const getLocalStorage = function(key, defaultValue) {
    const text = localStorage.getItem(key)
    const value = JSON.parse(text)
    return value || defaultValue
}

export const useLocalStorage = function(key, defaultValue) {
    const [ internalValue, setInternalValue] = useState(() => getLocalStorage(key, defaultValue))

    const setValue = (value) => {
        if ( value === null ) {
            setInternalValue(value)
            localStorage.removeItem(key)
        } else {
            setInternalValue(value)
            localStorage.setItem(key, JSON.stringify(value))
        }
    }

    return [internalValue, setValue]
}
