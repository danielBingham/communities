## [Update Group](documentation/testing/test-cases/Group/update.md)

Cases covering group updates.

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

- [ ] Members with 'admin' role can update the profile image of a group.

- [ ] Members with 'admin' role can update the description of a group.

- [ ] Members with 'admin' role can update the Posting Permissions of a group.
