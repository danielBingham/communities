## [Create GroupModeration](documentation/testing/test-cases/GroupModeration/create.md)

Cases covering GroupModeration creation.  Who can flag the posts in a group for group moderators?

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, and a Private Group, Private Group, have
      been created.

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created, added as a member of each group, and has made
      posts in each.
- [ ] User7 has been created and is a non-member of all groups.

#### Cases

- [ ] As a user, I can flag a post for the group's moderators.
    - As User7:
        - Visit Public Group and flag one of User3's posts.
            - **Confirm the flag is accepted and a confirmation is shown.**
    - As User2, a group moderator:
        - Open Public Group -> Moderation.
            - **Confirm the flagged post is listed with its reason.**

- [ ] As a user, I cannot flag a post I cannot see.
    - As User7:
        - Visit Private Group.
            - **Confirm the group's posts are not visible and no flag control is offered.**

#### Top level Groups

##### Public Groups

- [ ] Non-members **can** flag posts.
- [ ] Members **can** flag posts.
- [ ] Group Moderators **can** flag posts.
- [ ] Group Admins **can** flag posts.

##### Private Groups

- [ ] Non-members **cannot** flag posts.
- [ ] Members **can** flag posts.
- [ ] Group Moderators **can** flag posts.
- [ ] Group Admins **can** flag posts.

##### Hidden Groups

- [ ] Non-members **cannot** flag posts.
- [ ] Members **can** flag posts.
- [ ] Group Moderators **can** flag posts.
- [ ] Group Admins **can** flag posts.

### Manual Regression

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

- [ ] Every group and subgroup contains posts that can be flagged.

- [ ] User1 has been created and added as an admin of each group and subgroup.
- [ ] User2 has been created and added as a moderator of each group and subgroup.
- [ ] User3 has been created and added as a member of each group and subgroup.
- [ ] User4 has been created and added as an admin only of the top level groups.
- [ ] User6 has been created and added as a member only of the top level groups.
- [ ] User7 has been created and is a non-member of all groups.

#### Cases

- [ ] As a user, flagging a post asks me for a reason.
    - As User7:
        - Flag a post in Public Group.
            - **Confirm a reason is requested before the flag is submitted.**
        - Cancel the prompt.
            - **Confirm no flag is recorded.**

- [ ] As a user, I cannot flag the same post twice.
    - As User7:
        - Flag a post in Public Group, then attempt to flag it again.
            - **Confirm the second flag is refused or the control is disabled.**

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

- [ ] Non-members **can** flag posts.
- [ ] Parent Group Members **can** flag posts.
- [ ] Parent Group Admins **can** flag posts.
- [ ] Members **can** flag posts.
- [ ] Group Moderators **can** flag posts.
- [ ] Group Admins **can** flag posts.

##### Private Subgroups of Public Groups

- [ ] Non-members **cannot** flag posts.
- [ ] Parent Group Members **cannot** flag posts.
- [ ] Parent Group Admins **cannot** flag posts.
- [ ] Members **can** flag posts.
- [ ] Group Moderators **can** flag posts.
- [ ] Group Admins **can** flag posts.

##### Hidden Subgroups of Public Groups

- [ ] Non-members **cannot** flag posts.
- [ ] Parent Group Members **cannot** flag posts.
- [ ] Parent Group Admins **cannot** flag posts.
- [ ] Members **can** flag posts.
- [ ] Group Moderators **can** flag posts.
- [ ] Group Admins **can** flag posts.

#### Subgroups of Private Groups

##### Open Subgroups of Private Groups

- [ ] Non-members **cannot** flag posts.
- [ ] Parent Group Members **can** flag posts.
- [ ] Parent Group Admins **can** flag posts.
- [ ] Members **can** flag posts.
- [ ] Group Moderators **can** flag posts.
- [ ] Group Admins **can** flag posts.

##### Private Subgroups of Private Groups

- [ ] Non-members **cannot** flag posts.
- [ ] Parent Group Members **cannot** flag posts.
- [ ] Parent Group Admins **cannot** flag posts.
- [ ] Members **can** flag posts.
- [ ] Group Moderators **can** flag posts.
- [ ] Group Admins **can** flag posts.

##### Hidden Subgroups of Private Groups

- [ ] Non-members **cannot** flag posts.
- [ ] Parent Group Members **cannot** flag posts.
- [ ] Parent Group Admins **cannot** flag posts.
- [ ] Members **can** flag posts.
- [ ] Group Moderators **can** flag posts.
- [ ] Group Admins **can** flag posts.

#### Subgroups of Hidden Groups

##### Open Subgroups of Hidden Groups

- [ ] Non-members **cannot** flag posts.
- [ ] Parent Group Members **can** flag posts.
- [ ] Parent Group Admins **can** flag posts.
- [ ] Members **can** flag posts.
- [ ] Group Moderators **can** flag posts.
- [ ] Group Admins **can** flag posts.

##### Private Subgroups of Hidden Groups

- [ ] Non-members **cannot** flag posts.
- [ ] Parent Group Members **cannot** flag posts.
- [ ] Parent Group Admins **cannot** flag posts.
- [ ] Members **can** flag posts.
- [ ] Group Moderators **can** flag posts.
- [ ] Group Admins **can** flag posts.

##### Hidden Subgroups of Hidden Groups

- [ ] Non-members **cannot** flag posts.
- [ ] Parent Group Members **cannot** flag posts.
- [ ] Parent Group Admins **cannot** flag posts.
- [ ] Members **can** flag posts.
- [ ] Group Moderators **can** flag posts.
- [ ] Group Admins **can** flag posts.

### Full Regression

#### Pre-requisites

None.

The group moderation endpoints are not yet covered by the Integration suite.
All group moderation cases are defined in the Smoke Test and Manual Regression
sections above.
