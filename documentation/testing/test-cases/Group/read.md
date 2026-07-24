## [Read Group](documentation/testing/test-cases/Group/read.md)

Cases covering reading groups: who can see that a group exists and read its
description, and who can view its content.

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] A Private Group, Private Group, has been created.
- [ ] A Hidden Group, Hidden Group, has been created.

- [ ] Each group contains posts.
- [ ] User3 has been created and added as a member of each group.
- [ ] User7 has been created and is a non-member of all groups.
- [ ] User9 has been created and has been banned from Public Group.

#### Cases

- [ ] As a non-member, I can find and read a Public Group but a Hidden Group is invisible to me.
    - As User7:
        - Visit Public Group.
            - **Confirm the group page loads with its description.**
            - **Confirm the group's posts are visible.**
        - Visit Hidden Group.
            - **Confirm the group is not visible and a not found page renders.**

- [ ] As a non-member, I can read a Private Group's description but not its content.
    - As User7:
        - Visit Private Group.
            - **Confirm the group page loads with its description.**
            - **Confirm the group's posts are *not* visible.**

- [ ] As a member, I can read the content of every group I belong to.
    - As User3:
        - Visit Public Group, Private Group and Hidden Group in turn.
            - **Confirm each group page loads with its description.**
            - **Confirm each group's posts are visible.**

- [ ] As a banned member, a group I have been banned from is invisible to me.
    - As User9:
        - Visit Public Group.
            - **Confirm the group is not visible and a not found page renders.**

### Manual Regression

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created with a profile image, a
      title, a short description, an About text and rules.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group
        - [ ] A Hidden Group named Public - Hidden Group

- [ ] User3 has been created and added as a member of Public Group and each of
      its subgroups.
- [ ] User7 has been created and is a non-member of all groups.

#### Cases

- [ ] As a user, a group page renders its profile image, title and description.
    - As User3:
        - Visit Public Group.
            - **Confirm the group image, title, short description and About text all render.**
            - **Confirm the rules render where they are set.**

- [ ] As a user, a group's subgroup list only shows the subgroups I can see.
    - As User7:
        - Visit Public Group and open the Subgroups tab.
            - **Confirm Public - Public Group and Public - Private Group are listed.**
            - **Confirm Public - Hidden Group is *not* listed.**
    - As User3:
        - Visit Public Group and open the Subgroups tab.
            - **Confirm all three subgroups are listed.**

### Full Regression

#### Pre-requisites

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

- [ ] Every group and subgroup contains posts.

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

#### Basics

- [ ] As an unauthenticated visitor, I cannot read a group. (covered: integration)
    - As unauthenticated user:
        - Attempt to visit Public Group.
            - **Confirm the request is refused.**

- [ ] As a user, a group that doesn't exist is not found. (covered: integration)
    - As User3:
        - Visit a group URL for a group id that does not exist.
            - **Confirm a not found result.**

#### Top level Groups

##### Public Groups

- [ ] Group Admins **can** see a Public Group exists and read its description. (covered: integration)
- [ ] Group Moderators **can** see a Public Group exists and read its description. (covered: integration)
- [ ] Members **can** see a Public Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members **can** see a Public Group exists and read its description. (covered: integration)
- [ ] Non-members **can** see a Public Group exists and read its description. (covered: integration)
- [ ] Site moderators **can** see a Public Group exists and read its description. (covered: integration)
- [ ] Banned members **cannot** see a Public Group exists and read its description. (covered: integration)

- [ ] Group Admins **can** view the content of a Public Group. (covered: integration)
- [ ] Group Moderators **can** view the content of a Public Group. (covered: integration)
- [ ] Members **can** view the content of a Public Group. (covered: integration)
- [ ] Invited/Requested members **can** view the content of a Public Group. (covered: integration)
- [ ] Non-members **can** view the content of a Public Group. (covered: integration)
- [ ] Site moderators **can** view the content of a Public Group. (covered: integration)
- [ ] Banned members **cannot** view the content of a Public Group. (covered: integration)

