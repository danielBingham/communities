import NotificationSetting from '/components/notifications/NotificationSetting'

import './UserAccountNotificationsView.css'

const UserAccountNotificationsView = function() {

    return (
        <div className="user-notification-settings">
            <h2>Everything</h2>
            <div className="user-settings__notification-settings__section">
                <NotificationSetting 
                    label="All Notifications" 
                    explanation="When something would trigger a notification..." 
                    notifications={[ 
                        'GroupMember:create:status:pending-invited:member',
                        'GroupMember:create:status:pending-requested:moderator',
                        'GroupMember:update:status:pending-requested-member:member',
                        'GroupMember:update:role:moderator:member',
                        'GroupMember:update:role:admin:member',

                        'GroupModeration:update:post:status:rejected:author',
                        'GroupModeration:update:comment:status:rejected:author',

                        'Post:create:mention',

                        'PostComment:create:author',
                        'PostComment:create:subscriber',
                        'PostComment:create:mention',

                        'SiteModeration:update:post:status:rejected:author',
                        'SiteModeration:update:comment:status:rejected:author',

                        'UserRelationship:create:relation',
                        'UserRelationship:update:user'
                    ]} 
                />
            </div>
            <h2>Friends</h2>
            <div className="user-settings__notification-settings__section">
                <NotificationSetting 
                    label="Friend Requests" 
                    explanation="When someone sends you a friend request or accepts a friend request you sent..." 
                    notifications={[ 'UserRelationship:create:relation', 'UserRelationship:update:user' ]} 
                />
            </div>
            <h2>Posts</h2>
            <div className="user-settings__notification-settings__section">
                <NotificationSetting 
                    label="Mentions in Posts" 
                    explanation="When someone mentions you in a post..." 
                    notifications={[ 'Post:create:mention' ]} 
                />
            </div>
            <h2>Post Comments</h2>
            <div className="user-settings__notification-settings__section">
                <NotificationSetting 
                    label="Comments on Subscribed Posts" 
                    explanation="When someone comments on a post you subscribe to..." 
                    notifications={[ 'PostComment:create:subscriber', 'PostComment:create:author' ]} 
                />
                <NotificationSetting 
                    label="Mentions in Comments" 
                    explanation="When someone mentions you in a comment on a post..." 
                    notifications={[ 'PostComment:create:mention' ]} 
                />
            </div>
            <h2>Groups</h2>
            <div className="user-settings__notification-settings__section">
                <NotificationSetting 
                    label="Invitations to Groups" 
                    explanation="When someone invites you to join a group..." 
                    notifications={[ 'GroupMember:create:status:pending-invited:member' ]} 
                />
                <NotificationSetting 
                    label="Accepted Join Requests" 
                    explanation="When your request to join a group is accepted..." 
                    notifications={[ 'GroupMember:update:status:pending-requested-member:member' ]} 
                />
                <NotificationSetting 
                    label="Group Role Changes" 
                    explanation="When your role in a group changes..." 
                    notifications={[ 'GroupMember:update:role:moderator:member', 'GroupMember:update:role:admin:member' ]} 
                />
                <NotificationSetting 
                    label="Group Moderation" 
                    explanation="When one of your posts or comments is removed by a group admin..." 
                    notifications={[ 'GroupModeration:update:post:status:rejected:author', 'GroupModeration:update:comment:status:rejected:author' ]} 
                />
            </div>
            <h2>Moderation</h2>
            <div className="user-settings__notification-settings__section">
                <NotificationSetting 
                    label="Moderation" 
                    explanation="When one of your posts or comments is removed by a site admin..." 
                    notifications={[ 'SiteModeration:update:post:status:rejected:author', 'SiteModeration:update:comment:status:rejected:author' ]} 
                />
            </div>
        </div>
    )

}

export default UserAccountNotificationsView

