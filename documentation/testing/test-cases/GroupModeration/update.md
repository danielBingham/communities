## [Update GroupModeration](documentation/testing/test-cases/GroupModeration/update.md)

Cases covering GroupModeration updating.  Who can moderate the posts in a group?

### Pre-requisites

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

### Smoke Test

- [ ] As a group moderator, I can approve and reject flagged posts.
    - As User7:
        - Flag a post in Public Group.
    - As User2, a group moderator:
        - Open Public Group -> Moderation and reject the flagged post.
            - **Confirm the post is removed from the group.**
        - Flag and then approve a second post.
            - **Confirm the post remains visible in the group.**

- [ ] As a plain member, I cannot moderate posts.
    - As User3:
        - Visit Public Group.
            - **Confirm no Moderation section is offered.**
        - Open another member's post.
            - **Confirm no approve or reject controls are offered.**

#### Top level Groups

##### Public Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators **can** moderate posts.
- [ ] Group Admins **can** moderate posts.

##### Private Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators **can** moderate posts.
- [ ] Group Admins **can** moderate posts.

##### Hidden Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators **can** moderate posts.
- [ ] Group Admins **can** moderate posts.

### Manual Regression

- [ ] As a group moderator, moderating a post asks me for a reason.
    - As User2:
        - Reject a flagged post in Public Group.
            - **Confirm a reason can be supplied.**
    - As User3, the post's author:
        - **Confirm a notification of the moderation decision is received.**
        - Open the post.
            - **Confirm the reason is shown.**

- [ ] As a group moderator, I can reverse a moderation decision.
    - As User2:
        - Reject a flagged post in Public Group, then approve it.
            - **Confirm the post returns to the group.**

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Parent Group Members **cannot** moderate posts.
- [ ] Parent Group Admins **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators **can** moderate posts.
- [ ] Group Admins **can** moderate posts.

##### Private Subgroups of Public Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Parent Group Members **cannot** moderate posts.
- [ ] Parent Group Admins **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators **can** moderate posts.
- [ ] Group Admins **can** moderate posts.

##### Hidden Subgroups of Public Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Parent Group Members **cannot** moderate posts.
- [ ] Parent Group Admins **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators **can** moderate posts.
- [ ] Group Admins **can** moderate posts.

#### Subgroups of Private Groups

##### Open Subgroups of Private Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Parent Group Members **cannot** moderate posts.
- [ ] Parent Group Admins **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators **can** moderate posts.
- [ ] Group Admins **can** moderate posts.

##### Private Subgroups of Private Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Parent Group Members **cannot** moderate posts.
- [ ] Parent Group Admins **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators **can** moderate posts.
- [ ] Group Admins **can** moderate posts.

##### Hidden Subgroups of Private Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Parent Group Members **cannot** moderate posts.
- [ ] Parent Group Admins **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators **can** moderate posts.
- [ ] Group Admins **can** moderate posts.

#### Subgroups of Hidden Groups

##### Open Subgroups of Hidden Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Parent Group Members **cannot** moderate posts.
- [ ] Parent Group Admins **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators **can** moderate posts.
- [ ] Group Admins **can** moderate posts.

##### Private Subgroups of Hidden Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Parent Group Members **cannot** moderate posts.
- [ ] Parent Group Admins **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators **can** moderate posts.
- [ ] Group Admins **can** moderate posts.

##### Hidden Subgroups of Hidden Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Parent Group Members **cannot** moderate posts.
- [ ] Parent Group Admins **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators **can** moderate posts.
- [ ] Group Admins **can** moderate posts.

### Full Regression

The group moderation endpoints are not yet covered by the Integration suite.
All group moderation cases are defined in the Smoke Test and Manual Regression
sections above.
