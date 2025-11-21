## [Delete PostSubscription](documentation/testing/test-cases/PostSubscription/delete.md)

Cases covering unsubscribing from posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.

### Cases

- [ ] When a user unsubscribes from a post they created, they should no longer be notified of comments. 
    1. As User1, create a post.
        1. Unsubscribe from post. 
    2. As User2, comment on User1's post.
    3. As User1, confirm not notified.

- [ ] When a user unsubscribes from a post they commented on, they should no longer be notified of comments. 
    1. As User1, create a post.
    2. As User2, comment on User1's post.
        1. Unsubscribe from User1's post. 
    3. As User1, comment on User1's post.
    4. As User2, confirm not notified.

- [ ] When a user unsubscribes from a post they subscribed to, they should not longer be notified of comments. 
    1. As User1, create a public post.
    2. As User3, subscribe to User1's post.
    3. As User2, comment on User1's post.
    4. As User3, confirm notification.
        1. Unsubscribe from User1's post.
    5. As User2 comment on User1's post.
    6. As User3, confirm no notification.
