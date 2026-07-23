## [Delete PostComment](documentation/testing/test-cases/PostComment/delete.md)

Cases covering deleting comments on posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 has created a public post.

### Smoke Test

- [ ] As a user, I can delete my comments.
    - As User2:
        - Comment on User1's post.
        - Delete the comment.
            - **Confirm the comment is removed.**

- [ ] A user **cannot** delete another user's comment.
    - As User2:
        - Comment on User1's post.
    - As User1:
        - Check the dots menu for User2's comment.
            - **Confirm "delete" is not shown.**

### Manual Regression

- [ ] As a user mentioned in a deleted comment, I can still view the post from the notification.
    - As User2:
        - Comment on User1's post, mentioning User1.
        - Delete the comment.
    - As User1:
        - Click on the mention notification.
            - **Confirm it shows the post, but the comment is gone.**

### Full Regression

The post comment endpoints are not yet covered by the Integration suite.  All
comment deletion cases are defined in the Smoke Test and Manual Regression
sections above.
