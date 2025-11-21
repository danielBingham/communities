## [Update PostComment](documentation/testing/test-cases/PostComment/delete.md)

Cases covering making comments on posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created and is friends with User2.
- [ ] User1 has created a public post.

### Cases

- [ ] Users should be able to edit their comments.
    1. As User2, comment on User1's post.
        1. Edit comment.
        2. Write edit text.
        3. Post the edit. 
        4. Confirm comment shows the edit.

- [ ] Users should be able to cancel edits on their comments.
    1. As User2, comment on User1's post.
        1. Edit the comment.
        2. Write some edit text.
        3. Cancel the edit.
        4. Confirm comment shows original text.

#### Mentions

- [ ] Users mentioned in comments should not be notified again when those comments are editted.
    1. As User2, comment on User1's post and mention User3.
    2. As User3, confirm mention notification.
    3. As User2, edit the comment.
        1. Confirm User3 is not notified again.

- [ ] Users newly mentioned during a comment edit should be notified. NOTE: This case covers a current bug.
    1. As User2, comment on User1's post. 
        1. Edit the comment and add a mention of User3.
    2. As User3, confirm notification.

#### Drafts

- [ ] Users can draft edits of their comments and have them saved.
    1. As User2, comment on User1's post.
        1. Edit the comment.
        2. Write some new text.
        3. Reload the browser, confirm new text remains.
        4. Navigate away from the page and back, confirm new text remains.
    2. As User1, view the comment.
        1. Confirm new text is absent.
    3. As User2, post the comment.
        1. Confirm edit shows up properly.

- [ ] User's comment edit drafts are deleted when they log out.
    1. As User2, comment on User1's post.
        1. Edit the comment.
        2. Write some new text.
        3. Log out and log back in.
        4. Confirm text is gone.

- [ ] Users can cancel comment edits and the drafts will be deleted.
    1. As User2, comment on User1's post.
        1. Edit the comment. 
        2. Write some new text.
        3. Reload the browser.
        4. Confirm text remains.
        5. Cancel the edit.
        6. Confirm previous text is restored.
