## [Create GroupPost](documentation/testing/test-cases/GroupPost/create.md)

Cases covering GroupPost creation.  Who can post into a group, under each of
the group's Posting Permissions settings?

The composition of a post (text, images, video, links, mentions, drafts) is
covered in [Create Post](documentation/testing/test-cases/Post/create.md).

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] User1 has been created and added as an admin of Public Group.
- [ ] User2 has been created and added as a moderator of Public Group.
- [ ] User3 has been created and added as a member of Public Group.
- [ ] User7 has been created and is a non-member of Public Group.
- [ ] User9 has been created and has been banned from Public Group.
- [ ] Public Group's Posting Permissions can be switched between 'Anyone',
      'Members', 'Requires Approval' and 'Restricted' during testing.

#### Cases

- [ ] As a member, I can post into a group and the post appears to other members.
    - As User3:
        - Visit Public Group and create a post.
            - **Confirm the post is created and appears in the group.**
    - As User7, a non-member:
        - Visit Public Group.
            - **Confirm User3's post is visible.**

- [ ] As a group admin, Posting Permissions control who may post.
    - As User1:
        - Set Public Group's Posting Permissions to 'Members'.
    - As User7, a non-member:
        - Attempt to post into Public Group.
            - **Confirm posting is not offered and the request is refused.**
    - As User1:
        - Set Posting Permissions to 'Restricted'.
    - As User3, a plain member:
        - Attempt to post into Public Group.
            - **Confirm posting is not offered and the request is refused.**
    - As User2, a group moderator:
        - Post into Public Group.
            - **Confirm the post is created.**

- [ ] As a member of a group set to 'Requires Approval', my post is held pending.
    - As User1:
        - Set Public Group's Posting Permissions to 'Requires Approval'.
    - As User3:
        - Post into Public Group.
            - **Confirm the post is held pending approval rather than published.**
    - As User2:
        - Open the group's pending posts and approve it.
            - **Confirm the post is published.**

- [ ] A banned member **cannot** post into the group. (covered: integration)

### Manual Regression

#### Pre-requisites

- [ ] A group set to Posting Permissions 'Members' has been created, with
      User3 as a member and User7 as a non-member.
- [ ] A group set to Posting Permissions 'Requires Approval' has been created,
      with User3 as a member.

#### Cases

- [ ] As a user, the group post form reflects my posting permission.
    - As User7, a non-member of a group set to 'Members':
        - Visit the group.
            - **Confirm the "Create post" form is not shown.**
    - As User3, a member of the same group:
        - Visit the group.
            - **Confirm the "Create post" form is shown.**

- [ ] As a member of a group set to 'Requires Approval', I am told my post is pending.
    - As User3:
        - Post into a group set to 'Requires Approval'.
            - **Confirm a message explains the post is awaiting approval.**
            - **Confirm the post is visible to you but marked pending.**

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

- [ ] Every group and subgroup's Posting Permissions can be switched between
      'Anyone', 'Members', 'Requires Approval' and 'Restricted' during testing.

#### Basics

- [ ] As an unauthenticated visitor, I cannot post into a group. (covered: integration)
    - As unauthenticated user:
        - Attempt to post into Public Group.
            - **Confirm the request is refused.**

- [ ] As a user, view permission is a prerequisite for posting. (covered: integration)
    - As User7:
        - Attempt to post into a Private Group whose Posting Permissions are 'Anyone'.
            - **Confirm the request is refused even though 'Anyone' may post.**
    - As User3, a confirmed member of that group:
        - Post into the same group.
            - **Confirm the post is created.**

- [ ] As a user, a group post must be consistent with its group. (covered: integration)
    - As User3:
        - Attempt to create a group post with no groupId.
            - **Confirm the request is refused.**
        - Attempt to post to an OPEN group with a visibility that is not public.
            - **Confirm the request is refused.**
        - Attempt to post to a PRIVATE group with a visibility that is not private.
            - **Confirm the request is refused.**
        - Attempt a public post to a private-open subgroup.
            - **Confirm the request is refused; it must be private.**

- [ ] As a non-admin, announcement and info posts are refused. (covered: integration)
    - As User3:
        - Attempt to create an announcement post in the group.
            - **Confirm the request is refused.**
        - Attempt to create an info post in the group.
            - **Confirm the request is refused.**

#### Subgroup posting

- [ ] As a parent group member, I can post into a PRIVATE-OPEN subgroup set to 'Anyone'. (covered: integration)
    - As User6, a parent group member:
        - Post into a PRIVATE-OPEN subgroup whose Posting Permissions are 'Anyone'.
            - **Confirm the post is created; they can view it and 'anyone' may post.**
    - As User7, a non-member of both parent and subgroup:
        - Attempt to post into the same subgroup.
            - **Confirm the request is refused because they cannot view it.**

