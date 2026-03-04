## [Read GroupPost](documentation/testing/test-cases/GroupPost/read.md)

Cases covering GroupPost reading.  Who can view the posts in a group?

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

- [ ] Non-members can view posts.
- [ ] Members can view posts.
- [ ] Group Moderators can view posts.
- [ ] Group Admins can view posts.

##### Private Groups

- [ ] Non-members **cannot** view posts.
- [ ] Members can view posts.
- [ ] Group Moderators can view posts.
- [ ] Group Admins can view posts.

##### Hidden Groups

- [ ] Non-members **cannot** view posts.
- [ ] Members can view posts.
- [ ] Group Moderators can view posts.
- [ ] Group Admins can view posts.

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

- [ ] Non-members can view posts.
- [ ] Members can view posts.
- [ ] Parent Group Members can view posts. 
- [ ] Parent Group Admins can view posts.
- [ ] Group Moderators can view posts.
- [ ] Group Admins can view posts.

##### Private Subgroups of Public Groups

- [ ] Non-members **cannot** view posts.
- [ ] Parent Group Members **cannot** view posts. 
- [ ] Parent Group Admins **cannot** view posts.
- [ ] Members can view posts.
- [ ] Group Moderators can view posts.
- [ ] Group Admins can view posts.

###### Hidden Subgroups of Public Groups

- [ ] Non-members **cannot** view posts.
- [ ] Parent Group Members **cannot** view posts. 
- [ ] Parent Group Admins **cannot** view posts.
- [ ] Members can view posts.
- [ ] Group Moderators can view posts.
- [ ] Group Admins can view posts.

#### Subgroups of Private Groups

##### Public Subgroups of Private Groups

- [ ] Non-members **cannot** view posts.
- [ ] Parent Group Members can view posts. 
- [ ] Parent Group Admins can view posts.
- [ ] Members can view posts.
- [ ] Group Moderators can view posts.
- [ ] Group Admins can view posts.

##### Private Subgroups of Private Groups

- [ ] Non-members **cannot** view posts.
- [ ] Parent Group Members **cannot** view posts. 
- [ ] Parent Group Admins **cannot** view posts.
- [ ] Members can view posts.
- [ ] Group Moderators can view posts.
- [ ] Group Admins can view posts.

###### Hidden Subgroups of Private Groups

- [ ] Non-members **cannot** view posts.
- [ ] Parent Group Members **cannot** view posts. 
- [ ] Parent Group Admins **cannot** view posts.
- [ ] Members can view posts.
- [ ] Group Moderators can view posts.
- [ ] Group Admins can view posts.

#### Subgroups of Hidden Groups

##### Public Subgroups of Hidden Groups

- [ ] Non-members **cannot** view posts.
- [ ] Parent Group Members can view posts. 
- [ ] Parent Group Admins can view posts.
- [ ] Members can view posts.
- [ ] Group Moderators can view posts.
- [ ] Group Admins can view posts.

##### Private Subgroups of Hidden Groups

- [ ] Non-members **cannot** view posts.
- [ ] Parent Group Members **cannot** view posts. 
- [ ] Parent Group Admins **cannot** view posts.
- [ ] Members can view posts.
- [ ] Group Moderators can view posts.
- [ ] Group Admins can view posts.

###### Hidden Subgroups of Hidden Groups

- [ ] Non-members **cannot** view posts.
- [ ] Parent Group Members **cannot** view posts. 
- [ ] Parent Group Admins **cannot** view posts.
- [ ] Members can view posts.
- [ ] Group Moderators can view posts.
- [ ] Group Admins can view posts.