##### Private Groups

- [ ] Group Admins **can** see a Private Group exists and read its description. (covered: integration)
- [ ] Group Moderators **can** see a Private Group exists and read its description. (covered: integration)
- [ ] Members **can** see a Private Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members **can** see a Private Group exists and read its description. (covered: integration)
- [ ] Non-members **can** see a Private Group exists and read its description. (covered: integration)
- [ ] Site moderators **can** see a Private Group exists and read its description. (covered: integration)
- [ ] Banned members **cannot** see a Private Group exists and read its description. (covered: integration)

- [ ] Group Admins **can** view the content of a Private Group. (covered: integration)
- [ ] Group Moderators **can** view the content of a Private Group. (covered: integration)
- [ ] Members **can** view the content of a Private Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the content of a Private Group. (covered: integration)
- [ ] Non-members **cannot** view the content of a Private Group. (covered: integration)
- [ ] Site moderators **can** view the content of a Private Group. (covered: integration)
- [ ] Banned members **cannot** view the content of a Private Group. (covered: integration)

##### Hidden Groups

- [ ] Group Admins **can** see a Hidden Group exists and read its description. (covered: integration)
- [ ] Group Moderators **can** see a Hidden Group exists and read its description. (covered: integration)
- [ ] Members **can** see a Hidden Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members **can** see a Hidden Group exists and read its description. (covered: integration)
- [ ] Non-members **cannot** see a Hidden Group exists and read its description. (covered: integration)
- [ ] Site moderators **can** see a Hidden Group exists and read its description. (covered: integration)
- [ ] Banned members **cannot** see a Hidden Group exists and read its description. (covered: integration)

- [ ] Group Admins **can** view the content of a Hidden Group. (covered: integration)
- [ ] Group Moderators **can** view the content of a Hidden Group. (covered: integration)
- [ ] Members **can** view the content of a Hidden Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the content of a Hidden Group. (covered: integration)
- [ ] Non-members **cannot** view the content of a Hidden Group. (covered: integration)
- [ ] Site moderators **can** view the content of a Hidden Group. (covered: integration)
- [ ] Banned members **cannot** view the content of a Hidden Group. (covered: integration)
#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

- [ ] Group Admins **can** see a Public - Public Group exists and read its description. (covered: integration)
- [ ] Group Moderators **can** see a Public - Public Group exists and read its description. (covered: integration)
- [ ] Members **can** see a Public - Public Group exists and read its description. (covered: integration)
- [ ] Parent Group Admins **can** see a Public - Public Group exists and read its description. (covered: integration)
- [ ] Parent Group Moderators **can** see a Public - Public Group exists and read its description. (covered: integration)
- [ ] Parent Group Members **can** see a Public - Public Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members **can** see a Public - Public Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** see a Public - Public Group exists and read its description. (covered: integration)
- [ ] Non-members **can** see a Public - Public Group exists and read its description. (covered: integration)
- [ ] Site moderators **can** see a Public - Public Group exists and read its description. (covered: integration)
- [ ] Banned members **cannot** see a Public - Public Group exists and read its description. (covered: integration)

- [ ] Group Admins **can** view the content of a Public - Public Group. (covered: integration)
- [ ] Group Moderators **can** view the content of a Public - Public Group. (covered: integration)
- [ ] Members **can** view the content of a Public - Public Group. (covered: integration)
- [ ] Parent Group Admins **can** view the content of a Public - Public Group. (covered: integration)
- [ ] Parent Group Moderators **can** view the content of a Public - Public Group. (covered: integration)
- [ ] Parent Group Members **can** view the content of a Public - Public Group. (covered: integration)
- [ ] Invited/Requested members **can** view the content of a Public - Public Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** view the content of a Public - Public Group. (covered: integration)
- [ ] Non-members **can** view the content of a Public - Public Group. (covered: integration)
- [ ] Site moderators **can** view the content of a Public - Public Group. (covered: integration)
- [ ] Banned members **cannot** view the content of a Public - Public Group. (covered: integration)

