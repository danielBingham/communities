## [Update GroupPost](documentation/testing/test-cases/GroupPost/update.md)

Cases covering GroupPost updating.  Who can edit the posts in a group?

The composition of an edit (text, images, links, drafts) is covered in
[Update Post](documentation/testing/test-cases/Post/update.md).

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

- [ ] As a post author, I can edit my own group post.
    - As User3:
        - Create a post in Public Group.
        - Edit the post and change the text.  Save the edit.
            - **Confirm the post updates.**
    - As User7:
        - View the post in Public Group.
            - **Confirm the edited text is shown.**

- [ ] A non-author **cannot** edit a group post. (covered: integration)
    - As User2, a group moderator:
        - Open User3's post in Public Group.
            - **Confirm no edit option is offered.**

### Manual Regression

- [ ] As a post author, editing a group post does not change which group it belongs to.
    - As User3:
        - Create a post in Public Group and edit it.
            - **Confirm the post remains attributed to Public Group.**
            - **Confirm no control is offered to move it to another group.**

### Full Regression

#### Basics

- [ ] As an unauthenticated visitor, I cannot update a group post. (covered: integration)
    - As unauthenticated user:
        - Attempt to update a post in Public Group.
            - **Confirm the request is refused.**

#### Permissions

- [ ] The author **can** update their own group post. (covered: integration)
- [ ] Another group ADMIN **cannot** update the author's post -- they can view it but are not the author. (covered: integration)
- [ ] A group MEMBER **cannot** update another member's post. (covered: integration)
- [ ] A non-member **cannot** update a PRIVATE group post -- they cannot view it. (covered: integration)
- [ ] A non-member **cannot** update an OPEN group post -- they can view it but are not the author. (covered: integration)
- [ ] A site moderator **cannot** update another user's group post. (covered: integration)
- [ ] The author **cannot** update their own post once they have been banned, because they lose the ability to view it. (covered: integration)

#### Subgroup posts

- [ ] The author **can** update their own subgroup post. (covered: integration)
- [ ] A parent member who can VIEW the post **cannot** update it, because they are not the author. (covered: integration)
- [ ] A non-member who cannot view the post **cannot** update it. (covered: integration)

#### Group post visibility consistency

- [ ] As an author, I cannot change a group post's visibility away from its group's. (covered: integration)
    - As User3:
        - Attempt to change an OPEN-group post to private visibility.
            - **Confirm the request is refused.**
        - Attempt to change a PRIVATE-group post to public visibility.
            - **Confirm the request is refused.**

#### Valid updates

- [ ] As an author, I can update the content of my own group post. (covered: integration)
    - As User3:
        - Update the content of your own group post.
            - **Confirm the content is updated.**
