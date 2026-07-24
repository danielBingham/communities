## [Create PostReaction](documentation/testing/test-cases/PostReaction/create.md)

Cases covering reacting to Posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least three posts.

### Smoke Test

- [ ] As a user, I can like a post.
    - As User1:
        - Like one of User2's Posts.
            - **Confirm like highlighted and "likes" is incremented by 1.**
        - Click on the reactions.
            - **Confirm User1 is shown as liking.**
        - Sort the feed by "Most Activity".
            - **Confirm post increases rank.**

### Manual Regression

- [ ] As a user, I can dislike a post.
    - As User1:
        - Dislike a second one of User2's Posts.
            - **Confirm dislike highlighted and "dislikes" is incremented by 1.**
        - Click on the reactions.
            - **Confirm User1 is shown as disliking.**
        - Sort the feed by "Most Activity".
            - **Confirm post increases rank.**

### Full Regression

The post reaction endpoints are not yet covered by the Integration suite.  All
reaction creation cases are defined in the Smoke Test and Manual Regression
sections above.
