## [Update GroupMember](documentation/testing/test-cases/GroupMember/update.md)

Cases covering GroupMember updates: accepting invitations, approving and
rejecting requests, banning and un-banning, and changing roles.

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, and a Private Group, Private Group, have
      been created.
- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.
- [ ] User7 has been created and is a non-member of all groups.
- [ ] User8 has been created and has a pending invitation to Public Group.
- [ ] Public Group contains posts.

#### Cases

- [ ] As a group moderator, I can accept a membership request.
    - As User7:
        - Request membership of Private Group.
    - As User2:
        - Open Private Group -> Members -> Requests and accept User7's request.
            - **Confirm User7 becomes a confirmed member.**
    - As User7:
        - Visit Private Group.
            - **Confirm the group's posts are now visible.**

- [ ] As a group moderator, I can ban a member.
    - As User2:
        - Open Public Group -> Members and ban User3.
            - **Confirm User3's status changes to banned.**
    - As User3:
        - Visit Public Group.
            - **Confirm the group is no longer visible.**

- [ ] As a group admin, I can promote a member.
    - As User1:
        - Open Public Group -> Members and promote a member to 'moderator'.
            - **Confirm the role changes to moderator.**
        - Promote a member to 'admin'.
            - **Confirm the role changes to admin.**

- [ ] As an invited user, I can accept my invitation.
    - As User8:
        - Open the invitation to Public Group and accept it.
            - **Confirm you become a confirmed member.**

### Manual Regression

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created with User1 as an admin,
      User2 as a moderator and at least one plain member.

#### Cases

- [ ] As a group moderator, the members interface only offers actions I am allowed to take.
    - As User2, a group moderator:
        - Open Public Group -> Members and open the actions menu for a plain member.
            - **Confirm "Ban" and "Remove" are offered.**
            - **Confirm "Promote to Admin" is *not* offered.**
        - Open the actions menu for an admin.
            - **Confirm no destructive actions are offered.**

- [ ] As a group admin, banning a member is confirmed before it takes effect.
    - As User1:
        - Ban a member from Public Group.
            - **Confirm a confirmation prompt is shown.**
        - Cancel the prompt.
            - **Confirm the member is not banned.**

### Full Regression

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group
        - [ ] A Hidden Group named Public - Hidden Group
- [ ] A Private Group, Private Group, has been created.
    - [ ] The following subgroups of Private Group have been created:
        - [ ] An Open Group named Private - Open Group
        - [ ] A Private Group named Private - Private Group
        - [ ] A Hidden Group named Private - Hidden Group
- [ ] A Hidden Group, Hidden Group, has been created.
    - [ ] The following subgroups of Hidden Group have been created:
        - [ ] An Open Group named Hidden - Open Group
        - [ ] A Private Group named Hidden - Private Group
        - [ ] A Hidden Group named Hidden - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and added as an admin only of the top level groups.
- [ ] User5 has been created an added as a moderator only of the top level groups.
- [ ] User6 has been created and added as a member only of the top level groups.

- [ ] User7 has been created and is a non-member of all groups.
- [ ] User8 has been created, has a pending invitation to each group, and has not accepted.
- [ ] User9 has been created and has been banned from each group.
- [ ] A site moderator has been created.

#### Structural checks

- [ ] As an unauthenticated visitor, I cannot update a group member. (covered: integration)
    - As unauthenticated user:
        - Attempt to update a member of Public Group.
            - **Confirm the request is refused.**

- [ ] As a user, a body that doesn't match the route is rejected. (covered: integration)
    - As User2:
        - Submit an update whose body groupId does not match the route.
            - **Confirm the request is refused.**
        - Submit an update with no groupId.
            - **Confirm the request is refused.**
        - Submit an update whose body userId does not match the route.
            - **Confirm the request is refused.**
        - Submit an update with no userId.
            - **Confirm the request is refused.**
        - Submit an update with a malformed (non-UUID) userId.
            - **Confirm the request is refused.**

- [ ] As a user, updating a member that doesn't exist is not found. (covered: integration)
    - As User2:
        - Attempt to update a member of a group that doesn't exist.
            - **Confirm a not found result.**
        - Attempt to update a member that doesn't exist in an existing group.
            - **Confirm a not found result.**
        - Attempt to update a real user who is not a member of the group.
            - **Confirm a not found result.**

#### Permissions on Open groups

- [ ] A Group Moderator **can** update a 'member' row. (covered: integration)
- [ ] A Group Admin **can** update a 'moderator' row. (covered: integration)
- [ ] A user **can** update their own row. (covered: integration)
- [ ] A site moderator **can** update a 'member' row. (covered: integration)
- [ ] A Group Moderator **cannot** update another moderator's row. (covered: integration)
- [ ] A Group Moderator **cannot** update an admin's row. (covered: integration)
- [ ] A Group Admin **cannot** update another admin's row. (covered: integration)
- [ ] A site moderator **cannot** update an admin's row. (covered: integration)
- [ ] A plain Member **cannot** update another member's row. (covered: integration)
- [ ] A non-member **cannot** update a member's row. (covered: integration)
- [ ] A banned member **cannot** update anyone's row, and is told the group is not found. (covered: integration)
- [ ] A banned member **cannot** update their own row, and is told the group is not found. (covered: integration)

