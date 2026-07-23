## [Update PostReaction](documentation/testing/test-cases/PostReaction/update.md)

Cases covering updating reactions to Posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least three posts.
- [ ] User1 has reacted to each of User2's posts.

### Smoke Test

- [ ] As a user, I can change a like to a dislike.
    - As User1:
        - Dislike the User2 Post previously liked.
            - **Confirm dislike highlighted and like not highlighted.**
            - **Confirm "dislikes" is incremented by 1 and "likes" is decremented by 1.**
        - Click on the reactions.
            - **Confirm User1 is shown as disliking.**
        - Sort the feed by "Most Activity".
            - **Confirm post rank stays the same.**

### Manual Regression

- [ ] As a user, I can change a dislike to a demote.
    - As User1:
        - Demote the User2 Post previously disliked.
            - **Confirm "Are You Sure" modal is shown.**
        - Select "Yes".
            - **Confirm demote highlighted and dislike not highlighted.**
            - **Confirm demotes is incremented by 1 and dislikes is decremented by 1.**
        - Click on the reactions.
            - **Confirm User1 is shown as demoting.**
        - Sort the feed by "Most Activity".
            - **Confirm post decreases rank.**

- [ ] As a user, I can change a demote to a like.
    - As User1:
        - Like the User2 Post previously demoted.
            - **Confirm like is highlighted and demote is not highlighted.**
            - **Confirm likes is incremented by 1 and demotes is decremented by 1.**
        - Click on the reactions.
            - **Confirm User1 is shown as liking.**
        - Sort the feed by "Most Activity".
            - **Confirm post increases rank.**

### Full Regression

The post reaction endpoints are not yet covered by the Integration suite.  All
reaction update cases are defined in the Smoke Test and Manual Regression
sections above.
