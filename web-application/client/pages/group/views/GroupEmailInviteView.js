
import InviteUsersForm from '/components/users/InviteUsersForm'

const GroupEmailInviteView = function({ groupId }) {

    return (
        <div className="group-email-invite-view">
            <InviteUsersForm groupId={groupId} />
        </div>
    )
}

export default GroupEmailInviteView
