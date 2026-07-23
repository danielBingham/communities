## [Query GroupMember](documentation/testing/test-cases/GroupMember/query.md)

Cases covering searching or browsing for GroupMembers.

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

- [ ] As a member, I can browse the member lists of a group.
    - As User3:
        - Visit Public Group -> Members.
            - **Confirm the Members list loads.**
            - **Confirm the Administrators list loads.**
        - Page through a list longer than one page.
            - **Confirm paging works and no member appears twice.**

- [ ] As a group moderator, I can browse the pending and banned lists.
    - As User2:
        - Visit Private Group -> Members.
            - **Confirm the Invitations list loads.**
            - **Confirm the Requests list loads.**
            - **Confirm the Banned Users list loads.**

- [ ] As a non-member, I **cannot** browse the member lists of a Private Group. (covered: integration)

### Manual Regression

- [ ] As a user, I can filter a member list using the Search control.
    - As User3:
        - Visit Public Group -> Members and enter part of a member's name.
            - **Confirm the list filters down to matching members.**
        - Clear the Search control.
            - **Confirm the full list returns.**

Email Invitations cannot be created or read by the Integration suite, so the
Email Invitation list cases live here.

#### Top level Groups

##### Public Groups

- [ ] Group Moderators **can** query Email Invitations.

##### Private Groups

- [ ] Group Moderators **can** query Email Invitations.

##### Hidden Groups

- [ ] Group Moderators **can** query Email Invitations.

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

- [ ] Group Moderators **can** query Email Invitations.
- [ ] Parent Group Admins **can** query Email Invitations.

##### Private Subgroups of Public Groups

- [ ] Group Moderators **can** query Email Invitations.
- [ ] Parent Group Admins **can** query Email Invitations.

##### Hidden Subgroups of Public Groups

- [ ] Group Moderators **can** query Email Invitations.
- [ ] Parent Group Admins **can** query Email Invitations.

#### Subgroups of Private Groups

##### Public Subgroups of Private Groups

- [ ] Group Moderators **can** query Email Invitations.
- [ ] Parent Group Admins **can** query Email Invitations.

##### Private Subgroups of Private Groups

- [ ] Group Moderators **can** query Email Invitations.
- [ ] Parent Group Admins **can** query Email Invitations.

##### Hidden Subgroups of Private Groups

- [ ] Group Moderators **can** query Email Invitations.
- [ ] Parent Group Admins **can** query Email Invitations.

#### Subgroups of Hidden Groups

##### Public Subgroups of Hidden Groups

- [ ] Group Moderators **can** query Email Invitations.
- [ ] Parent Group Admins **can** query Email Invitations.

##### Private Subgroups of Hidden Groups

- [ ] Group Moderators **can** query Email Invitations.
- [ ] Parent Group Admins **can** query Email Invitations.

##### Hidden Subgroups of Hidden Groups

- [ ] Group Moderators **can** query Email Invitations.
- [ ] Parent Group Admins **can** query Email Invitations.

### Full Regression

- [ ] As a user, the member list matches what I can read individually. (covered: integration)
    - As User1:
        - Visit a group's Members list and open each member in turn.
            - **Confirm every member shown in the list can also be read individually.**
            - **Confirm no member that cannot be read individually appears in the list.**

- [ ] As a user, the full membership of a group I can see is paginated. (covered: integration)
    - As User3:
        - Visit a group with more members than fit on one page.
            - **Confirm the whole membership is reachable by paging.**

The lists below are checked against the individually readable member for every
role and group type.  The expected visibility for each role is defined in
[Read GroupMember](documentation/testing/test-cases/GroupMember/read.md).

#### Top level Groups

##### Public Groups

- [ ] Non-members **can** query Members. (covered: integration)
- [ ] Non-members **can** query Administrators. (covered: integration)
- [ ] Members **can** query Members. (covered: integration)
- [ ] Members **can** query Administrators. (covered: integration)
- [ ] Group Moderators **can** query Invitations. (covered: integration)
- [ ] Group Moderators **can** query Banned Users. (covered: integration)

##### Private Groups

- [ ] Non-members **cannot** query Members. (covered: integration)
- [ ] Non-members **cannot** query Administrators. (covered: integration)
- [ ] Members **can** query Members. (covered: integration)
- [ ] Members **can** query Administrators. (covered: integration)
- [ ] Group Moderators **can** query Invitations. (covered: integration)
- [ ] Group Moderators **can** query Requests. (covered: integration)
- [ ] Group Moderators **can** query Banned Users. (covered: integration)

##### Hidden Groups

