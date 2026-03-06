## [Read Group](documentation/testing/test-cases/Group/read.md)

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

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups


- [ ] Non-members can view the content of a Public - Public Group.

- [ ] Parent Group Members can view the content of a Public - Public Group.

- [ ] Parent Group Admins can view the content of a Public - Public Group.

- [ ] Members can view the content of a Public - Public Group.

##### Private Subgroups of Public Groups

- [ ] Non-members can see a Public - Private Group exists and read its description.

- [ ] Non-members **cannot*** view the content of a Public - Private Group.

- [ ] Parent Group Members can see a Public - Private Group exists and read its description.

- [ ] Parent Group Members **cannot*** view the content of a Public - Private Group.

- [ ] Parent Group Admins can see a Public - Private Group exists and read its description.

- [ ] Parent Group Admins can view the content of a Public - Private Group.

- [ ] Members can see a Public - Private Group exists and read its description.

- [ ] Members can view the content of a Public - Private Group.

###### Hidden Subgroups of Public Groups

- [ ] Non-members **cannot*** see a Public - Hidden Group exists or read its description.

- [ ] Non-members **cannot*** view the content of a Public - Hidden Group.

- [ ] Parent Group Members **cannot*** see a Public - Hidden Group exists or read its description.

- [ ] Parent Group Members **cannot*** view the content of a Public - Hidden Group.

- [ ] Parent Group Admins can see a Public - Hidden Group exists and read its description.

- [ ] Parent Group Admins can view the content of a Public - Hidden Group.

- [ ] Members can see a Public - Hidden Group exists and read its description.

- [ ] Members can view the content of a Public - Hidden Group.

#### Subgroups of Private Groups

##### Public Subgroups of Private Groups

- [ ] Non-members can see a Private - Public Group exists and read its description.

- [ ] Non-members **cannot*** view the content of a Private - Public Group.

- [ ] Parent Group Members can see a Private - Public Group exists and read its description.

- [ ] Parent Group Members can view the content of a Private - Public Group.

- [ ] Parent Group Admins can see a Private - Public Group exists and read its description.

- [ ] Parent Group Admins can view the content of a Private - Public Group.

- [ ] Members can see a Private - Public Group exists and read its description.

- [ ] Members can view the content of a Private - Public Group.

##### Private Subgroups of Private Groups

- [ ] Non-members can see a Private - Private Group exists and read its description.

- [ ] Non-members **cannot*** view the content of a Private - Private Group.

- [ ] Parent Group Members can see a Private - Private Group exists and read its description.

- [ ] Parent Group Members **cannot*** view the content of a Private - Private Group.

- [ ] Parent Group Admins can see a Private - Private Group exists and read its description.

- [ ] Parent Group Admins can view the content of a Private - Private Group.

- [ ] Members can see a Private - Private Group exists and read its description.

- [ ] Members can view the content of a Private - Private Group.

###### Hidden Subgroups of Private Groups

- [ ] Non-members **cannot*** see a Private - Hidden Group exists or read its description.

- [ ] Non-members **cannot*** view the content of a Private - Hidden Group.

- [ ] Parent Group Members **cannot*** see a Private - Hidden Group exists or read its description.

- [ ] Parent Group Members **cannot*** view the content of a Private - Hidden Group.

- [ ] Parent Group Admins can see a Private - Hidden Group exists and read its description.

- [ ] Parent Group Admins can view the content of a Private - Hidden Group.

- [ ] Members can see a Private - Hidden Group exists and read its description.

- [ ] Members can view the content of a Private - Hidden Group.

#### Subgroups of Hidden Groups

##### Public Subgroups of Hidden Groups

- [ ] Non-members **cannot*** see a Hidden - Public Group exists or read its description.

- [ ] Non-members **cannot*** view the content of a Hidden - Public Group.

- [ ] Parent Group Members can see a Hidden - Public Group exists and read its description.

- [ ] Parent Group Members can view the content of a Hidden - Public Group.

- [ ] Parent Group Admins can see a Hidden - Public Group exists and read its description.

- [ ] Parent Group Admins can view the content of a Hidden - Public Group.

- [ ] Members can see a Hidden - Public Group exists and read its description.

- [ ] Members can view the content of a Hidden - Public Group.

##### Private Subgroups of Hidden Groups

- [ ] Non-members **cannot** see a Hidden - Private Group exists or read its description.

- [ ] Non-members **cannot*** view the content of a Hidden - Private Group.

- [ ] Parent Group Members can see a Hidden - Private Group exists and read its description.

- [ ] Parent Group Members **cannot*** view the content of a Hidden - Private Group.

- [ ] Parent Group Admins can see a Hidden - Private Group exists and read its description.

- [ ] Parent Group Admins can view the content of a Hidden - Private Group.

- [ ] Members can see a Hidden - Private Group exists and read its description.

- [ ] Members can view the content of a Hidden - Private Group.

###### Hidden Subgroups of Hidden Groups

- [ ] Non-members **cannot*** see a Hidden - Hidden Group exists or read its description.

- [ ] Non-members **cannot*** view the content of a Hidden - Hidden Group.

- [ ] Parent Group Members **cannot*** see a Hidden - Hidden Group exists or read its description.

- [ ] Parent Group Members **cannot*** view the content of a Hidden - Hidden Group.

- [ ] Parent Group Admins can see a Hidden - Hidden Group exists and read its description.

- [ ] Parent Group Admins can view the content of a Hidden - Hidden Group.

- [ ] Members can see a Hidden - Hidden Group exists and read its description.

- [ ] Members can view the content of a Hidden - Hidden Group.
