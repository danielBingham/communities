## [Delete GroupPost](documentation/testing/test-cases/GroupPost/delete.md)

Cases covering GroupPost deletion.  Who can delete the posts in a group?

Removing a post as a moderation action is covered in
[Update GroupModeration](documentation/testing/test-cases/GroupModeration/update.md).

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] User2 has been created and added as a moderator of Public Group.
- [ ] User3 has been created and added as a member of Public Group.
- [ ] User7 has been created and is a non-member of Public Group.

#### Cases

- [ ] As a post author, I can delete my own group post.
    - As User3:
        - Create a post in Public Group and have another member comment on it.
        - Delete the post.
            - **Confirm the post is removed from the group.**
    - As User7:
        - Attempt to open the post permalink.
            - **Confirm a not found page renders.**

- [ ] A non-author **cannot** delete a group post. (covered: integration)
    - As User2, a group moderator:
        - Open User3's post in Public Group.
            - **Confirm no delete option is offered.**

### Manual Regression

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created with User3 as a member
      and other members who can comment on and react to posts.

#### Cases

- [ ] As a post author, deleting a group post removes its comments and reactions.
    - As User3:
        - Create a post in Public Group, have members comment on and react to it.
        - Delete the post.
            - **Confirm the post, its comments and its reactions are all gone.**
            - **Confirm the group's post count updates.**

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

- [ ] As an unauthenticated visitor, I cannot delete a group post. (covered: integration)
    - As unauthenticated user:
        - Attempt to delete a post in Public Group.
            - **Confirm the request is refused.**

- [ ] As a user, deleting a group post twice is not found the second time. (covered: integration)
    - As User3:
        - Delete your own group post, then attempt to delete it again.
            - **Confirm a not found result.**

#### Permissions

- [ ] The author **can** delete their own group post. (covered: integration)
- [ ] Another group ADMIN **cannot** delete the author's post -- they can view it but are not the author. (covered: integration)
- [ ] A group MEMBER **cannot** delete another member's post. (covered: integration)
- [ ] A non-member **cannot** delete a PRIVATE group post -- they cannot view it. (covered: integration)
- [ ] A non-member **cannot** delete an OPEN group post -- they can view it but are not the author. (covered: integration)
- [ ] A site moderator **cannot** delete another user's group post. (covered: integration)
- [ ] The author **cannot** delete their own post once they have been banned, because they lose the ability to view it. (covered: integration)

#### Subgroup posts

- [ ] The author **can** delete their own subgroup post. (covered: integration)
- [ ] A parent member who can VIEW the post **cannot** delete it, because they are not the author. (covered: integration)
- [ ] A non-member who cannot view the post **cannot** delete it. (covered: integration)
