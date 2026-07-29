## [Read GroupPost](documentation/testing/test-cases/GroupPost/read.md)

Cases covering GroupPost reading.  Who can view the posts in a group?

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

- [ ] As a non-member, I can read the posts of a Public Group only.
    - As User7:
        - Visit Public Group.
            - **Confirm the group's posts are visible.**
        - Visit Private Group.
            - **Confirm the group's posts are *not* visible.**
        - Visit Hidden Group.
            - **Confirm the group is not visible at all.**

- [ ] As a member, I can read the posts of every group I belong to.
    - As User3:
        - Visit Public Group, Private Group and Hidden Group in turn.
            - **Confirm the posts are visible in each.**
        - Open a post permalink from Private Group.
            - **Confirm the post view loads.**

- [ ] A banned member **cannot** view the posts of the group they were banned from. (covered: integration)

### Manual Regression

#### Pre-requisites

- [ ] A Public Group, Public Group, and a Private Group, Private Group, have
      been created, each containing posts.
- [ ] User3 has been created and added as a member of both groups.
- [ ] User7 has been created and is a non-member of both groups.

#### Cases

- [ ] As a user, a group post I cannot see is not reachable by permalink.
    - As User3:
        - Copy the permalink of a post in Private Group.
    - As User7:
        - Open the permalink.
            - **Confirm a not found page renders.**

- [ ] As a member, group posts appear in my feed.
    - As User3:
        - Note a recent post in Public Group.
        - Go to your feed.
            - **Confirm the group post appears, attributed to the group.**
        - Leave the group and reload your feed.
            - **Confirm the group's posts no longer appear.**

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

- [ ] As an unauthenticated visitor, I cannot read a group post. (covered: integration)
    - As unauthenticated user:
        - Attempt to open a post permalink from Public Group.
            - **Confirm the request is refused.**

- [ ] As the author, I can always view my own group post. (covered: integration)
    - As User3:
        - Create a post in Private Group and open it.
            - **Confirm the post is returned.**

- [ ] As a user, the group post list matches what I can read individually. (covered: integration)
    - As User3:
        - Page through a group's posts.
            - **Confirm every post shown can also be opened by permalink.**
            - **Confirm no post that cannot be opened by permalink appears in the list.**

#### Top level Groups

##### Public Groups

- [ ] Group Admins **can** view posts. (covered: integration)
- [ ] Group Moderators **can** view posts. (covered: integration)
- [ ] Members **can** view posts. (covered: integration)
- [ ] Invited/Requested members **can** view posts. (covered: integration)
- [ ] Non-members **can** view posts. (covered: integration)
- [ ] Site moderators **can** view posts. (covered: integration)
- [ ] Banned members **cannot** view posts. (covered: integration)

##### Private Groups

- [ ] Group Admins **can** view posts. (covered: integration)
- [ ] Group Moderators **can** view posts. (covered: integration)
- [ ] Members **can** view posts. (covered: integration)
- [ ] Invited/Requested members **cannot** view posts. (covered: integration)
- [ ] Non-members **cannot** view posts. (covered: integration)
- [ ] Site moderators **can** view posts. (covered: integration)
- [ ] Banned members **cannot** view posts. (covered: integration)

##### Hidden Groups

- [ ] Group Admins **can** view posts. (covered: integration)
- [ ] Group Moderators **can** view posts. (covered: integration)
- [ ] Members **can** view posts. (covered: integration)
- [ ] Invited/Requested members **cannot** view posts. (covered: integration)
- [ ] Non-members **cannot** view posts. (covered: integration)
- [ ] Site moderators **can** view posts. (covered: integration)
- [ ] Banned members **cannot** view posts. (covered: integration)

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

- [ ] Group Admins **can** view posts. (covered: integration)
- [ ] Group Moderators **can** view posts. (covered: integration)
- [ ] Members **can** view posts. (covered: integration)
- [ ] Parent Group Admins **can** view posts. (covered: integration)
- [ ] Parent Group Moderators **can** view posts. (covered: integration)
- [ ] Parent Group Members **can** view posts. (covered: integration)
- [ ] Invited/Requested members **can** view posts. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** view posts. (covered: integration)
- [ ] Non-members **can** view posts. (covered: integration)
- [ ] Site moderators **can** view posts. (covered: integration)
- [ ] Banned members **cannot** view posts. (covered: integration)

##### Private Subgroups of Public Groups

- [ ] Group Admins **can** view posts. (covered: integration)
- [ ] Group Moderators **can** view posts. (covered: integration)
- [ ] Members **can** view posts. (covered: integration)
- [ ] Parent Group Admins **can** view posts. (covered: integration)
- [ ] Parent Group Moderators **cannot** view posts. (covered: integration)
- [ ] Parent Group Members **cannot** view posts. (covered: integration)
- [ ] Invited/Requested members **cannot** view posts. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view posts. (covered: integration)
- [ ] Non-members **cannot** view posts. (covered: integration)
- [ ] Site moderators **can** view posts. (covered: integration)
- [ ] Banned members **cannot** view posts. (covered: integration)

##### Hidden Subgroups of Public Groups

