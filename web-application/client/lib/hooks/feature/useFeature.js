import { useSelector } from 'react-redux'

export const useFeature = function(name) {
    const feature = useSelector((state) => name in state.system.features ? state.system.features[name] : null)

    return feature !== null && feature.status === 'enabled'
}
