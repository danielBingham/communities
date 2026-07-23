## [Read PostComment](documentation/testing/test-cases/PostComment/read.md)

Cases covering who can and cannot see post comments.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.

### Smoke Test

- [ ] As a user, comments on public posts are always viewable.
    - As User1:
        - Create a public post.
    - As User2:
        - Comment on User1's post.
    - As User3:
        - Attempt to view User2's comment by direct link.
            - **Confirm visible.**

- [ ] As a user, comments on private posts are only visible to the post author's friends.
    - As User1:
        - Create a private post.
    - As User2:
        - Comment on User1's post.
    - As User3:
        - Attempt to view User2's comment by direct link.
            - **Confirm not visible.**

### Manual Regression

- [ ] As a user, I lose visibility of comments when a post's visibility changes to private.
    - As User1:
        - Create a public post.
    - As User3:
        - Comment on User1's post.
    - As User1:
        - Change visibility to private.
    - As User2:
        - Comment on User1's post.
    - As User3:
        - **Confirm no comment notification is recieved.**
        - Attempt to view User2's comment by direct link.
            - **Confirm not visible.**

#### Mentions

- [ ] As a user, I am notified when mentioned on a post I can see.
    - As User1:
        - Create a public post.
    - As User2:
        - Comment on User1's post and mention User3.
    - As User3:
        - **Confirm mention notification received.**
        - Click through the notification.
            - **Confirm comment is visible.**

- [ ] As a user, I am not notified when mentioned on a post I cannot see.
    - As User1:
        - Create a private post.
    - As User2:
        - Comment on User1's post and mention User3.
    - As User3:
        - **Confirm no mention notification.**
        - Attempt to visit direct link for the comment.
            - **Confirm not visible.**

### Full Regression

The post comment endpoints are not yet covered by the Integration suite.  All
comment read cases are defined in the Smoke Test and Manual Regression
sections above.