##### Private Subgroups of Public Groups

- [ ] Group Admins **can** see a Public - Private Group exists and read its description. (covered: integration)
- [ ] Group Moderators **can** see a Public - Private Group exists and read its description. (covered: integration)
- [ ] Members **can** see a Public - Private Group exists and read its description. (covered: integration)
- [ ] Parent Group Admins **can** see a Public - Private Group exists and read its description. (covered: integration)
- [ ] Parent Group Moderators **can** see a Public - Private Group exists and read its description. (covered: integration)
- [ ] Parent Group Members **can** see a Public - Private Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members **can** see a Public - Private Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** see a Public - Private Group exists and read its description. (covered: integration)
- [ ] Non-members **can** see a Public - Private Group exists and read its description. (covered: integration)
- [ ] Site moderators **can** see a Public - Private Group exists and read its description. (covered: integration)
- [ ] Banned members **cannot** see a Public - Private Group exists and read its description. (covered: integration)

- [ ] Group Admins **can** view the content of a Public - Private Group. (covered: integration)
- [ ] Group Moderators **can** view the content of a Public - Private Group. (covered: integration)
- [ ] Members **can** view the content of a Public - Private Group. (covered: integration)
- [ ] Parent Group Admins **can** view the content of a Public - Private Group. (covered: integration)
- [ ] Parent Group Moderators **cannot** view the content of a Public - Private Group. (covered: integration)
- [ ] Parent Group Members **cannot** view the content of a Public - Private Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the content of a Public - Private Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view the content of a Public - Private Group. (covered: integration)
- [ ] Non-members **cannot** view the content of a Public - Private Group. (covered: integration)
- [ ] Site moderators **can** view the content of a Public - Private Group. (covered: integration)
- [ ] Banned members **cannot** view the content of a Public - Private Group. (covered: integration)

##### Hidden Subgroups of Public Groups

- [ ] Group Admins **can** see a Public - Hidden Group exists and read its description. (covered: integration)
- [ ] Group Moderators **can** see a Public - Hidden Group exists and read its description. (covered: integration)
- [ ] Members **can** see a Public - Hidden Group exists and read its description. (covered: integration)
- [ ] Parent Group Admins **can** see a Public - Hidden Group exists and read its description. (covered: integration)
- [ ] Parent Group Moderators **cannot** see a Public - Hidden Group exists and read its description. (covered: integration)
- [ ] Parent Group Members **cannot** see a Public - Hidden Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members **can** see a Public - Hidden Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** see a Public - Hidden Group exists and read its description. (covered: integration)
- [ ] Non-members **cannot** see a Public - Hidden Group exists and read its description. (covered: integration)
- [ ] Site moderators **can** see a Public - Hidden Group exists and read its description. (covered: integration)
- [ ] Banned members **cannot** see a Public - Hidden Group exists and read its description. (covered: integration)

- [ ] Group Admins **can** view the content of a Public - Hidden Group. (covered: integration)
- [ ] Group Moderators **can** view the content of a Public - Hidden Group. (covered: integration)
- [ ] Members **can** view the content of a Public - Hidden Group. (covered: integration)
- [ ] Parent Group Admins **can** view the content of a Public - Hidden Group. (covered: integration)
- [ ] Parent Group Moderators **cannot** view the content of a Public - Hidden Group. (covered: integration)
- [ ] Parent Group Members **cannot** view the content of a Public - Hidden Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the content of a Public - Hidden Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view the content of a Public - Hidden Group. (covered: integration)
- [ ] Non-members **cannot** view the content of a Public - Hidden Group. (covered: integration)
- [ ] Site moderators **can** view the content of a Public - Hidden Group. (covered: integration)
- [ ] Banned members **cannot** view the content of a Public - Hidden Group. (covered: integration)

