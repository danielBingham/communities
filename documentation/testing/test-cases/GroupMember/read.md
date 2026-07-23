## [Read GroupMember](documentation/testing/test-cases/GroupMember/read.md)

Cases covering GroupMember reading.  Who can view the members of a group?

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

- [ ] As a non-member, I can see the members of a Public Group but not of a Private or Hidden Group.
    - As User7:
        - Visit Public Group and open the Members tab.
            - **Confirm the member list is visible.**
        - Visit Private Group and open the Members tab.
            - **Confirm the member list is *not* visible.**
        - Visit Hidden Group.
            - **Confirm the group is not visible at all.**

- [ ] As a member, I can see the members of every group I belong to.
    - As User3:
        - Visit Public Group, Private Group and Hidden Group in turn and open the Members tab.
            - **Confirm the member list is visible in each.**
            - **Confirm User1 is listed as Admin and User2 as Moderator.**

- [ ] A banned member **cannot** view the members of the group they were banned from. (covered: integration)

### Manual Regression

- [ ] As a user, the member list shows each member's role.
    - As User3:
        - Visit Public Group and open the Members tab.
            - **Confirm admins are labelled as Admin.**
            - **Confirm moderators are labelled as Moderator.**
            - **Confirm plain members carry no role label.**

- [ ] As a user, clicking a member in the list takes me to their profile.
    - As User3:
        - Visit Public Group, open the Members tab and click User1.
            - **Confirm User1's profile page loads.**

### Full Regression

#### Basics

- [ ] As an unauthenticated visitor, I cannot read a group member. (covered: integration)
    - As unauthenticated user:
        - Attempt to read a member of Public Group.
            - **Confirm the request is refused.**

- [ ] As a user, a member who doesn't exist is not found. (covered: integration)
    - As User3:
        - Attempt to read a member of a group that doesn't exist.
            - **Confirm a not found result.**
        - Attempt to read a user who is not a member of Public Group.
            - **Confirm a not found result.**

#### Pending members

- [ ] A Group Admin **can** view a pending member. (covered: integration)
- [ ] A Group Moderator **can** view a pending member. (covered: integration)
- [ ] A Site moderator **can** view a pending member. (covered: integration)
- [ ] A confirmed Member **cannot** view a pending member. (covered: integration)
- [ ] In a HIDDEN-OPEN subgroup, a Group Moderator **can** view a pending member but a Parent Group Member **cannot**. (covered: integration)

#### Confirmed members

#### Top level Groups

##### Public Groups

- [ ] Group Admins **can** view the confirmed members of a Public Group. (covered: integration)
- [ ] Group Moderators **can** view the confirmed members of a Public Group. (covered: integration)
- [ ] Members **can** view the confirmed members of a Public Group. (covered: integration)
- [ ] Invited/Requested members **can** view the confirmed members of a Public Group. (covered: integration)
- [ ] Non-members **can** view the confirmed members of a Public Group. (covered: integration)
- [ ] Site moderators **can** view the confirmed members of a Public Group. (covered: integration)
- [ ] Banned members **cannot** view the confirmed members of a Public Group. (covered: integration)

##### Private Groups

- [ ] Group Admins **can** view the confirmed members of a Private Group. (covered: integration)
- [ ] Group Moderators **can** view the confirmed members of a Private Group. (covered: integration)
- [ ] Members **can** view the confirmed members of a Private Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the confirmed members of a Private Group. (covered: integration)
- [ ] Non-members **cannot** view the confirmed members of a Private Group. (covered: integration)
- [ ] Site moderators **can** view the confirmed members of a Private Group. (covered: integration)
- [ ] Banned members **cannot** view the confirmed members of a Private Group. (covered: integration)

##### Hidden Groups

- [ ] Group Admins **can** view the confirmed members of a Hidden Group. (covered: integration)
- [ ] Group Moderators **can** view the confirmed members of a Hidden Group. (covered: integration)
- [ ] Members **can** view the confirmed members of a Hidden Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the confirmed members of a Hidden Group. (covered: integration)
- [ ] Non-members **cannot** view the confirmed members of a Hidden Group. (covered: integration)
- [ ] Site moderators **can** view the confirmed members of a Hidden Group. (covered: integration)
- [ ] Banned members **cannot** view the confirmed members of a Hidden Group. (covered: integration)

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

