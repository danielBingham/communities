## [Create GroupMember](documentation/testing/test-cases/GroupMember/create.md)

Cases covering GroupMember creation: joining a group, requesting membership,
and inviting others to join.

Accepting, rejecting and banning are status transitions and are covered in
[Update GroupMember](documentation/testing/test-cases/GroupMember/update.md).

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] A Private Group, Private Group, has been created.
- [ ] A Hidden Group, Hidden Group, has been created.

- [ ] Each group contains posts.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User7 has been created and is a non-member of all groups.
- [ ] User2 has a friend who is a non-member of all groups, available to invite.

#### Cases

- [ ] As a non-member, I can join a Public Group.
    - As User7:
        - Visit Public Group and click "Join".
            - **Confirm you become a confirmed member immediately.**
            - **Confirm the group's posts become visible.**

- [ ] As a non-member, I can request membership of a Private Group.
    - As User7:
        - Visit Private Group and click "Request Membership".
            - **Confirm the request is recorded as pending.**
            - **Confirm the group's posts remain *not* visible.**
    - As User2, a group moderator:
        - Open the group's pending requests.
            - **Confirm User7's request is listed.**

- [ ] As a group moderator, I can invite a friend to join.
    - As User2:
        - Visit Hidden Group -> Members -> Invite and invite a non-member friend.
            - **Confirm the invitation is recorded as pending.**
    - As the invited user:
        - **Confirm an invitation notification is received.**
        - Accept the invitation.
            - **Confirm you become a confirmed member.**

### Manual Regression

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

- [ ] User2 has been created and added as a moderator of each group and subgroup.
- [ ] User3 has been created and added as a member of each group.
- [ ] User7 has been created and is a non-member of all groups.
- [ ] User2 has friends who are non-members, available to invite.
- [ ] Email addresses that belong to no account are available to invite.
- [ ] An email client (mailinator) is available for the invited addresses.

Inviting a non-user by email cannot be automated by the Integration suite, so
all email invitation cases live here.

#### Email invitations

- [ ] As a group moderator, I can invite non-users to a Public Group by email.
    - As User2:
        - Visit Public Group -> Members -> Invite and enter an email address
          that belongs to no account.
            - **Confirm the invitation is recorded.**
            - **Confirm an invitation email arrives at that address.**
        - Follow the invitation link and register.
            - **Confirm the new user lands as a member of Public Group.**

- [ ] As a group moderator, I can invite non-users to a Private Group by email.
- [ ] As a group moderator, I can invite non-users to a Hidden Group by email.
- [ ] As a group moderator, I can invite non-users to a Public subgroup of a Public Group by email.
- [ ] As a group moderator, I can invite non-users to a Private subgroup of a Public Group by email.
- [ ] As a group moderator, I can invite non-users to a Hidden subgroup of a Public Group by email.
- [ ] As a group moderator, I can invite non-users to an Open subgroup of a Private Group by email.
- [ ] As a group moderator, I can invite non-users to a Private subgroup of a Private Group by email.
- [ ] As a group moderator, I can invite non-users to a Hidden subgroup of a Private Group by email.
- [ ] As a group moderator, I can invite non-users to an Open subgroup of a Hidden Group by email.
- [ ] As a group moderator, I can invite non-users to a Private subgroup of a Hidden Group by email.
- [ ] As a group moderator, I can invite non-users to a Hidden subgroup of a Hidden Group by email.

#### The join and invite interface

- [ ] As a non-member, the join control reflects the group type.
    - As User7:
        - Visit Public Group.
            - **Confirm the control reads "Join".**
        - Visit Private Group.
            - **Confirm the control reads "Request Membership".**
        - Visit a Public subgroup of Public Group.
            - **Confirm the control reads "Join".**

- [ ] As a group moderator, the invite control only suggests users I may invite.
    - As User2:
        - Visit Public Group -> Members -> Invite and begin typing a name.
            - **Confirm the suggestion list is limited to your friends.**
            - **Confirm existing members are not suggested.**

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

#### Basics

- [ ] As an unauthenticated visitor, I cannot add a group member. (covered: integration)
    - As unauthenticated user:
        - Attempt to join Public Group.
            - **Confirm the request is refused.**

- [ ] As a user, a malformed or missing group is rejected. (covered: integration)
    - As User7:
        - Submit a join whose body groupId does not match the route.
            - **Confirm the request is refused.**
        - Attempt to join a group that doesn't exist.
            - **Confirm a not found result.**