#### Subgroups of Private Groups

##### Open Subgroups of Private Groups

- [ ] Group Admins **can** see a Private - Open Group exists and read its description. (covered: integration)
- [ ] Group Moderators **can** see a Private - Open Group exists and read its description. (covered: integration)
- [ ] Members **can** see a Private - Open Group exists and read its description. (covered: integration)
- [ ] Parent Group Admins **can** see a Private - Open Group exists and read its description. (covered: integration)
- [ ] Parent Group Moderators **can** see a Private - Open Group exists and read its description. (covered: integration)
- [ ] Parent Group Members **can** see a Private - Open Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members **can** see a Private - Open Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** see a Private - Open Group exists and read its description. (covered: integration)
- [ ] Non-members **can** see a Private - Open Group exists and read its description. (covered: integration)
- [ ] Site moderators **can** see a Private - Open Group exists and read its description. (covered: integration)
- [ ] Banned members **cannot** see a Private - Open Group exists and read its description. (covered: integration)

- [ ] Group Admins **can** view the content of a Private - Open Group. (covered: integration)
- [ ] Group Moderators **can** view the content of a Private - Open Group. (covered: integration)
- [ ] Members **can** view the content of a Private - Open Group. (covered: integration)
- [ ] Parent Group Admins **can** view the content of a Private - Open Group. (covered: integration)
- [ ] Parent Group Moderators **can** view the content of a Private - Open Group. (covered: integration)
- [ ] Parent Group Members **can** view the content of a Private - Open Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the content of a Private - Open Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** view the content of a Private - Open Group. (covered: integration)
- [ ] Non-members **cannot** view the content of a Private - Open Group. (covered: integration)
- [ ] Site moderators **can** view the content of a Private - Open Group. (covered: integration)
- [ ] Banned members **cannot** view the content of a Private - Open Group. (covered: integration)

##### Private Subgroups of Private Groups

- [ ] Group Admins **can** see a Private - Private Group exists and read its description. (covered: integration)
- [ ] Group Moderators **can** see a Private - Private Group exists and read its description. (covered: integration)
- [ ] Members **can** see a Private - Private Group exists and read its description. (covered: integration)
- [ ] Parent Group Admins **can** see a Private - Private Group exists and read its description. (covered: integration)
- [ ] Parent Group Moderators **can** see a Private - Private Group exists and read its description. (covered: integration)
- [ ] Parent Group Members **can** see a Private - Private Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members **can** see a Private - Private Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** see a Private - Private Group exists and read its description. (covered: integration)
- [ ] Non-members **can** see a Private - Private Group exists and read its description. (covered: integration)
- [ ] Site moderators **can** see a Private - Private Group exists and read its description. (covered: integration)
- [ ] Banned members **cannot** see a Private - Private Group exists and read its description. (covered: integration)

- [ ] Group Admins **can** view the content of a Private - Private Group. (covered: integration)
- [ ] Group Moderators **can** view the content of a Private - Private Group. (covered: integration)
- [ ] Members **can** view the content of a Private - Private Group. (covered: integration)
- [ ] Parent Group Admins **can** view the content of a Private - Private Group. (covered: integration)
- [ ] Parent Group Moderators **cannot** view the content of a Private - Private Group. (covered: integration)
- [ ] Parent Group Members **cannot** view the content of a Private - Private Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the content of a Private - Private Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view the content of a Private - Private Group. (covered: integration)
- [ ] Non-members **cannot** view the content of a Private - Private Group. (covered: integration)
- [ ] Site moderators **can** view the content of a Private - Private Group. (covered: integration)
- [ ] Banned members **cannot** view the content of a Private - Private Group. (covered: integration)

##### Hidden Subgroups of Private Groups

