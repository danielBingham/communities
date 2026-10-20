## [Read CommentReaction](documentation/testing/test-cases/CommentReaction/read.md)

Cases covering who can see likes on PostComments.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least one public post with a comment.
- [ ] User3 has been created.
- [ ] User1 and User3 have both liked the comment on User2's post.

#### Cases

- [ ] As a user, I can't see likes from users I've blocked.
    - As User2:
        - Block User3.
        - View the comment on User2's post.
            - **Confirm the like count is 1.**
        - Click on the like count.
            - **Confirm only User1 is listed as liking the comment.**
        - Unblock User3.

### Manual Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least one public post with a comment.
- [ ] User3 has been created.
- [ ] User4 has been created.
- [ ] User1 and User3 have both liked the comment on User2's post.

#### Cases

- [ ] As a user, I can't see likes from users who have blocked me.
    - As User3:
        - Block User4.
    - As User4:
        - View the comment on User2's post.
            - **Confirm the like count is 1.**
        - Click on the like count.
            - **Confirm only User1 is listed as liking the comment.**

- [ ] As a user, blocks between other users don't hide likes from me.
    - As User1:
        - View the comment on User2's post.
            - **Confirm the like count is 2.**
    - As User3:
        - Unblock User4.

### Full Regression

#### Pre-requisites

None.

The Integration suite covers which likes are sent with comments, on both
`GET /post/:id` and `GET /post/:postId/comments`
(`web-application/test/integration/suites/CommentReactionController/relations.spec.js`),
including blocks in either direction.  All of the user interface cases are
defined in the Smoke Test and Manual Regression sections above.
