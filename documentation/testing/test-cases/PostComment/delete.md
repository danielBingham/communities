## [Delete PostComment](documentation/testing/test-cases/PostComment/delete.md)

Cases covering deleting comments on posts.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created and has created a public post.
- [ ] User2 has been created.

#### Cases

- [ ] As a user, I can delete my comments. (covered: e2e)
    - As User2:
        - Comment on User1's post.
        - Delete the comment.
            - **Confirm the comment is removed.**

- [ ] A user **cannot** delete another user's comment. (covered: e2e)
    - As User2:
        - Comment on User1's post.
    - As User1:
        - Check the dots menu for User2's comment.
            - **Confirm "delete" is not shown.**

### Full Regression

#### Pre-requisites

- [ ] User1 has been created and has created a public post.
- [ ] User2 has been created.

The post comment endpoints aren't covered by the integration tests yet, so
these cases are covered by the end-to-end tests alone.

#### Cases

- [ ] As a user, I'm asked to confirm before a comment is deleted. (covered: e2e)
    - As User2:
        - Comment on User1's post.
        - Choose "delete" from the comment's menu.
            - **Confirm you're asked whether you're sure.**
        - Click "Cancel".
            - **Confirm the comment is still there, after a reload too.**

- [ ] As a user mentioned in a deleted comment, I can still view the post from the notification. (covered: e2e)
    - As User2:
        - Comment on User1's post, mentioning User1.
        - Delete the comment.
    - As User1:
        - Click on the mention notification.
            - **Confirm it shows the post, but the comment is gone.**