- [ ] Non-members **cannot** query Members. (covered: integration)
- [ ] Non-members **cannot** query Administrators. (covered: integration)
- [ ] Members **can** query Members. (covered: integration)
- [ ] Members **can** query Administrators. (covered: integration)
- [ ] Group Moderators **can** query Invitations. (covered: integration)
- [ ] Group Moderators **can** query Requests. (covered: integration)
- [ ] Group Moderators **can** query Banned Users. (covered: integration)

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

- [ ] Non-members **can** query Members. (covered: integration)
- [ ] Non-members **can** query Administrators. (covered: integration)
- [ ] Members **can** query Members. (covered: integration)
- [ ] Members **can** query Administrators. (covered: integration)
- [ ] Parent Group Members **can** query Members. (covered: integration)
- [ ] Parent Group Members **can** query Administrators. (covered: integration)
- [ ] Group Moderators **can** query Invitations. (covered: integration)
- [ ] Group Moderators **can** query Requests. (covered: integration)
- [ ] Group Moderators **can** query Banned Users. (covered: integration)
- [ ] Parent Group Admins **can** query Members. (covered: integration)
- [ ] Parent Group Admins **can** query Administrators. (covered: integration)
- [ ] Parent Group Admins **can** query Invitations. (covered: integration)
- [ ] Parent Group Admins **can** query Requests. (covered: integration)
- [ ] Parent Group Admins **can** query Banned Users. (covered: integration)

##### Private Subgroups of Public Groups

- [ ] Non-members **cannot** query Members. (covered: integration)
- [ ] Non-members **cannot** query Administrators. (covered: integration)
- [ ] Members **can** query Members. (covered: integration)
- [ ] Members **can** query Administrators. (covered: integration)
- [ ] Parent Group Members **cannot** query Members. (covered: integration)
- [ ] Parent Group Members **cannot** query Administrators. (covered: integration)
- [ ] Group Moderators **can** query Invitations. (covered: integration)
- [ ] Group Moderators **can** query Requests. (covered: integration)
- [ ] Group Moderators **can** query Banned Users. (covered: integration)
- [ ] Parent Group Admins **can** query Members. (covered: integration)
- [ ] Parent Group Admins **can** query Administrators. (covered: integration)
- [ ] Parent Group Admins **can** query Invitations. (covered: integration)
- [ ] Parent Group Admins **can** query Requests. (covered: integration)
- [ ] Parent Group Admins **can** query Banned Users. (covered: integration)

##### Hidden Subgroups of Public Groups

- [ ] Non-members **cannot** query Members. (covered: integration)
- [ ] Non-members **cannot** query Administrators. (covered: integration)
- [ ] Members **can** query Members. (covered: integration)
- [ ] Members **can** query Administrators. (covered: integration)
- [ ] Parent Group Members **cannot** query Members. (covered: integration)
- [ ] Parent Group Members **cannot** query Administrators. (covered: integration)
- [ ] Group Moderators **can** query Invitations. (covered: integration)
- [ ] Group Moderators **can** query Requests. (covered: integration)
- [ ] Group Moderators **can** query Banned Users. (covered: integration)
- [ ] Parent Group Admins **can** query Members. (covered: integration)
- [ ] Parent Group Admins **can** query Administrators. (covered: integration)
- [ ] Parent Group Admins **can** query Invitations. (covered: integration)
- [ ] Parent Group Admins **can** query Requests. (covered: integration)
- [ ] Parent Group Admins **can** query Banned Users. (covered: integration)

#### Subgroups of Private Groups

##### Public Subgroups of Private Groups

- [ ] Non-members **cannot** query Members. (covered: integration)
- [ ] Non-members **cannot** query Administrators. (covered: integration)
- [ ] Members **can** query Members. (covered: integration)
- [ ] Members **can** query Administrators. (covered: integration)
- [ ] Parent Group Members **can** query Members. (covered: integration)
- [ ] Parent Group Members **can** query Administrators. (covered: integration)
- [ ] Group Moderators **can** query Invitations. (covered: integration)
- [ ] Group Moderators **can** query Requests. (covered: integration)
- [ ] Group Moderators **can** query Banned Users. (covered: integration)
- [ ] Parent Group Admins **can** query Members. (covered: integration)
- [ ] Parent Group Admins **can** query Administrators. (covered: integration)
- [ ] Parent Group Admins **can** query Invitations. (covered: integration)
- [ ] Parent Group Admins **can** query Requests. (covered: integration)
- [ ] Parent Group Admins **can** query Banned Users. (covered: integration)

##### Private Subgroups of Private Groups

