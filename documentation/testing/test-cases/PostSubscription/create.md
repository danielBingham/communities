## [Create PostSubscription](documentation/testing/test-cases/PostSubscription/create.md)

Cases covering subscribing to posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.

### Cases

- [ ] When a user creates a post they should be subscribed to the post and notified of comments.
    - [ ] As User1, create a post.
    - [ ] As User1, confirm subscribed.
    - [ ] As User2, comment on User1's post.
    - [ ] As User1, confirm notified.

- [ ] When a user comments on a post, they should be subscribed to the post and notified of comments.
    - [ ] As User1, create a post.
    - [ ] As User2, comment on User1's post.
    - [ ] As User2, confirm subscribed.
    - [ ] As User1, comment on User1's post.
    - [ ] As User2, confirm notified.

- [ ] When a user subscribes to a post, they should be notified of comments.
    - [ ] As User1, create a public post.
    - [ ] As User3, subscribe to User1's post.
    - [ ] As User2, comment on User1's post.
    - [ ] As User3, confirm notification.

- [ ] When a user loses the ability to view a subscribed post they should no longer be notified of comments.
    - [ ] As User1, create a public post.
    - [ ] As User3, subscribe to User1's post.
    - [ ] As User1, change visibility of post to private.
    - [ ] As User2, comment on User1's post.
    - [ ] As User3, confirm no notification.
