## [Read PostComment](documentation/testing/test-cases/PostComment/read.md)

Cases covering who can and cannot see post comments.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.

### Cases

- [ ] Comments on public posts are always viewable.
    1. As User1, create a public post.
    2. As User2, comment on User1's post.
    3. As User3, attempt to view User2's comment by direct link.  Confirm visible.

- [ ] Comments on private posts are only visible by the post author's friends.
    1. As User1, create a private post.
    2. As User2, comment on User1's post.
    3. As User3, attempt to view User2's comment by direct link.  Confirm not visible.

- [ ] Users who comment on public posts of those they are not friends with
        lose visibility to those comments if the visibilty of the post changes to
        private.
    1. As User1, create public post.
    2. As User3, comment on User1's post.
    3. As User1, change visibility to private.
    4. As User2, comment on User1's post.
    5. As User3, confirm no comment notification is recieved.
    6. As User3, attempt to view User2's comment by direct link.  Confirm not visible.

#### Mentions

- [ ] Users mentioned on posts they can see should be notified of the mention.
    1. As User1, create a public post.
    2. As User2, comment on User1's post and mention User3.
    3. As User3, confirm mention notification. Click through notification and confirm comment is visible.

- [ ] Users mentioned on posts they cannot see should not be notified of the mention.
    1. As User1, create a private post.
    2. As User2, comment on User1's post and mention User3.
    3. As User3, confirm no mention notification.
    4. As User3, attempt to visit direct link for comment. confirm not visible.
