## [Read GroupModeration](documentation/testing/test-cases/GroupModeration/read.md)

Cases covering GroupModeration reading.  Who can see the moderation status of the posts in a group?

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] A Private Group, Private Group, has been created.
- [ ] A Hidden Group, Hidden Group, has been created.

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created, added as a member of each group, and has made
      posts in each.
- [ ] User7 has been created and is a non-member of all groups.
- [ ] At least one post in each group has been flagged and moderated.

#### Cases

- [ ] As a user, I can see when a post I can view has been moderated.
    - As User2, a group moderator:
        - Reject a flagged post in Public Group.
    - As User7:
        - Visit Public Group.
            - **Confirm the rejected post is shown as removed by moderators rather than silently missing.**

- [ ] As a post author, I can see the moderation status of my own post.
    - As User3:
        - Have a post in Public Group rejected by a moderator.
        - Visit the post.
            - **Confirm the moderation status and reason are shown to you.**

#### Top level Groups

##### Public Groups

- [ ] Non-members **can** see the moderation status of posts.
- [ ] Members **can** see the moderation status of posts.
- [ ] Group Moderators **can** see the moderation status of posts.
- [ ] Group Admins **can** see the moderation status of posts.

##### Private Groups

- [ ] Non-members **cannot** see the moderation status of posts.
- [ ] Members **can** see the moderation status of posts.
- [ ] Group Moderators **can** see the moderation status of posts.
- [ ] Group Admins **can** see the moderation status of posts.

##### Hidden Groups

- [ ] Non-members **cannot** see the moderation status of posts.
- [ ] Members **can** see the moderation status of posts.
- [ ] Group Moderators **can** see the moderation status of posts.
- [ ] Group Admins **can** see the moderation status of posts.

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

- [ ] Every group and subgroup contains posts, some flagged and some already
      approved or rejected.

- [ ] User1 has been created and added as an admin of each group and subgroup.
- [ ] User2 has been created and added as a moderator of each group and subgroup.
- [ ] User3 has been created and added as a member of each group and subgroup.
- [ ] User4 has been created and added as an admin only of the top level groups.
- [ ] User6 has been created and added as a member only of the top level groups.
- [ ] User7 has been created and is a non-member of all groups.

#### Cases

- [ ] As a group moderator, the moderation queue shows the status of each flagged post.
    - As User2:
        - Open Public Group -> Moderation.
            - **Confirm pending, approved and rejected posts are distinguishable.**
            - **Confirm each entry shows who flagged it and why.**

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

- [ ] Non-members **can** see the moderation status of posts.
- [ ] Parent Group Members **can** see the moderation status of posts.
- [ ] Parent Group Admins **can** see the moderation status of posts.
- [ ] Members **can** see the moderation status of posts.
- [ ] Group Moderators **can** see the moderation status of posts.
- [ ] Group Admins **can** see the moderation status of posts.

##### Private Subgroups of Public Groups

- [ ] Non-members **cannot** see the moderation status of posts.
- [ ] Parent Group Members **cannot** see the moderation status of posts.
- [ ] Parent Group Admins **cannot** see the moderation status of posts.
- [ ] Members **can** see the moderation status of posts.
- [ ] Group Moderators **can** see the moderation status of posts.
- [ ] Group Admins **can** see the moderation status of posts.

##### Hidden Subgroups of Public Groups

- [ ] Non-members **cannot** see the moderation status of posts.
- [ ] Parent Group Members **cannot** see the moderation status of posts.
- [ ] Parent Group Admins **cannot** see the moderation status of posts.
- [ ] Members **can** see the moderation status of posts.
- [ ] Group Moderators **can** see the moderation status of posts.
- [ ] Group Admins **can** see the moderation status of posts.

#### Subgroups of Private Groups

##### Open Subgroups of Private Groups

- [ ] Non-members **cannot** see the moderation status of posts.
- [ ] Parent Group Members **can** see the moderation status of posts.
- [ ] Parent Group Admins **can** see the moderation status of posts.
- [ ] Members **can** see the moderation status of posts.
- [ ] Group Moderators **can** see the moderation status of posts.
- [ ] Group Admins **can** see the moderation status of posts.

##### Private Subgroups of Private Groups

- [ ] Non-members **cannot** see the moderation status of posts.
- [ ] Parent Group Members **cannot** see the moderation status of posts.
- [ ] Parent Group Admins **cannot** see the moderation status of posts.
- [ ] Members **can** see the moderation status of posts.
- [ ] Group Moderators **can** see the moderation status of posts.
- [ ] Group Admins **can** see the moderation status of posts.

##### Hidden Subgroups of Private Groups

- [ ] Non-members **cannot** see the moderation status of posts.
- [ ] Parent Group Members **cannot** see the moderation status of posts.
- [ ] Parent Group Admins **cannot** see the moderation status of posts.
- [ ] Members **can** see the moderation status of posts.
- [ ] Group Moderators **can** see the moderation status of posts.
- [ ] Group Admins **can** see the moderation status of posts.

#### Subgroups of Hidden Groups

##### Open Subgroups of Hidden Groups

- [ ] Non-members **cannot** see the moderation status of posts.
- [ ] Parent Group Members **can** see the moderation status of posts.
- [ ] Parent Group Admins **can** see the moderation status of posts.
- [ ] Members **can** see the moderation status of posts.
- [ ] Group Moderators **can** see the moderation status of posts.
- [ ] Group Admins **can** see the moderation status of posts.

##### Private Subgroups of Hidden Groups

- [ ] Non-members **cannot** see the moderation status of posts.
- [ ] Parent Group Members **cannot** see the moderation status of posts.
- [ ] Parent Group Admins **cannot** see the moderation status of posts.
- [ ] Members **can** see the moderation status of posts.
- [ ] Group Moderators **can** see the moderation status of posts.
- [ ] Group Admins **can** see the moderation status of posts.

##### Hidden Subgroups of Hidden Groups

- [ ] Non-members **cannot** see the moderation status of posts.
- [ ] Parent Group Members **cannot** see the moderation status of posts.
- [ ] Parent Group Admins **cannot** see the moderation status of posts.
- [ ] Members **can** see the moderation status of posts.
- [ ] Group Moderators **can** see the moderation status of posts.
- [ ] Group Admins **can** see the moderation status of posts.

### Full Regression

#### Pre-requisites

None.

The group moderation endpoints are not yet covered by the Integration suite.
All group moderation cases are defined in the Smoke Test and Manual Regression
sections above.
