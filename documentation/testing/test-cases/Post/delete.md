## [Delete Post](documentation/testing/test-cases/Post/delete.md)

Test cases related to deleting posts.

Deleting posts made to a group is covered separately in
[Delete GroupPost](documentation/testing/test-cases/GroupPost/delete.md).

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is **not** friends with User1.
- [ ] User4 has been created and has been blocked by User1.
- [ ] A site moderator has been created.

### Smoke Test

- [ ] As a user, I can delete a private post with an image.
    - As User1:
        - Create a private post with an image.
    - As User2:
        - Comment and react to the post.
    - As User1:
        - Delete the post.
        - Attempt to view the post.
            - **Confirm it's gone.**
    - As User2:
        - Attempt to view the post.
            - **Confirm it's gone.**

### Manual Regression

- [ ] As a user, I can delete a private post with a link.
    - As User1:
        - Create a private post with a link.
    - As User2:
        - Comment and react to the post.
    - As User1:
        - Delete the post.
        - Attempt to view the post.
            - **Confirm it's gone.**
    - As User2:
        - Attempt to view the post.
            - **Confirm it's gone.**

- [ ] As a user, I can delete a public post with an image that has been shared.
    - As User1:
        - Create a public post with an image.
    - As User2:
        - Comment and react to the post.
        - Share the post.
    - As User1:
        - Delete the post.
        - Attempt to view the post.
            - **Confirm it's gone.**
    - As User2:
        - Attempt to view the post.
            - **Confirm it's gone.**
            - **Confirm the share is also gone.**

- [ ] As a user, I can delete a public post with a link that has been shared.
    - As User1:
        - Create a public post with a link.
    - As User2:
        - Comment and react to the post.
        - Share the post.
    - As User1:
        - Delete the post.
        - Attempt to view the post.
            - **Confirm it's gone.**
    - As User2:
        - Attempt to view the post.
            - **Confirm it's gone.**
            - **Confirm the share is also gone.**

### Full Regression

#### Basics

- [ ] As an unauthenticated visitor, I cannot delete a post. (covered: integration)
    - As unauthenticated user:
        - Attempt to delete any post.
            - **Confirm the request is refused.**

- [ ] As a user, deleting a post that doesn't exist is not found. (covered: integration)
    - As User1:
        - Attempt to delete a post id that does not exist.
            - **Confirm a not found result.**
        - Delete one of your own posts, then attempt to delete it again.
            - **Confirm a not found result.**

#### Permissions

- [ ] An author **can** delete their own PUBLIC feed post. (covered: integration)
- [ ] An author **can** delete their own PRIVATE feed post. (covered: integration)
- [ ] A stranger **cannot** delete another user's PUBLIC feed post. (covered: integration)
- [ ] A stranger **cannot** delete another user's PRIVATE feed post. (covered: integration)
- [ ] A confirmed friend **cannot** delete another user's PRIVATE feed post. (covered: integration)
- [ ] A blocked user **cannot** delete another user's PUBLIC feed post. (covered: integration)
- [ ] A site moderator **cannot** delete another user's PRIVATE feed post. (covered: integration)
