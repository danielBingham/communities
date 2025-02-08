import { useState, useEffect } from 'react'


const getLocalStorage = function(key, defaultValue) {
    const text = localStorage.getItem(key)
    const value = JSON.parse(text)
    return value || defaultValue
}

export const useLocalStorage = function(key, defaultValue) {
    const [ value, setValue ] = useState(() => getLocalStorage(key, defaultValue))


    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value))
    }, [key, value])

    return [value, setValue]
}
