import { useUserQuery } from '/lib/hooks/User'

import UserBadge from '../UserBadge'
import FriendButton from '/components/friends/FriendButton'

import Spinner from '/components/Spinner'
import { 
    List, 
    ListHeader, 
    ListGridContent, 
    SearchControl
} from '/components/ui/List'
import PaginationControls from '/components/PaginationControls'
import Refresher from '/components/ui/Refresher'

import './UserListView.css'

const UserListView = function({ params }) {

    const [query, request, reset] = useUserQuery(params)

    // ======= Render ===============================================

    let content = ( <Spinner /> )
    let noContent = null

    if ( query !== null ) {
        const userBadges = []
        for( const userId of query.list) {
            userBadges.push(<UserBadge key={userId} id={userId}>
                <FriendButton userId={userId} />
            </UserBadge>)
        }
        content = userBadges
    } else if (request && request.state == 'fulfilled') {
        content = null
        noContent = (<span>No users found.</span>)
    } 

    let explanation = ''
    if ( ! query || parseInt(query.meta.count) === 0 ) {
        explanation = `0 People`
    } else {
        const pageStart = ( query.meta.page-1) * query.meta.pageSize + 1
        const pageEnd = query.meta.count - (query.meta.page-1) * query.meta.pageSize > query.meta.pageSize ? ( query.meta.page * query.meta.pageSize ) : query.meta.count 

        explanation = `${pageStart} to ${pageEnd} of ${query.meta.count} People`
    }


    return (
        <div className="user-list-view">
            <List className="user-list">
                <ListHeader explanation={explanation}>
                    <Refresher onRefresh={() => reset()} />
                    <SearchControl entity="People" />
                </ListHeader>
                <ListGridContent>
                    { content } 
                </ListGridContent>
                <PaginationControls meta={query?.meta} /> 
            </List>
        </div>
    )
        
}

export default UserListView