#### Permissions on Private groups

- [ ] A Group Moderator **can** update a 'member' row. (covered: integration)
- [ ] A non-member **cannot** update a member's row, and is told it is forbidden rather than not found. (covered: integration)

#### Permissions on Hidden groups

- [ ] A Group Moderator **can** update a 'member' row. (covered: integration)
- [ ] A non-member **cannot** update a member's row, and is told it is not found rather than forbidden. (covered: integration)

#### Permissions on Subgroups

- [ ] A Parent Group Admin **can** update a child 'member' row. (covered: integration)
- [ ] A Parent Group Moderator **cannot** update a child 'member' row. (covered: integration)
- [ ] A Parent Group Member **cannot** update a child 'member' row. (covered: integration)

#### Immutable and server-only fields

- [ ] As a user, disallowed fields and out-of-enum values are rejected. (covered: integration)
    - As User2:
        - Submit an update carrying a 'createdDate' field.
            - **Confirm the request is refused.**
        - Submit an update carrying an 'updatedDate' field.
            - **Confirm the request is refused.**
        - Submit an update carrying an 'entranceAnswers' field.
            - **Confirm the request is refused.**
        - Submit an update with a null status.
            - **Confirm the request is refused.**
        - Submit an update with a null role.
            - **Confirm the request is refused.**
        - Submit an update with an out-of-enum status.
            - **Confirm the request is refused.**
        - Submit an update with an out-of-enum role.
            - **Confirm the request is refused.**
        - Submit an update carrying neither status nor role.
            - **Confirm the update is accepted as a no-op.**
        - Submit an update carrying a client-supplied 'id'.
            - **Confirm the id is ignored rather than erroring.**

#### Status transitions from 'pending-invited'

- [ ] The invited user **can** accept by setting status to 'member'. (covered: integration)
- [ ] The invited user **cannot** set their status to 'banned'. (covered: integration)
- [ ] The invited user **cannot** set their status to 'pending-requested'. (covered: integration)
- [ ] A Group Moderator **cannot** accept on the invitee's behalf. (covered: integration)
- [ ] A Group Moderator **cannot** ban a pending invitee. (covered: integration)
- [ ] A Group Moderator **can** resubmit a no-op status of 'pending-invited'. (covered: integration)

#### Status transitions from 'pending-requested'

- [ ] A Group Moderator **can** accept a request by setting status to 'member'. (covered: integration)
- [ ] A Group Moderator **can** reject a request by setting status to 'banned'. (covered: integration)
- [ ] A Group Moderator **cannot** set a requester to 'pending-invited'. (covered: integration)
- [ ] The requester **cannot** approve their own request. (covered: integration)
- [ ] The requester **can** resubmit a no-op status of 'pending-requested'. (covered: integration)

#### Status transitions from 'member'

- [ ] A Group Moderator **can** ban a confirmed member. (covered: integration)
- [ ] A Group Moderator **cannot** ban a member whose role is 'moderator'. (covered: integration)
- [ ] A Group Moderator **cannot** move a confirmed member to 'pending-invited'. (covered: integration)
- [ ] A confirmed member **cannot** ban themselves. (covered: integration)
- [ ] A member **can** resubmit a no-op status of 'member'. (covered: integration)

#### Status transitions from 'banned'

- [ ] A Group Moderator **can** un-ban a member by setting status to 'member'. (covered: integration)
- [ ] A Group Moderator **cannot** move a banned member to 'pending-invited'. (covered: integration)
- [ ] A Group Moderator **can** resubmit a no-op status of 'banned'. (covered: integration)

#### Role transitions

- [ ] A Group Admin **can** promote a member to 'moderator'. (covered: integration)
- [ ] A Group Admin **can** promote a member to 'admin'. (covered: integration)
- [ ] A Group Moderator **cannot** promote a member to 'moderator'. (covered: integration)
- [ ] A Group Admin **can** demote a moderator to 'member'. (covered: integration)
- [ ] A moderator **can** demote themselves to 'member'. (covered: integration)
- [ ] A moderator **cannot** promote themselves to 'admin'. (covered: integration)
- [ ] An admin **cannot** change their own role. (covered: integration)
- [ ] An admin **can** resubmit a no-op role of 'admin'. (covered: integration)
- [ ] A member **can** resubmit a no-op role of 'member'. (covered: integration)

#### Partial updates and combined changes

- [ ] As a group admin, partial updates leave the other field untouched. (covered: integration)
    - As User1:
        - Submit an update carrying only a role.
            - **Confirm status is left untouched.**
        - Submit an update carrying only a status.
            - **Confirm role is left untouched.**
        - Submit an update carrying both a status and a role that are each allowed.
            - **Confirm both changes are applied.**
        - Submit a role change for a banned member with no status.
            - **Confirm the role change is applied.**