- [ ] Group Admins **can** view posts. (covered: integration)
- [ ] Group Moderators **can** view posts. (covered: integration)
- [ ] Members **can** view posts. (covered: integration)
- [ ] Parent Group Admins **can** view posts. (covered: integration)
- [ ] Parent Group Moderators **cannot** view posts. (covered: integration)
- [ ] Parent Group Members **cannot** view posts. (covered: integration)
- [ ] Invited/Requested members **cannot** view posts. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view posts. (covered: integration)
- [ ] Non-members **cannot** view posts. (covered: integration)
- [ ] Site moderators **can** view posts. (covered: integration)
- [ ] Banned members **cannot** view posts. (covered: integration)

#### Subgroups of Private Groups

##### Open Subgroups of Private Groups

- [ ] Group Admins **can** view posts. (covered: integration)
- [ ] Group Moderators **can** view posts. (covered: integration)
- [ ] Members **can** view posts. (covered: integration)
- [ ] Parent Group Admins **can** view posts. (covered: integration)
- [ ] Parent Group Moderators **can** view posts. (covered: integration)
- [ ] Parent Group Members **can** view posts. (covered: integration)
- [ ] Invited/Requested members **cannot** view posts. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** view posts. (covered: integration)
- [ ] Non-members **cannot** view posts. (covered: integration)
- [ ] Site moderators **can** view posts. (covered: integration)
- [ ] Banned members **cannot** view posts. (covered: integration)

##### Private Subgroups of Private Groups

- [ ] Group Admins **can** view posts. (covered: integration)
- [ ] Group Moderators **can** view posts. (covered: integration)
- [ ] Members **can** view posts. (covered: integration)
- [ ] Parent Group Admins **can** view posts. (covered: integration)
- [ ] Parent Group Moderators **cannot** view posts. (covered: integration)
- [ ] Parent Group Members **cannot** view posts. (covered: integration)
- [ ] Invited/Requested members **cannot** view posts. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view posts. (covered: integration)
- [ ] Non-members **cannot** view posts. (covered: integration)
- [ ] Site moderators **can** view posts. (covered: integration)
- [ ] Banned members **cannot** view posts. (covered: integration)

##### Hidden Subgroups of Private Groups

- [ ] Group Admins **can** view posts. (covered: integration)
- [ ] Group Moderators **can** view posts. (covered: integration)
- [ ] Members **can** view posts. (covered: integration)
- [ ] Parent Group Admins **can** view posts. (covered: integration)
- [ ] Parent Group Moderators **cannot** view posts. (covered: integration)
- [ ] Parent Group Members **cannot** view posts. (covered: integration)
- [ ] Invited/Requested members **cannot** view posts. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view posts. (covered: integration)
- [ ] Non-members **cannot** view posts. (covered: integration)
- [ ] Site moderators **can** view posts. (covered: integration)
- [ ] Banned members **cannot** view posts. (covered: integration)

#### Subgroups of Hidden Groups

##### Open Subgroups of Hidden Groups

- [ ] Group Admins **can** view posts. (covered: integration)
- [ ] Group Moderators **can** view posts. (covered: integration)
- [ ] Members **can** view posts. (covered: integration)
- [ ] Parent Group Admins **can** view posts. (covered: integration)
- [ ] Parent Group Moderators **can** view posts. (covered: integration)
- [ ] Parent Group Members **can** view posts. (covered: integration)
- [ ] Invited/Requested members **cannot** view posts. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **can** view posts. (covered: integration)
- [ ] Non-members **cannot** view posts. (covered: integration)
- [ ] Site moderators **can** view posts. (covered: integration)
- [ ] Banned members **cannot** view posts. (covered: integration)

##### Private Subgroups of Hidden Groups

- [ ] Group Admins **can** view posts. (covered: integration)
- [ ] Group Moderators **can** view posts. (covered: integration)
- [ ] Members **can** view posts. (covered: integration)
- [ ] Parent Group Admins **can** view posts. (covered: integration)
- [ ] Parent Group Moderators **cannot** view posts. (covered: integration)
- [ ] Parent Group Members **cannot** view posts. (covered: integration)
- [ ] Invited/Requested members **cannot** view posts. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view posts. (covered: integration)
- [ ] Non-members **cannot** view posts. (covered: integration)
- [ ] Site moderators **can** view posts. (covered: integration)
- [ ] Banned members **cannot** view posts. (covered: integration)

##### Hidden Subgroups of Hidden Groups

- [ ] Group Admins **can** view posts. (covered: integration)
- [ ] Group Moderators **can** view posts. (covered: integration)
- [ ] Members **can** view posts. (covered: integration)
- [ ] Parent Group Admins **can** view posts. (covered: integration)
- [ ] Parent Group Moderators **cannot** view posts. (covered: integration)
- [ ] Parent Group Members **cannot** view posts. (covered: integration)
- [ ] Invited/Requested members **cannot** view posts. (covered: integration)
- [ ] Invited/Requested members who are Parent Group Members **cannot** view posts. (covered: integration)
- [ ] Non-members **cannot** view posts. (covered: integration)
- [ ] Site moderators **can** view posts. (covered: integration)
- [ ] Banned members **cannot** view posts. (covered: integration)