- [ ] Group Admins **can** view the confirmed members of a Public - Public Group. (covered: integration)
- [ ] Group Moderators **can** view the confirmed members of a Public - Public Group. (covered: integration)
- [ ] Members **can** view the confirmed members of a Public - Public Group. (covered: integration)
- [ ] Parent Group Admins **can** view the confirmed members of a Public - Public Group. (covered: integration)
- [ ] Parent Group Moderators **can** view the confirmed members of a Public - Public Group. (covered: integration)
- [ ] Parent Group Members **can** view the confirmed members of a Public - Public Group. (covered: integration)
- [ ] Invited/Requested members **can** view the confirmed members of a Public - Public Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** view the confirmed members of a Public - Public Group. (covered: integration)
- [ ] Non-members **can** view the confirmed members of a Public - Public Group. (covered: integration)
- [ ] Site moderators **can** view the confirmed members of a Public - Public Group. (covered: integration)
- [ ] Banned members **cannot** view the confirmed members of a Public - Public Group. (covered: integration)

##### Private Subgroups of Public Groups

- [ ] Group Admins **can** view the confirmed members of a Public - Private Group. (covered: integration)
- [ ] Group Moderators **can** view the confirmed members of a Public - Private Group. (covered: integration)
- [ ] Members **can** view the confirmed members of a Public - Private Group. (covered: integration)
- [ ] Parent Group Admins **can** view the confirmed members of a Public - Private Group. (covered: integration)
- [ ] Parent Group Moderators **cannot** view the confirmed members of a Public - Private Group. (covered: integration)
- [ ] Parent Group Members **cannot** view the confirmed members of a Public - Private Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the confirmed members of a Public - Private Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view the confirmed members of a Public - Private Group. (covered: integration)
- [ ] Non-members **cannot** view the confirmed members of a Public - Private Group. (covered: integration)
- [ ] Site moderators **can** view the confirmed members of a Public - Private Group. (covered: integration)
- [ ] Banned members **cannot** view the confirmed members of a Public - Private Group. (covered: integration)

##### Hidden Subgroups of Public Groups

- [ ] Group Admins **can** view the confirmed members of a Public - Hidden Group. (covered: integration)
- [ ] Group Moderators **can** view the confirmed members of a Public - Hidden Group. (covered: integration)
- [ ] Members **can** view the confirmed members of a Public - Hidden Group. (covered: integration)
- [ ] Parent Group Admins **can** view the confirmed members of a Public - Hidden Group. (covered: integration)
- [ ] Parent Group Moderators **cannot** view the confirmed members of a Public - Hidden Group. (covered: integration)
- [ ] Parent Group Members **cannot** view the confirmed members of a Public - Hidden Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the confirmed members of a Public - Hidden Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view the confirmed members of a Public - Hidden Group. (covered: integration)
- [ ] Non-members **cannot** view the confirmed members of a Public - Hidden Group. (covered: integration)
- [ ] Site moderators **can** view the confirmed members of a Public - Hidden Group. (covered: integration)
- [ ] Banned members **cannot** view the confirmed members of a Public - Hidden Group. (covered: integration)

#### Subgroups of Private Groups

##### Open Subgroups of Private Groups

- [ ] Group Admins **can** view the confirmed members of a Private - Open Group. (covered: integration)
- [ ] Group Moderators **can** view the confirmed members of a Private - Open Group. (covered: integration)
- [ ] Members **can** view the confirmed members of a Private - Open Group. (covered: integration)
- [ ] Parent Group Admins **can** view the confirmed members of a Private - Open Group. (covered: integration)
- [ ] Parent Group Moderators **can** view the confirmed members of a Private - Open Group. (covered: integration)
- [ ] Parent Group Members **can** view the confirmed members of a Private - Open Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the confirmed members of a Private - Open Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** view the confirmed members of a Private - Open Group. (covered: integration)
- [ ] Non-members **cannot** view the confirmed members of a Private - Open Group. (covered: integration)
- [ ] Site moderators **can** view the confirmed members of a Private - Open Group. (covered: integration)
- [ ] Banned members **cannot** view the confirmed members of a Private - Open Group. (covered: integration)

##### Private Subgroups of Private Groups

- [ ] Group Admins **can** view the confirmed members of a Private - Private Group. (covered: integration)
- [ ] Group Moderators **can** view the confirmed members of a Private - Private Group. (covered: integration)
- [ ] Members **can** view the confirmed members of a Private - Private Group. (covered: integration)
- [ ] Parent Group Admins **can** view the confirmed members of a Private - Private Group. (covered: integration)
- [ ] Parent Group Moderators **cannot** view the confirmed members of a Private - Private Group. (covered: integration)
- [ ] Parent Group Members **cannot** view the confirmed members of a Private - Private Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the confirmed members of a Private - Private Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view the confirmed members of a Private - Private Group. (covered: integration)
- [ ] Non-members **cannot** view the confirmed members of a Private - Private Group. (covered: integration)
- [ ] Site moderators **can** view the confirmed members of a Private - Private Group. (covered: integration)
- [ ] Banned members **cannot** view the confirmed members of a Private - Private Group. (covered: integration)

