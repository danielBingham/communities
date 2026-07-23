## [Update PostComment](documentation/testing/test-cases/PostComment/update.md)

Cases covering editing comments on posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created and is friends with User2.
- [ ] User1 has created a public post.

### Smoke Test

- [ ] As a user, I can edit my comments.
    - As User2:
        - Comment on User1's post.
        - Edit the comment.
        - Write edit text.
        - Post the edit.
            - **Confirm comment shows the edit.**

### Manual Regression

- [ ] As a user, I can cancel edits on my comments.
    - As User2:
        - Comment on User1's post.
        - Edit the comment.
        - Write some edit text.
        - Cancel the edit.
            - **Confirm comment shows original text.**

#### Mentions

- [ ] As a user, I am not notified again when a comment mentioning me is edited.
    - As User2:
        - Comment on User1's post and mention User3.
    - As User3:
        - **Confirm mention notification received.**
    - As User2:
        - Edit the comment.
    - As User3:
        - **Confirm not notified again.**

- [ ] As a user, I am notified when I am newly mentioned during a comment edit.
    - NOTE: This case covers a current bug.
    - As User2:
        - Comment on User1's post.
        - Edit the comment and add a mention of User3.
    - As User3:
        - **Confirm notification received.**

#### Drafts

- [ ] As a user, my comment edit drafts are saved.
    - As User2:
        - Comment on User1's post.
        - Edit the comment.
        - Write some new text.
        - Reload the browser.
            - **Confirm new text remains.**
        - Navigate away from the page and back.
            - **Confirm new text remains.**
    - As User1:
        - View the comment.
            - **Confirm new text is absent.**
    - As User2:
        - Post the comment.
            - **Confirm edit shows up properly.**

- [ ] As a user, my comment edit drafts are deleted when I log out.
    - As User2:
        - Comment on User1's post.
        - Edit the comment.
        - Write some new text.
        - Log out and log back in.
            - **Confirm text is gone.**

- [ ] As a user, I can cancel a comment edit and the draft is deleted.
    - As User2:
        - Comment on User1's post.
        - Edit the comment.
        - Write some new text.
        - Reload the browser.
            - **Confirm text remains.**
        - Cancel the edit.
            - **Confirm previous text is restored.**

### Full Regression

The post comment endpoints are not yet covered by the Integration suite.  All
comment update cases are defined in the Smoke Test and Manual Regression
sections above.
