
import './DropdownMenuHeader.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const DropdownMenuHeader = function({ className, children }) {

    // ======= Render ===============================================

    return (
        <div className={`dropdown-menu__header ${className ? className : ''}`}>
            { children }
        </div>
    )

}
