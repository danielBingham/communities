
import InviteUsersForm from '/components/users/InviteUsersForm'
import GroupMembersControls from '/components/groups/GroupMembersControls'

const GroupEmailInviteView = function({ groupId }) {

    return (
        <div className="group-email-invite-view">
            <GroupMembersControls groupId={groupId} />
            <InviteUsersForm groupId={groupId} />
        </div>
    )
}

export default GroupEmailInviteView
