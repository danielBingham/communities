## [Delete PostReaction](documentation/testing/test-cases/PostReaction/delete.md)

Cases covering removing reactions from Posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least three posts.
- [ ] User1 has reacted to each of User2's posts.

### Smoke Test

- [ ] As a user, I can unlike a post.
    - As User1:
        - Unlike one of User2's Posts.
            - **Confirm like unhighlighted and "likes" is decremented by 1.**
        - Click on the reactions.
            - **Confirm User1 is not shown as liking.**
        - Sort the feed by "Most Activity".
            - **Confirm post decreases rank.**

### Manual Regression

- [ ] As a user, I can remove a dislike from a post.
    - As User1:
        - Remove a dislike from a second one of User2's Posts.
            - **Confirm dislike is not highlighted and "dislikes" is decremented by 1.**
        - Click on the reactions.
            - **Confirm User1 is not shown as disliking.**
        - Sort the feed by "Most Activity".
            - **Confirm post decreases rank.**

- [ ] As a user, I can remove a demote from a post.
    - As User1:
        - Remove a demote from a third one of User2's Posts.
            - **Confirm demote is not highlighted and "demotes" is decremented by 1.**
        - Click on the reactions.
            - **Confirm User1 is not shown as demoting.**
        - Sort the feed by "Most Activity".
            - **Confirm post increases rank.**

### Full Regression

The post reaction endpoints are not yet covered by the Integration suite.  All
reaction deletion cases are defined in the Smoke Test and Manual Regression
sections above.