- [ ] As an existing member, joining again is refused as a conflict. (covered: integration)
    - As User3:
        - Attempt to join Public Group again.
            - **Confirm the request is refused as a conflict.**

#### Top level Groups

##### Public Groups

- [ ] A non-member **can** add themselves as a confirmed member. (covered: integration)
- [ ] A Group Moderator **can** invite a non-member. (covered: integration)
- [ ] A Group Admin **can** invite a non-member. (covered: integration)
- [ ] A plain Member **cannot** invite someone else. (covered: integration)
- [ ] A banned member **cannot** add anyone, and is told the group is not found. (covered: integration)
- [ ] A Group Moderator **can** accept or reject a non-member's membership request. (covered: integration)

##### Private Groups

- [ ] A non-member **can** request membership, and the request is recorded as pending-requested. (covered: integration)
- [ ] A Group Moderator **can** invite a non-member, and the invitation is recorded as pending-invited. (covered: integration)
- [ ] A plain Member **cannot** invite someone else. (covered: integration)
- [ ] A banned member **cannot** add anyone. (covered: integration)
- [ ] A Group Moderator **can** accept or reject a non-member's membership request. (covered: integration)

##### Hidden Groups

- [ ] A Group Moderator **can** invite a non-member, and the invitation is recorded as pending-invited. (covered: integration)
- [ ] A non-member **cannot** add themselves, and is told the group is not found because they cannot see it. (covered: integration)
- [ ] A plain Member **cannot** invite someone else. (covered: integration)
- [ ] A banned member **cannot** add anyone. (covered: integration)
- [ ] A Group Moderator **can** accept or reject a non-member's membership request. (covered: integration)

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

- [ ] A non-member **can** add themselves as a confirmed member. (covered: integration)
- [ ] A Parent Group Member **can** add themselves as a confirmed member. (covered: integration)
- [ ] A Parent Group Admin **can** add themselves as an admin. (covered: integration)
- [ ] A Group Moderator **can** invite a non-member (pending-invited). (covered: integration)
- [ ] A Parent Group Member **cannot** add someone else. (covered: integration)

##### Private Subgroups of Public Groups

- [ ] A non-member **can** request membership (pending-requested). (covered: integration)
- [ ] A Parent Group Member **can** request membership (pending-requested). (covered: integration)
- [ ] A Parent Group Admin **can** add themselves as an admin. (covered: integration)
- [ ] A Group Moderator **can** invite a non-member (pending-invited). (covered: integration)
- [ ] A Group Moderator **can** accept or reject a non-member's membership request. (covered: integration)

##### Hidden Subgroups of Public Groups

- [ ] A Parent Group Admin **can** add themselves as an admin. (covered: integration)
- [ ] A Group Moderator **can** invite a non-member (pending-invited). (covered: integration)
- [ ] A Parent Group Member **cannot** add themselves -- a plain hidden subgroup is invisible to parent members. (covered: integration)
- [ ] A non-member **cannot** add themselves. (covered: integration)

#### Subgroups of Private Groups

##### Open Subgroups of Private Groups (PRIVATE-OPEN)

- [ ] A Parent Group Member **can** add themselves as a confirmed member. (covered: integration)
- [ ] A non-parent non-member **can** request membership (pending-requested). (covered: integration)
- [ ] A Parent Group Admin **can** add themselves as an admin. (covered: integration)
- [ ] A Group Moderator **can** invite a non-member (pending-invited). (covered: integration)
- [ ] A Group Moderator **can** accept or reject a non-member's membership request. (covered: integration)

##### Private Subgroups of Private Groups

- [ ] A non-member **can** request membership (pending-requested). (covered: integration)
- [ ] A Parent Group Member **can** request membership (pending-requested). (covered: integration)
- [ ] A Parent Group Admin **can** add themselves as an admin. (covered: integration)
- [ ] A Group Moderator **can** invite a non-member (pending-invited). (covered: integration)
- [ ] A Group Moderator **can** accept or reject a non-member's membership request. (covered: integration)

##### Hidden Subgroups of Private Groups

- [ ] A Parent Group Admin **can** add themselves as an admin. (covered: integration)
- [ ] A Group Moderator **can** invite a non-member (pending-invited). (covered: integration)

#### Subgroups of Hidden Groups

##### Open Subgroups of Hidden Groups (HIDDEN-OPEN)

