## [Delete CommentReaction](documentation/testing/test-cases/CommentReaction/delete.md)

Cases covering removing likes from PostComments.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least one public post.
- [ ] User1 has liked a comment on User2's post.

#### Cases

- [ ] As a user, I can unlike a comment.
    - As User1:
        - Click the highlighted thumbs up on the comment User1 liked.
            - **Confirm the thumbs up is no longer filled in or highlighted.**
            - **Confirm the like count is decremented by 1, and is hidden if it reaches 0.**

### Manual Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least one public post.
- [ ] User3 has been created.
- [ ] User1 and User3 have both liked the same comment on User2's post.

#### Cases

- [ ] As a user, unliking a comment only removes my like.
    - As User1:
        - Unlike the comment.
            - **Confirm the like count is 1.**
        - Click on the like count.
            - **Confirm User3 is listed as liking the comment and User1 is not.**

- [ ] As a user, I can like a comment again after unliking it.
    - As User1:
        - Like the comment again.
            - **Confirm the thumbs up is filled in and highlighted, and the like count is 2.**

### Full Regression

#### Pre-requisites

None.

The Integration suite covers removing likes
(`web-application/test/integration/suites/CommentReactionController/deleteCommentReaction.spec.js`):
unauthenticated users, removing a like that doesn't exist, only removing the
current user's like, and comments that aren't on the post.  All of the user
interface cases are defined in the Smoke Test and Manual Regression sections
above.
