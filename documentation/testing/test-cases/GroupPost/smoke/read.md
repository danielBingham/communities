## [Read GroupPost](documentation/testing/test-cases/GroupPost/read.md)

Cases covering GroupPost reading.  Who can view the posts in a group?

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and is a non-member of all groups.

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