- [ ] Group Admins **can** see a Private - Hidden Group exists and read its description. (covered: integration)
- [ ] Group Moderators **can** see a Private - Hidden Group exists and read its description. (covered: integration)
- [ ] Members **can** see a Private - Hidden Group exists and read its description. (covered: integration)
- [ ] Parent Group Admins **can** see a Private - Hidden Group exists and read its description. (covered: integration)
- [ ] Parent Group Moderators **cannot** see a Private - Hidden Group exists and read its description. (covered: integration)
- [ ] Parent Group Members **cannot** see a Private - Hidden Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members **can** see a Private - Hidden Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** see a Private - Hidden Group exists and read its description. (covered: integration)
- [ ] Non-members **cannot** see a Private - Hidden Group exists and read its description. (covered: integration)
- [ ] Site moderators **can** see a Private - Hidden Group exists and read its description. (covered: integration)
- [ ] Banned members **cannot** see a Private - Hidden Group exists and read its description. (covered: integration)

- [ ] Group Admins **can** view the content of a Private - Hidden Group. (covered: integration)
- [ ] Group Moderators **can** view the content of a Private - Hidden Group. (covered: integration)
- [ ] Members **can** view the content of a Private - Hidden Group. (covered: integration)
- [ ] Parent Group Admins **can** view the content of a Private - Hidden Group. (covered: integration)
- [ ] Parent Group Moderators **cannot** view the content of a Private - Hidden Group. (covered: integration)
- [ ] Parent Group Members **cannot** view the content of a Private - Hidden Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the content of a Private - Hidden Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view the content of a Private - Hidden Group. (covered: integration)
- [ ] Non-members **cannot** view the content of a Private - Hidden Group. (covered: integration)
- [ ] Site moderators **can** view the content of a Private - Hidden Group. (covered: integration)
- [ ] Banned members **cannot** view the content of a Private - Hidden Group. (covered: integration)

#### Subgroups of Hidden Groups

##### Open Subgroups of Hidden Groups

- [ ] Group Admins **can** see a Hidden - Open Group exists and read its description. (covered: integration)
- [ ] Group Moderators **can** see a Hidden - Open Group exists and read its description. (covered: integration)
- [ ] Members **can** see a Hidden - Open Group exists and read its description. (covered: integration)
- [ ] Parent Group Admins **can** see a Hidden - Open Group exists and read its description. (covered: integration)
- [ ] Parent Group Moderators **can** see a Hidden - Open Group exists and read its description. (covered: integration)
- [ ] Parent Group Members **can** see a Hidden - Open Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members **can** see a Hidden - Open Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** see a Hidden - Open Group exists and read its description. (covered: integration)
- [ ] Non-members **cannot** see a Hidden - Open Group exists and read its description. (covered: integration)
- [ ] Site moderators **can** see a Hidden - Open Group exists and read its description. (covered: integration)
- [ ] Banned members **cannot** see a Hidden - Open Group exists and read its description. (covered: integration)

- [ ] Group Admins **can** view the content of a Hidden - Open Group. (covered: integration)
- [ ] Group Moderators **can** view the content of a Hidden - Open Group. (covered: integration)
- [ ] Members **can** view the content of a Hidden - Open Group. (covered: integration)
- [ ] Parent Group Admins **can** view the content of a Hidden - Open Group. (covered: integration)
- [ ] Parent Group Moderators **can** view the content of a Hidden - Open Group. (covered: integration)
- [ ] Parent Group Members **can** view the content of a Hidden - Open Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the content of a Hidden - Open Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** view the content of a Hidden - Open Group. (covered: integration)
- [ ] Non-members **cannot** view the content of a Hidden - Open Group. (covered: integration)
- [ ] Site moderators **can** view the content of a Hidden - Open Group. (covered: integration)
- [ ] Banned members **cannot** view the content of a Hidden - Open Group. (covered: integration)

##### Private Subgroups of Hidden Groups

