## [Delete GroupMember](documentation/testing/test-cases/GroupMember/delete.md)

Cases covering GroupMember deletion: leaving a group, declining or cancelling
a pending membership, and removing another member.

### Pre-requisites

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

### Smoke Test

- [ ] As a member, I can leave a group.
    - As User3:
        - Visit Public Group and click "Leave Group".
            - **Confirm you are removed from the member list.**
            - **Confirm the group's posts no longer appear in your feed.**

- [ ] As a group moderator, I can remove a member.
    - As User2:
        - Open Public Group -> Members and remove a plain member.
            - **Confirm the member is removed from the list.**

- [ ] As the last group admin, I cannot leave the group. (covered: integration)
    - As User1, the only admin of a group:
        - Attempt to leave the group.
            - **Confirm the request is refused and you remain a member.**

### Manual Regression

- [ ] As a member, leaving a group is confirmed before it takes effect.
    - As User3:
        - Click "Leave Group" on Public Group.
            - **Confirm a confirmation prompt is shown.**
        - Cancel the prompt.
            - **Confirm you are still a member.**

- [ ] As a user who left a Hidden Group, the group becomes invisible to me.
    - As User3:
        - Leave Hidden Group.
            - **Confirm the group no longer appears in your Groups list.**
        - Attempt to visit the group by URL.
            - **Confirm a not found page renders.**

### Full Regression

#### Authentication and existence

- [ ] As an unauthenticated visitor, I cannot remove a group member. (covered: integration)
    - As unauthenticated user:
        - Attempt to remove a member of Public Group.
            - **Confirm the request is refused.**

- [ ] As a user, removing a member that doesn't exist is not found. (covered: integration)
    - As User2:
        - Attempt to remove a member of a group that doesn't exist.
            - **Confirm a not found result.**
        - Attempt to remove a userId that isn't a member of the group.
            - **Confirm a not found result.**
        - Attempt to remove a real user who is not a member of the group.
            - **Confirm a not found result.**
            - **Confirm the failure is not described as a failed update.**

- [ ] As a user, a malformed userId is rejected. (possibly deprecated) (covered: integration)
    - NOTE: This case is skipped in the Integration suite with a KNOWN BUG
      annotation: the groupId is not validated before being passed to the
      database, so a malformed UUID produces a 500 rather than a 400.
      Re-check the expectation before running.
    - As User2:
        - Attempt to remove a member using a malformed (non-UUID) userId.
            - **Confirm the request is refused with a validation error, not a server error.**

#### Permissions on Open groups

- [ ] A Group Moderator **cannot** remove another moderator. (covered: integration)
- [ ] A Group Moderator **cannot** remove an admin. (covered: integration)
- [ ] A Group Admin **cannot** remove another admin. (covered: integration)
- [ ] A site moderator **cannot** remove an admin. (covered: integration)
- [ ] A plain Member **cannot** remove another member. (covered: integration)
- [ ] A pending invitee **cannot** remove another member. (covered: integration)
- [ ] A plain Member **cannot** remove a moderator. (covered: integration)
- [ ] A non-member **cannot** remove a member. (covered: integration)
- [ ] A non-member **cannot** remove an admin. (covered: integration)
- [ ] A banned member **cannot** remove another member, and is told the group is not found. (covered: integration)
- [ ] A banned member **cannot** remove themselves, and is told the group is not found. (covered: integration)
- [ ] A Group Moderator **can** remove a member. (covered: integration)
- [ ] A Group Admin **can** remove a moderator. (covered: integration)
- [ ] A member **can** remove themselves (leave the group). (covered: integration)
- [ ] A site moderator **can** remove a member. (covered: integration)
- [ ] A Group Moderator **can** remove a banned member. (covered: integration)
- [ ] A moderator **can** remove themselves (leave the group). (covered: integration)

#### Permissions on Private groups

- [ ] A non-member **cannot** remove a member, and is told it is forbidden rather than not found. (covered: integration)
- [ ] A Group Moderator **can** remove a member. (covered: integration)
- [ ] A Group Admin **can** remove a member. (covered: integration)
- [ ] A member **can** remove themselves. (covered: integration)

#### Permissions on Hidden groups

- [ ] A non-member **cannot** remove a member, and is told it is not found rather than forbidden. (covered: integration)
- [ ] A Group Moderator **can** remove a member. (covered: integration)
- [ ] A member **can** remove themselves. (covered: integration)
- [ ] A pending invitee **can** decline by removing their own row. (covered: integration)

#### Permissions on Subgroups

- [ ] A Parent Group Moderator **cannot** remove a child member. (covered: integration)
- [ ] A Parent Group Member **cannot** remove a child member. (covered: integration)
- [ ] An outsider **cannot** remove a member of a HIDDEN-OPEN subgroup, and is told it is not found. (covered: integration)
- [ ] A Parent Group Admin **cannot** remove the child's admin. (covered: integration)
- [ ] A Parent Group Admin **can** remove a child member. (covered: integration)
- [ ] A child Group Moderator **can** remove a child member. (covered: integration)
- [ ] A Parent Group Admin **can** remove a child moderator. (covered: integration)

#### Self-removal from compound subgroup types

- [ ] A member **can** leave a PRIVATE-OPEN subgroup. (covered: integration)
- [ ] A member **can** leave a HIDDEN-OPEN subgroup. (covered: integration)
- [ ] A member **can** leave a HIDDEN-PRIVATE subgroup. (covered: integration)

#### Membership lifecycle removals

- [ ] An invited user **can** decline by removing their own invitation. (covered: integration)
- [ ] A Group Moderator **can** rescind an invitation. (covered: integration)
- [ ] A requesting user **can** cancel their own request. (covered: integration)
- [ ] A Group Moderator **can** reject a request by removing it. (covered: integration)

#### Last admin guard

- [ ] As the only admin, I cannot leave but I can still manage the group. (covered: integration)
    - As User1, the only admin:
        - Attempt to leave the group.
            - **Confirm the request is refused.**
        - Remove another member.
            - **Confirm the removal succeeds.**
        - Promote a second admin, then leave the group.
            - **Confirm leaving now succeeds.**
    - As the remaining admin:
        - Attempt to leave the group.
            - **Confirm the request is refused.**

- [ ] As the last real admin, a pending or banned co-admin does not let me leave. (covered: integration)
    - As User1:
        - With the only other admin never having accepted their invitation, attempt to leave.
            - **Confirm the request is refused.**
        - With the only other admin banned, attempt to leave.
            - **Confirm the request is refused.**

#### Removal side effects

- [ ] As a group moderator, a removal returns the removed row and can be undone by re-inviting. (covered: integration)
    - As User2:
        - Remove a member.
            - **Confirm the removed membership row, including its id, is returned.**
        - Invite the removed member again.
            - **Confirm the invitation is accepted.**