##### Hidden Subgroups of Private Groups

- [ ] Group Admins **can** view the confirmed members of a Private - Hidden Group. (covered: integration)
- [ ] Group Moderators **can** view the confirmed members of a Private - Hidden Group. (covered: integration)
- [ ] Members **can** view the confirmed members of a Private - Hidden Group. (covered: integration)
- [ ] Parent Group Admins **can** view the confirmed members of a Private - Hidden Group. (covered: integration)
- [ ] Parent Group Moderators **cannot** view the confirmed members of a Private - Hidden Group. (covered: integration)
- [ ] Parent Group Members **cannot** view the confirmed members of a Private - Hidden Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the confirmed members of a Private - Hidden Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view the confirmed members of a Private - Hidden Group. (covered: integration)
- [ ] Non-members **cannot** view the confirmed members of a Private - Hidden Group. (covered: integration)
- [ ] Site moderators **can** view the confirmed members of a Private - Hidden Group. (covered: integration)
- [ ] Banned members **cannot** view the confirmed members of a Private - Hidden Group. (covered: integration)

#### Subgroups of Hidden Groups

##### Open Subgroups of Hidden Groups

- [ ] Group Admins **can** view the confirmed members of a Hidden - Open Group. (covered: integration)
- [ ] Group Moderators **can** view the confirmed members of a Hidden - Open Group. (covered: integration)
- [ ] Members **can** view the confirmed members of a Hidden - Open Group. (covered: integration)
- [ ] Parent Group Admins **can** view the confirmed members of a Hidden - Open Group. (covered: integration)
- [ ] Parent Group Moderators **can** view the confirmed members of a Hidden - Open Group. (covered: integration)
- [ ] Parent Group Members **can** view the confirmed members of a Hidden - Open Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the confirmed members of a Hidden - Open Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** view the confirmed members of a Hidden - Open Group. (covered: integration)
- [ ] Non-members **cannot** view the confirmed members of a Hidden - Open Group. (covered: integration)
- [ ] Site moderators **can** view the confirmed members of a Hidden - Open Group. (covered: integration)
- [ ] Banned members **cannot** view the confirmed members of a Hidden - Open Group. (covered: integration)

##### Private Subgroups of Hidden Groups

- [ ] Group Admins **can** view the confirmed members of a Hidden - Private Group. (covered: integration)
- [ ] Group Moderators **can** view the confirmed members of a Hidden - Private Group. (covered: integration)
- [ ] Members **can** view the confirmed members of a Hidden - Private Group. (covered: integration)
- [ ] Parent Group Admins **can** view the confirmed members of a Hidden - Private Group. (covered: integration)
- [ ] Parent Group Moderators **cannot** view the confirmed members of a Hidden - Private Group. (covered: integration)
- [ ] Parent Group Members **cannot** view the confirmed members of a Hidden - Private Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the confirmed members of a Hidden - Private Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view the confirmed members of a Hidden - Private Group. (covered: integration)
- [ ] Non-members **cannot** view the confirmed members of a Hidden - Private Group. (covered: integration)
- [ ] Site moderators **can** view the confirmed members of a Hidden - Private Group. (covered: integration)
- [ ] Banned members **cannot** view the confirmed members of a Hidden - Private Group. (covered: integration)

##### Hidden Subgroups of Hidden Groups

- [ ] Group Admins **can** view the confirmed members of a Hidden - Hidden Group. (covered: integration)
- [ ] Group Moderators **can** view the confirmed members of a Hidden - Hidden Group. (covered: integration)
- [ ] Members **can** view the confirmed members of a Hidden - Hidden Group. (covered: integration)
- [ ] Parent Group Admins **can** view the confirmed members of a Hidden - Hidden Group. (covered: integration)
- [ ] Parent Group Moderators **cannot** view the confirmed members of a Hidden - Hidden Group. (covered: integration)
- [ ] Parent Group Members **cannot** view the confirmed members of a Hidden - Hidden Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the confirmed members of a Hidden - Hidden Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view the confirmed members of a Hidden - Hidden Group. (covered: integration)
- [ ] Non-members **cannot** view the confirmed members of a Hidden - Hidden Group. (covered: integration)
- [ ] Site moderators **can** view the confirmed members of a Hidden - Hidden Group. (covered: integration)
- [ ] Banned members **cannot** view the confirmed members of a Hidden - Hidden Group. (covered: integration)