- [ ] Group Admins **can** see a Hidden - Private Group exists and read its description. (covered: integration)
- [ ] Group Moderators **can** see a Hidden - Private Group exists and read its description. (covered: integration)
- [ ] Members **can** see a Hidden - Private Group exists and read its description. (covered: integration)
- [ ] Parent Group Admins **can** see a Hidden - Private Group exists and read its description. (covered: integration)
- [ ] Parent Group Moderators **can** see a Hidden - Private Group exists and read its description. (covered: integration)
- [ ] Parent Group Members **can** see a Hidden - Private Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members **can** see a Hidden - Private Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** see a Hidden - Private Group exists and read its description. (covered: integration)
- [ ] Non-members **cannot** see a Hidden - Private Group exists and read its description. (covered: integration)
- [ ] Site moderators **can** see a Hidden - Private Group exists and read its description. (covered: integration)
- [ ] Banned members **cannot** see a Hidden - Private Group exists and read its description. (covered: integration)

- [ ] Group Admins **can** view the content of a Hidden - Private Group. (covered: integration)
- [ ] Group Moderators **can** view the content of a Hidden - Private Group. (covered: integration)
- [ ] Members **can** view the content of a Hidden - Private Group. (covered: integration)
- [ ] Parent Group Admins **can** view the content of a Hidden - Private Group. (covered: integration)
- [ ] Parent Group Moderators **cannot** view the content of a Hidden - Private Group. (covered: integration)
- [ ] Parent Group Members **cannot** view the content of a Hidden - Private Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the content of a Hidden - Private Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view the content of a Hidden - Private Group. (covered: integration)
- [ ] Non-members **cannot** view the content of a Hidden - Private Group. (covered: integration)
- [ ] Site moderators **can** view the content of a Hidden - Private Group. (covered: integration)
- [ ] Banned members **cannot** view the content of a Hidden - Private Group. (covered: integration)

##### Hidden Subgroups of Hidden Groups

- [ ] Group Admins **can** see a Hidden - Hidden Group exists and read its description. (covered: integration)
- [ ] Group Moderators **can** see a Hidden - Hidden Group exists and read its description. (covered: integration)
- [ ] Members **can** see a Hidden - Hidden Group exists and read its description. (covered: integration)
- [ ] Parent Group Admins **can** see a Hidden - Hidden Group exists and read its description. (covered: integration)
- [ ] Parent Group Moderators **cannot** see a Hidden - Hidden Group exists and read its description. (covered: integration)
- [ ] Parent Group Members **cannot** see a Hidden - Hidden Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members **can** see a Hidden - Hidden Group exists and read its description. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** see a Hidden - Hidden Group exists and read its description. (covered: integration)
- [ ] Non-members **cannot** see a Hidden - Hidden Group exists and read its description. (covered: integration)
- [ ] Site moderators **can** see a Hidden - Hidden Group exists and read its description. (covered: integration)
- [ ] Banned members **cannot** see a Hidden - Hidden Group exists and read its description. (covered: integration)

- [ ] Group Admins **can** view the content of a Hidden - Hidden Group. (covered: integration)
- [ ] Group Moderators **can** view the content of a Hidden - Hidden Group. (covered: integration)
- [ ] Members **can** view the content of a Hidden - Hidden Group. (covered: integration)
- [ ] Parent Group Admins **can** view the content of a Hidden - Hidden Group. (covered: integration)
- [ ] Parent Group Moderators **cannot** view the content of a Hidden - Hidden Group. (covered: integration)
- [ ] Parent Group Members **cannot** view the content of a Hidden - Hidden Group. (covered: integration)
- [ ] Invited/Requested members **cannot** view the content of a Hidden - Hidden Group. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view the content of a Hidden - Hidden Group. (covered: integration)
- [ ] Non-members **cannot** view the content of a Hidden - Hidden Group. (covered: integration)
- [ ] Site moderators **can** view the content of a Hidden - Hidden Group. (covered: integration)
- [ ] Banned members **cannot** view the content of a Hidden - Hidden Group. (covered: integration)

