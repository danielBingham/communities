## [Create GroupPost](documentation/testing/test-cases/GroupPost/create.md)

Cases covering group deletion.

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group
        - [ ] A Hidden Group named Hidden - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and is a non-member of all groups.

### Cases

#### Top level Groups

##### Public Groups

###### Posting Permissions: Anyone

- [ ] Non-members can create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [ ] Non-members **cannot** create posts.
- [ ] Members can create pending posts.
- [ ] Group Moderators can create pending posts.
- [ ] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [ ] Non-members **cannot** create posts.
- [ ] Members **cannot** create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

