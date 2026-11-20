## [Read PostComment](documentation/testing/test-cases/PostComment/read.md)

Cases covering who can and cannot see post comments.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.

#### Cases

- [ ] As a user, comments on public posts are always viewable. (covered: e2e)
    - As User1:
        - Create a public post.
    - As User2:
        - Comment on User1's post.
    - As User3:
        - Attempt to view User2's comment by direct link.
            - **Confirm visible.**

- [ ] As a user, comments on private posts are only visible to the post author's friends. (covered: e2e)
    - As User1:
        - Create a private post.
    - As User2:
        - Comment on User1's post.
    - As User3:
        - Attempt to view User2's comment by direct link.
            - **Confirm not visible.**

### Full Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.

The post comment endpoints aren't covered by the integration tests yet, so
these cases are covered by the end-to-end tests alone.

#### Cases

- [ ] As a user, I lose visibility of comments when a post's visibility changes to private. (covered: e2e)
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

- [ ] As a user, I can copy a link to a comment. (covered: e2e)
    - As User1:
        - Create a public post.
    - As User2:
        - Comment on User1's post.
        - Open the comment's menu and choose "Copy Link".
            - **Confirm the app says the link was copied.**
    - As User3:
        - Paste the link into the browser's address bar.
            - **Confirm it opens User1's post with User2's comment highlighted.**

- [ ] As a user, a post's comments are folded away in the feed until I show them. (covered: e2e)
    - As User1:
        - Create a post.
    - As User2:
        - Comment on User1's post twice.
    - As User1:
        - Go to the Feed page.
            - **Confirm the post shows "Show 2 comments.", and not the comments.**
        - Click "Show 2 comments."
            - **Confirm both comments show, in the order they were made, with "Hide 2 comments."**
        - Click "Hide 2 comments."
            - **Confirm the comments are folded away again.**
        - Open the post's page.
            - **Confirm its comments show without having to ask.**

- [ ] As a user, I don't see the comments of users I've blocked, or who have blocked me. (covered: e2e)
    - As User1:
        - Create a public post.
    - As User2:
        - Comment on User1's post.
    - As User3:
        - Comment on User1's post.
        - Block User2.
        - View User1's post.
            - **Confirm User3's comment shows, and User2's doesn't.**
    - As User2:
        - View User1's post.
            - **Confirm User2's comment shows, and User3's doesn't.**
    - As User1:
        - View the post.
            - **Confirm both comments show.**

#### Mentions

- [ ] As a user, I am notified when mentioned on a post I can see. (covered: e2e)
    - As User1:
        - Create a public post.
    - As User2:
        - Comment on User1's post and mention User3.
    - As User3:
        - **Confirm mention notification received.**
        - Click through the notification.
            - **Confirm comment is visible.**

- [ ] As a user, I am not notified when mentioned on a post I cannot see. (covered: e2e)
    - As User1:
        - Create a private post.
    - As User2:
        - Comment on User1's post and mention User3.
    - As User3:
        - **Confirm no mention notification.**
        - Attempt to visit direct link for the comment.
            - **Confirm not visible.**
