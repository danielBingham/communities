# Delete PostSubscription 

Cases covering unsubscribing from posts.

## Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.

## Cases

- [ ] When a user unsubscribes from a post they created, they should no longer be notified of comments. 
    - [ ] As User1, create a post.
    - [ ] As User1, unsubscribe from post. 
    - [ ] As User2, comment on User1's post.
    - [ ] As User1, confirm not notified.

- [ ] When a user unsubscribes from a post they commented on, they should no longer be notified of comments. 
    - [ ] As User1, create a post.
    - [ ] As User2, comment on User1's post.
    - [ ] As User2, unsubscribe from User1's post. 
    - [ ] As User1, comment on User1's post.
    - [ ] As User2, confirm not notified.

- [ ] When a user unsubscribes from a post they subscribed to, they should not longer be notified of comments. 
    - [ ] As User1, create a public post.
    - [ ] As User3, subscribe to User1's post.
    - [ ] As User2, comment on User1's post.
    - [ ] As User3, confirm notification.
    - [ ] As User3, unsubscribe from User1's post.
    - [ ] As User2 comment on User1's post.
    - [ ] As User3, confirm no notification.
