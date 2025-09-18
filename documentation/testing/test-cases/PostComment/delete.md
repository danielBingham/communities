## [Delete PostComment](documentation/testing/test-cases/PostComment/update.md)

Cases covering making comments on posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 has created a public post.

### Cases

- [ ] As User2, comment on User1's post.
    - [ ] As User2, delete the comment.
    - [ ] Confirm the comment is removed.

- [ ] As User2, comment on User1's post.
    - [ ] As User1, check the dots menu for User2's comment.
        - [ ] Confirm "delete" is not shown.

- [ ] As User2, comment on User1's post, mentioning User1.
    - [ ] As User2, delete the comment.
    - [ ] As User1, click on the mention notification. Confirm is shows the post, but comment is gone.
