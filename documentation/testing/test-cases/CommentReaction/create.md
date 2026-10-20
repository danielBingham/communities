## [Create CommentReaction](documentation/testing/test-cases/CommentReaction/create.md)

Cases covering liking PostComments.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least one public post.
- [ ] User2's post has at least one comment that User1 hasn't liked.

#### Cases

- [ ] As a user, I can like a comment.
    - As User1:
        - Click the thumbs up to the left of "Reply" on the comment on User2's post.
            - **Confirm the thumbs up is filled in and highlighted.**
            - **Confirm a like count of 1 is shown to the left of the thumbs up, with a filled in blue thumbs up.**
        - Click on the like count.
            - **Confirm a modal opens with User1 listed as liking the comment.**

### Manual Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least one public post.
- [ ] User3 has been created.
- [ ] User2's post has at least one comment that neither User1 nor User3 has liked.
- [ ] User1 has created a comment on one of User2's posts.

#### Cases

- [ ] As a user, I can see other users' likes on a comment.
    - As User1:
        - Like the comment on User2's post.
    - As User3:
        - Like the same comment.
            - **Confirm the like count is 2.**
        - Click on the like count.
            - **Confirm both User1 and User3 are listed as liking the comment.**

- [ ] As a user, I can like my own comment.
    - As User1:
        - Click the thumbs up on User1's own comment.
            - **Confirm the thumbs up is filled in and highlighted, and a like count of 1 is shown.**
            - **Confirm "Reply" is not shown on User1's own comment, but the thumbs up is.**

- [ ] As a user, double clicking the thumbs up doesn't like a comment twice.
    - As User1:
        - Quickly double click the thumbs up on a comment User1 hasn't liked.
        - Refresh the page.
            - **Confirm the like count only includes User1 once.**

### Full Regression

#### Pre-requisites

None.

The Integration suite covers who can and cannot like a comment
(`web-application/test/integration/suites/CommentReactionController/postCommentReactions.spec.js`):
unauthenticated users, comments that don't exist or aren't on the post,
comments on posts the user can't see, blocks in either direction, liking twice,
and reactions other than 'like'.  All of the user interface cases are defined
in the Smoke Test and Manual Regression sections above.
