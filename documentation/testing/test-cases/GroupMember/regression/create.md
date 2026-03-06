## [Create GroupMember](documentation/testing/test-cases/GroupMember/create.md)

Cases covering group deletion.

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group
- [ ] A Private Group, Private Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Private - Public Group
        - [ ] A Private Group named Private - Private Group 
        - [ ] A Hidden Group named Private - Hidden Group
- [ ] A Hidden Group, Hidden Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Hidden - Public Group
        - [ ] A Private Group named Hidden - Private Group 
        - [ ] A Hidden Group named Hidden - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and added as an admin only of the top level groups.
- [ ] User5 has been created an added as a moderator only of the top level groups.
- [ ] User6 has been created and added as a member only of the top level groups.

- [ ] User7 has been created and is a non-member of all groups.

### Cases

#### Top level Groups

##### Public Groups

- [ ] Non-members can join.

- [ ] Group Moderators can invite non-member friends to join.

- [ ] Group Moderators can invite non-users to join using their email.

##### Private Groups

- [ ] Non-members can request membership.

- [ ] Group Moderators can accept or reject non-member membership requests.

- [ ] Group Moderators can invite non-member friends to join.

- [ ] Group Moderators can invite non-users to join use their email.

##### Hidden Groups

- [ ] Group Moderators can invite non-member friends to join.

- [ ] Group Moderators can invite non-users to join use their email.

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

- [ ] Non-members can join.

- [ ] Parent Group Members can join.

- [ ] Parent Group Admins can join.

- [ ] Group Moderators can invite non-member friends to join.

- [ ] Group Moderators can invite non-users to join using their email.

##### Private Subgroups of Public Groups

- [ ] Non-members can request membership.

- [ ] Parent Group Members can request membership.

- [ ] Parent Group Admins can join.

- [ ] Group Moderators can accept or reject non-member membership requests.

- [ ] Group Moderators can invite non-member friends to join.

- [ ] Group Moderators can invite non-users to join using their email.

###### Hidden Subgroups of Public Groups

- [ ] Parent Group Admins can join.

- [ ] Group Moderators can invite non-member friends to join.

- [ ] Group Moderators can invite non-users to join using their email.

#### Subgroups of Private Groups

##### Public Subgroups of Private Groups

- [ ] Non-members can request membership.

- [ ] Parent Group Members can join.

- [ ] Parent Group Admins can join.

- [ ] Group Moderators can accept or reject non-member membership requests.

- [ ] Group Moderators can invite non-member friends to join.

- [ ] Group Moderators can invite non-users to join using their email.

##### Private Subgroups of Private Groups

- [ ] Non-members can request membership.

- [ ] Parent Group Members can request membership.

- [ ] Parent Group Admins can join.

- [ ] Group Moderators can accept or reject non-member membership requests.

- [ ] Group Moderators can invite non-member friends to join.

- [ ] Group Moderators can invite non-users to join using their email.

###### Hidden Subgroups of Private Groups

- [ ] Parent Group Admins can join.

- [ ] Group Moderators can invite non-member friends to join.

- [ ] Group Moderators can invite non-users to join using their email.

#### Subgroups of Hidden Groups

##### Public Subgroups of Hidden Groups

- [ ] Parent Group Members can join.

- [ ] Parent Group Admins can join.

- [ ] Group Moderators can invite non-member friends to join.

- [ ] Group Moderators can invite non-users to join using their email.

##### Private Subgroups of Hidden Groups

- [ ] Parent Group Members can request membership.

- [ ] Parent Group Admins can join.

- [ ] Group Moderators can accept or reject non-member membership requests.

- [ ] Group Moderators can invite non-member friends to join.

- [ ] Group Moderators can invite non-users to join using their email.

###### Hidden Subgroups of Hidden Groups

- [ ] Parent Group Admins can join.

- [ ] Group Moderators can accept or reject non-member membership requests.

- [ ] Group Moderators can invite non-member friends to join.

- [ ] Group Moderators can invite non-users to join using their email.