- [ ] A Parent Group Member **can** add themselves as a confirmed member. (covered: integration)
- [ ] A Parent Group Admin **can** add themselves as an admin. (covered: integration)
- [ ] A Group Moderator **can** invite a non-member (pending-invited). (covered: integration)
- [ ] A non-parent non-member **cannot** add themselves -- they cannot see a hidden-open subgroup. (covered: integration)

##### Private Subgroups of Hidden Groups (HIDDEN-PRIVATE)

- [ ] A Parent Group Member **can** request membership (pending-requested). (covered: integration)
- [ ] A Parent Group Admin **can** add themselves as an admin. (covered: integration)
- [ ] A Group Moderator **can** invite a non-member (pending-invited). (covered: integration)
- [ ] A Group Moderator **can** accept or reject a non-member's membership request. (covered: integration)

##### Hidden Subgroups of Hidden Groups

- [ ] A Parent Group Admin **can** add themselves as an admin. (covered: integration)
- [ ] A Group Moderator **can** invite a non-member (pending-invited). (covered: integration)
- [ ] A Group Moderator **can** accept or reject a non-member's membership request. (covered: integration)

#### Field presence and format

- [ ] As a user, disallowed and malformed fields are rejected. (covered: integration)
    - As User2, a group moderator:
        - Submit an invitation carrying a 'createdDate' field.
            - **Confirm the request is refused.**
        - Submit an invitation carrying an 'updatedDate' field.
            - **Confirm the request is refused.**
        - Submit an invitation carrying an 'entranceAnswers' field.
            - **Confirm the request is refused.**
        - Submit an invitation with no 'status'.
            - **Confirm the request is refused.**
        - Submit an invitation with no 'userId'.
            - **Confirm the request is refused.**
        - Submit an invitation with an out-of-enum 'status' value.
            - **Confirm the request is refused.**
        - Submit an invitation with an out-of-enum 'role' value.
            - **Confirm the request is refused.**
        - Submit an invitation with a well-formed but non-existent userId.
            - **Confirm the request is refused as userId not found.**
        - Submit an invitation with a malformed (non-UUID) userId.
            - **Confirm the request is refused as userId invalid.**

#### Status and role rules by group type

- [ ] As a user, self-joins and invitations must carry the right status and role. (covered: integration)
    - As User7, self-joining an OPEN group:
        - Submit with status 'pending-invited'.
            - **Confirm the request is refused as an invalid status.**
        - Submit with status 'pending-requested'.
            - **Confirm the request is refused as an invalid status.**
        - Submit with role 'moderator'.
            - **Confirm the request is refused as an invalid role.**
        - Submit with role 'admin'.
            - **Confirm the request is refused as an invalid role.**
    - As User2, inviting to an OPEN group:
        - Submit with status 'member'.
            - **Confirm the request is refused as an invalid status.**
        - Submit with status 'pending-requested'.
            - **Confirm the request is refused as an invalid status.**
        - Submit with role 'moderator'.
            - **Confirm the request is refused as an invalid role.**
    - As User7, self-requesting a PRIVATE group:
        - Submit with status 'member'.
            - **Confirm the request is refused as an invalid status.**
        - Submit with status 'pending-invited'.
            - **Confirm the request is refused as an invalid status.**
    - As User2, inviting to a PRIVATE group:
        - Submit with status 'pending-requested'.
            - **Confirm the request is refused as an invalid status.**
    - As User2, inviting to a HIDDEN group:
        - Submit with status 'member'.
            - **Confirm the request is refused as an invalid status.**

#### Status and role rules for subgroups

- [ ] As a parent admin, my self-add into a subgroup must carry the right status and role. (covered: integration)
    - As User4, a parent group admin:
        - Self-add with role 'member'.
            - **Confirm the request is refused as an invalid role.**
        - Self-add with status 'pending-invited'.
            - **Confirm the request is refused as an invalid status.**
        - Attempt to add someone else.
            - **Confirm the request is refused as an invalid userId.**

- [ ] As a subgroup joiner, my status must match the subgroup type. (covered: integration)
    - As User6, a parent group member joining a PRIVATE-OPEN subgroup:
        - Submit with status 'pending-requested'.
            - **Confirm the request is refused as an invalid status.**
    - As User7, a non-parent requesting a PRIVATE-OPEN subgroup:
        - Submit with status 'member'.
            - **Confirm the request is refused as an invalid status.**
    - As User6, a parent group member joining a HIDDEN-OPEN subgroup:
        - Submit with status 'pending-invited'.
            - **Confirm the request is refused as an invalid status.**