- [ ] As a parent group member, I cannot post into a PRIVATE-OPEN subgroup set to 'Members'. (covered: integration)
    - As User6, a parent group member who is not a subgroup member:
        - Attempt to post into a PRIVATE-OPEN subgroup whose Posting Permissions are 'Members'.
            - **Confirm the request is refused.**
    - As a confirmed subgroup member:
        - Post into the same subgroup.
            - **Confirm the post is created.**

#### Top level Groups

##### Public Groups

###### Posting Permissions: Anyone

- [ ] Non-members **can** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Requires Approval

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Members **can** create pending posts. (covered: integration)
- [ ] Group Moderators **can** create pending posts. (covered: integration)
- [ ] Group Admins **can** create pending posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Restricted

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Members **cannot** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

##### Private Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Requires Approval

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Members **can** create pending posts. (covered: integration)
- [ ] Group Moderators **can** create pending posts. (covered: integration)
- [ ] Group Admins **can** create pending posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Restricted

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Members **cannot** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

##### Hidden Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Requires Approval

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Members **can** create pending posts. (covered: integration)
- [ ] Group Moderators **can** create pending posts. (covered: integration)
- [ ] Group Admins **can** create pending posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Restricted

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Members **cannot** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

###### Posting Permissions: Anyone

- [ ] Non-members **can** create posts. (covered: integration)
- [ ] Parent Group Members **can** create posts. (covered: integration)
- [ ] Parent Group Admins **can** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Requires Approval

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create pending posts. (covered: integration)
- [ ] Group Moderators **can** create pending posts. (covered: integration)
- [ ] Group Admins **can** create pending posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Restricted

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **cannot** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

##### Private Subgroups of Public Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **can** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Requires Approval

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create pending posts. (covered: integration)
- [ ] Group Moderators **can** create pending posts. (covered: integration)
- [ ] Group Admins **can** create pending posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Restricted

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **cannot** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

##### Hidden Subgroups of Public Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **can** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Requires Approval

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create pending posts. (covered: integration)
- [ ] Group Moderators **can** create pending posts. (covered: integration)
- [ ] Group Admins **can** create pending posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Restricted

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **cannot** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

#### Subgroups of Private Groups

##### Open Subgroups of Private Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **can** create posts. (covered: integration)
- [ ] Parent Group Admins **can** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Requires Approval

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create pending posts. (covered: integration)
- [ ] Group Moderators **can** create pending posts. (covered: integration)
- [ ] Group Admins **can** create pending posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Restricted

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **cannot** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

##### Private Subgroups of Private Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **can** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Requires Approval

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create pending posts. (covered: integration)
- [ ] Group Moderators **can** create pending posts. (covered: integration)
- [ ] Group Admins **can** create pending posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Restricted

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **cannot** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

##### Hidden Subgroups of Private Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **can** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Requires Approval

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create pending posts. (covered: integration)
- [ ] Group Moderators **can** create pending posts. (covered: integration)
- [ ] Group Admins **can** create pending posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Restricted

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **cannot** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

#### Subgroups of Hidden Groups

##### Open Subgroups of Hidden Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **can** create posts. (covered: integration)
- [ ] Parent Group Admins **can** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Requires Approval

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create pending posts. (covered: integration)
- [ ] Group Moderators **can** create pending posts. (covered: integration)
- [ ] Group Admins **can** create pending posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Restricted

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **cannot** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

##### Private Subgroups of Hidden Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **can** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Requires Approval

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create pending posts. (covered: integration)
- [ ] Group Moderators **can** create pending posts. (covered: integration)
- [ ] Group Admins **can** create pending posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Restricted

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **cannot** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

##### Hidden Subgroups of Hidden Groups

###### Posting Permissions: Anyone

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **can** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Requires Approval

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **can** create pending posts. (covered: integration)
- [ ] Group Moderators **can** create pending posts. (covered: integration)
- [ ] Group Admins **can** create pending posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)

###### Posting Permissions: Restricted

- [ ] Non-members **cannot** create posts. (covered: integration)
- [ ] Parent Group Members **cannot** create posts. (covered: integration)
- [ ] Parent Group Admins **cannot** create posts. (covered: integration)
- [ ] Members **cannot** create posts. (covered: integration)
- [ ] Group Moderators **can** create posts. (covered: integration)
- [ ] Group Admins **can** create posts. (covered: integration)
- [ ] Banned members **cannot** create posts. (covered: integration)
