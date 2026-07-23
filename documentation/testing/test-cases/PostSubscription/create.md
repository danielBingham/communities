## [Create PostSubscription](documentation/testing/test-cases/PostSubscription/create.md)

Cases covering subscribing to posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.

### Smoke Test

- [ ] As a user, I am subscribed to the posts I create and notified of comments.
    - As User1:
        - Create a post.
            - **Confirm subscribed.**
    - As User2:
        - Comment on User1's post.
    - As User1:
        - **Confirm notified.**

- [ ] As a user, I am subscribed to the posts I comment on and notified of comments.
    - As User1:
        - Create a post.
    - As User2:
        - Comment on User1's post.
            - **Confirm subscribed.**
    - As User1:
        - Comment on your own post.
    - As User2:
        - **Confirm notified.**

### Manual Regression

- [ ] As a user, I am notified of comments on a post I subscribed to.
    - As User1:
        - Create a public post.
    - As User3:
        - Subscribe to User1's post.
    - As User2:
        - Comment on User1's post.
    - As User3:
        - **Confirm notification received.**

- [ ] As a user, I stop being notified when I lose the ability to view a subscribed post.
    - As User1:
        - Create a public post.
    - As User3:
        - Subscribe to User1's post.
    - As User1:
        - Change visibility of post to private.
    - As User2:
        - Comment on User1's post.
    - As User3:
        - **Confirm no notification.**

### Full Regression

The post subscription endpoints are not yet covered by the Integration suite.
All subscription creation cases are defined in the Smoke Test and Manual
Regression sections above.