- [ ] Non-members **cannot** query Members. (covered: integration)
- [ ] Non-members **cannot** query Administrators. (covered: integration)
- [ ] Members **can** query Members. (covered: integration)
- [ ] Members **can** query Administrators. (covered: integration)
- [ ] Parent Group Members **cannot** query Members. (covered: integration)
- [ ] Parent Group Members **cannot** query Administrators. (covered: integration)
- [ ] Group Moderators **can** query Invitations. (covered: integration)
- [ ] Group Moderators **can** query Requests. (covered: integration)
- [ ] Group Moderators **can** query Banned Users. (covered: integration)
- [ ] Parent Group Admins **can** query Members. (covered: integration)
- [ ] Parent Group Admins **can** query Administrators. (covered: integration)
- [ ] Parent Group Admins **can** query Invitations. (covered: integration)
- [ ] Parent Group Admins **can** query Requests. (covered: integration)
- [ ] Parent Group Admins **can** query Banned Users. (covered: integration)

##### Hidden Subgroups of Private Groups

- [ ] Non-members **cannot** query Members. (covered: integration)
- [ ] Non-members **cannot** query Administrators. (covered: integration)
- [ ] Members **can** query Members. (covered: integration)
- [ ] Members **can** query Administrators. (covered: integration)
- [ ] Parent Group Members **cannot** query Members. (covered: integration)
- [ ] Parent Group Members **cannot** query Administrators. (covered: integration)
- [ ] Group Moderators **can** query Invitations. (covered: integration)
- [ ] Group Moderators **can** query Requests. (covered: integration)
- [ ] Group Moderators **can** query Banned Users. (covered: integration)
- [ ] Parent Group Admins **can** query Members. (covered: integration)
- [ ] Parent Group Admins **can** query Administrators. (covered: integration)
- [ ] Parent Group Admins **can** query Invitations. (covered: integration)
- [ ] Parent Group Admins **can** query Requests. (covered: integration)
- [ ] Parent Group Admins **can** query Banned Users. (covered: integration)

#### Subgroups of Hidden Groups

##### Public Subgroups of Hidden Groups

- [ ] Non-members **cannot** query Members. (covered: integration)
- [ ] Non-members **cannot** query Administrators. (covered: integration)
- [ ] Members **can** query Members. (covered: integration)
- [ ] Members **can** query Administrators. (covered: integration)
- [ ] Parent Group Members **can** query Members. (covered: integration)
- [ ] Parent Group Members **can** query Administrators. (covered: integration)
- [ ] Group Moderators **can** query Invitations. (covered: integration)
- [ ] Group Moderators **can** query Requests. (covered: integration)
- [ ] Group Moderators **can** query Banned Users. (covered: integration)
- [ ] Parent Group Admins **can** query Members. (covered: integration)
- [ ] Parent Group Admins **can** query Administrators. (covered: integration)
- [ ] Parent Group Admins **can** query Invitations. (covered: integration)
- [ ] Parent Group Admins **can** query Requests. (covered: integration)
- [ ] Parent Group Admins **can** query Banned Users. (covered: integration)

##### Private Subgroups of Hidden Groups

- [ ] Non-members **cannot** query Members. (covered: integration)
- [ ] Non-members **cannot** query Administrators. (covered: integration)
- [ ] Members **can** query Members. (covered: integration)
- [ ] Members **can** query Administrators. (covered: integration)
- [ ] Parent Group Members **cannot** query Members. (covered: integration)
- [ ] Parent Group Members **cannot** query Administrators. (covered: integration)
- [ ] Group Moderators **can** query Invitations. (covered: integration)
- [ ] Group Moderators **can** query Requests. (covered: integration)
- [ ] Group Moderators **can** query Banned Users. (covered: integration)
- [ ] Parent Group Admins **can** query Members. (covered: integration)
- [ ] Parent Group Admins **can** query Administrators. (covered: integration)
- [ ] Parent Group Admins **can** query Invitations. (covered: integration)
- [ ] Parent Group Admins **can** query Requests. (covered: integration)
- [ ] Parent Group Admins **can** query Banned Users. (covered: integration)

##### Hidden Subgroups of Hidden Groups

- [ ] Non-members **cannot** query Members. (covered: integration)
- [ ] Non-members **cannot** query Administrators. (covered: integration)
- [ ] Members **can** query Members. (covered: integration)
- [ ] Members **can** query Administrators. (covered: integration)
- [ ] Parent Group Members **cannot** query Members. (covered: integration)
- [ ] Parent Group Members **cannot** query Administrators. (covered: integration)
- [ ] Group Moderators **can** query Invitations. (covered: integration)
- [ ] Group Moderators **can** query Requests. (covered: integration)
- [ ] Group Moderators **can** query Banned Users. (covered: integration)
- [ ] Parent Group Admins **can** query Members. (covered: integration)
- [ ] Parent Group Admins **can** query Administrators. (covered: integration)
- [ ] Parent Group Admins **can** query Invitations. (covered: integration)
- [ ] Parent Group Admins **can** query Requests. (covered: integration)
- [ ] Parent Group Admins **can** query Banned Users. (covered: integration)
