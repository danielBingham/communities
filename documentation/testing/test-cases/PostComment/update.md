## [Update PostComment](documentation/testing/test-cases/PostComment/update.md)

Cases covering editing comments on posts.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created and has created a public post.
- [ ] User2 has been created.

#### Cases

- [ ] As a user, I can edit my comments. (covered: e2e)
    - As User2:
        - Comment on User1's post.
        - Edit the comment.
        - Write edit text.
        - Post the edit.
            - **Confirm comment shows the edit.**

### Full Regression

#### Pre-requisites

- [ ] User1 has been created and has created a public post.
- [ ] User2 has been created.
- [ ] User3 has been created and is friends with User2.

The post comment endpoints aren't covered by the integration tests yet, so
these cases are covered by the end-to-end tests alone.

#### Cases

- [ ] As a user, I can cancel edits on my comments. (covered: e2e)
    - As User2:
        - Comment on User1's post.
        - Edit the comment.
        - Write some edit text.
        - Cancel the edit.
            - **Confirm comment shows original text.**

- [ ] As a user, I'm asked before my edits to a comment are discarded. (covered: e2e)
    - As User2:
        - Comment on User1's post.
        - Edit the comment, and click "Cancel" without changing anything.
            - **Confirm the edit closes without asking.**
        - Edit the comment, change its text, and click "Cancel".
            - **Confirm you're asked whether to discard your edits.**
        - Click "Keep Editing".
            - **Confirm the edit still has the changed text.**
        - Click "Cancel", then "Discard Edits".
            - **Confirm the comment shows its original text.**

- [ ] A user **cannot** edit another user's comment. (covered: e2e)
    - As User2:
        - Comment on User1's post.
    - As User1:
        - Check the dots menu for User2's comment.
            - **Confirm "edit" is not shown.**
    - As User2:
        - Check the dots menu for User2's comment.
            - **Confirm "edit" is shown.**

#### Mentions

- [ ] As a user, I am not notified again when a comment mentioning me is edited. (covered: e2e)
    - As User2:
        - Comment on User1's post and mention User3.
    - As User3:
        - **Confirm mention notification received.**
    - As User2:
        - Edit the comment.
    - As User3:
        - **Confirm not notified again.**

- [ ] As a user, I am notified when I am newly mentioned during a comment edit. (covered: e2e)
    - NOTE: This case covers a current bug: editing a comment doesn't send
      any notifications. The end-to-end test runs as a to-do, which reports
      its result without failing the run, until the bug is fixed.
    - As User2:
        - Comment on User1's post.
        - Edit the comment and add a mention of User3.
    - As User3:
        - **Confirm notification received.**

#### Drafts

- [ ] As a user, my comment edit drafts are saved. (covered: e2e)
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

- [ ] As a user, my comment edit drafts are deleted when I log out. (covered: e2e)
    - As User2:
        - Comment on User1's post.
        - Edit the comment.
        - Write some new text.
        - Log out and log back in.
            - **Confirm text is gone.**

- [ ] As a user, I can cancel a comment edit and the draft is deleted. (covered: e2e)
    - As User2:
        - Comment on User1's post.
        - Edit the comment.
        - Write some new text.
        - Reload the browser.
            - **Confirm text remains.**
        - Cancel the edit.
            - **Confirm previous text is restored.**
