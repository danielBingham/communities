## [Delete PostSubscription](documentation/testing/test-cases/PostSubscription/delete.md)

Cases covering unsubscribing from posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.

### Smoke Test

- [ ] As a user, I stop being notified when I unsubscribe from a post I created.
    - As User1:
        - Create a post.
        - Unsubscribe from the post.
    - As User2:
        - Comment on User1's post.
    - As User1:
        - **Confirm not notified.**

### Manual Regression

- [ ] As a user, I stop being notified when I unsubscribe from a post I commented on.
    - As User1:
        - Create a post.
    - As User2:
        - Comment on User1's post.
        - Unsubscribe from User1's post.
    - As User1:
        - Comment on your own post.
    - As User2:
        - **Confirm not notified.**

- [ ] As a user, I stop being notified when I unsubscribe from a post I subscribed to.
    - As User1:
        - Create a public post.
    - As User3:
        - Subscribe to User1's post.
    - As User2:
        - Comment on User1's post.
    - As User3:
        - **Confirm notification received.**
        - Unsubscribe from User1's post.
    - As User2:
        - Comment on User1's post.
    - As User3:
        - **Confirm no notification.**

### Full Regression

The post subscription endpoints are not yet covered by the Integration suite.
All subscription deletion cases are defined in the Smoke Test and Manual
Regression sections above.
