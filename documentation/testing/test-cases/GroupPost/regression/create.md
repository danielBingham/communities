## [Create GroupPost](documentation/testing/test-cases/GroupPost/create.md)

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

##### Private Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts.
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

##### Hidden Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts.
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

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

###### Posting Permissions: Anyone

- [ ] Non-members can create posts.
- [ ] Parent Group Members can create posts. 
- [ ] Parent Group Admins can create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create pending posts.
- [ ] Group Moderators can create pending posts.
- [ ] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [ ] Non-members **cannot** create posts.
- [ ] Members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

##### Private Subgroups of Public Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins can create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create pending posts.
- [ ] Group Moderators can create pending posts.
- [ ] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [ ] Non-members **cannot** create posts.
- [ ] Members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Hidden Subgroups of Public Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins can create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create pending posts.
- [ ] Group Moderators can create pending posts.
- [ ] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [ ] Non-members **cannot** create posts.
- [ ] Members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

#### Subgroups of Private Groups

##### Public Subgroups of Private Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members can create posts. 
- [ ] Parent Group Admins can create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create pending posts.
- [ ] Group Moderators can create pending posts.
- [ ] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [ ] Non-members **cannot** create posts.
- [ ] Members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

##### Private Subgroups of Private Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins can create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create pending posts.
- [ ] Group Moderators can create pending posts.
- [ ] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [ ] Non-members **cannot** create posts.
- [ ] Members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Hidden Subgroups of Private Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins can create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create pending posts.
- [ ] Group Moderators can create pending posts.
- [ ] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [ ] Non-members **cannot** create posts.
- [ ] Members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

#### Subgroups of Hidden Groups

##### Public Subgroups of Hidden Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members can create posts. 
- [ ] Parent Group Admins can create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create pending posts.
- [ ] Group Moderators can create pending posts.
- [ ] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [ ] Non-members **cannot** create posts.
- [ ] Members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

##### Private Subgroups of Hidden Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins can create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create pending posts.
- [ ] Group Moderators can create pending posts.
- [ ] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [ ] Non-members **cannot** create posts.
- [ ] Members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Hidden Subgroups of Hidden Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins can create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [ ] Non-members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Members can create pending posts.
- [ ] Group Moderators can create pending posts.
- [ ] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [ ] Non-members **cannot** create posts.
- [ ] Members **cannot** create posts.
- [ ] Parent Group Members **cannot** create posts. 
- [ ] Parent Group Admins **cannot** create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.
