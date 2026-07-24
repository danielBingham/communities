## [Update GroupPost](documentation/testing/test-cases/GroupPost/update.md)

Cases covering GroupPost updating.  Who can edit the posts in a group?

The composition of an edit (text, images, links, drafts) is covered in
[Update Post](documentation/testing/test-cases/Post/update.md).

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] User2 has been created and added as a moderator of Public Group.
- [ ] User3 has been created and added as a member of Public Group.
- [ ] User7 has been created and is a non-member of Public Group.

#### Cases

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

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created with User3 as a member.

#### Cases

- [ ] As a post author, editing a group post does not change which group it belongs to.
    - As User3:
        - Create a post in Public Group and edit it.
            - **Confirm the post remains attributed to Public Group.**
            - **Confirm no control is offered to move it to another group.**

### Full Regression

#### Pre-requisites

- [ ] An Open group and a Private group have each been created, containing
      posts made by User3.
- [ ] User1 has been added as an admin and User2 as a plain member of each group.
- [ ] User7 has been created and is a non-member of both groups.
- [ ] User9 has posts in the Open group and has since been banned from it.
- [ ] A subgroup has been created containing a post by User3, with a parent
      member who can view it and a non-member who cannot.
- [ ] A site moderator has been created.

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
