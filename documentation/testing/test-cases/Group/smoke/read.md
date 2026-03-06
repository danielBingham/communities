## [Read Group](documentation/testing/test-cases/Group/read.md)

Cases covering group deletion.

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group

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

- [ ] Non-members can see a Public Group exists and read its description.

- [ ] Non-members can view the content of a Public Group.

- [ ] Members can see a Public Group exists and read its description.

- [ ] Members can view the content of a Public Group.

##### Private Groups

- [ ] Non-members can see a Private Group exists and read its description.

- [ ] Non-members **cannot*** view the content of a Private Group.

- [ ] Members can see a Private Group exists and read its description.

- [ ] Members can view the content of a Private Group.

##### Hidden Groups

- [ ] Non-members **cannot*** seen a Hidden Group exists or read the description.

- [ ] Non-members **cannot*** view the content of a Hidden Group.

- [ ] Members can see a Hidden Group exists and read the description.

- [ ] Members can view the content of a Hidden Group.
