## [Delete PostComment](documentation/testing/test-cases/PostComment/update.md)

Cases covering deleting comments on posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 has created a public post.

### Cases

- [ ] Users can delete their comments.
    1. As User2, comment on User1's post.
        1. Delete the comment.
        2. Confirm the comment is removed.

- [ ] Users should not be able to delete other user's comments.
    1. As User2, comment on User1's post.
    2. As User1, check the dots menu for User2's comment.
        1. Confirm "delete" is not shown.

- [ ] Users mentioned in comments should still be able to view the post from the notification, but not the comment.
    1. As User2, comment on User1's post, mentioning User1.
        1. Delete the comment.
    2. As User1, click on the mention notification. Confirm is shows the post, but comment is gone.
