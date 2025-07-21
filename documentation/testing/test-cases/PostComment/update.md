# Update PostComment 

Cases covering making comments on posts.

## Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created and is friends with User2.
- [ ] User1 has created a public post.

## Cases

- [ ] As User2, comment on User1's post.
    - [ ] As User2, edit comment.
    - [ ] As User2, write edit text.
    - [ ] As User2, post the edit. Confirm comment shows the edit.

- [ ] As User2, comment on User1's post.
    - [ ] As User2, edit the comment.  Write some edit text.
    - [ ] As User2, cancel the edit.  Confirm comment shows original text.

### Mentions

- [ ] As User2, comment on User1's post and mention User3.
    - [ ] As User3, confirm mention notification.
    - [ ] As User2, edit the comment.  Confirm User3 is not notified again.


- [ ] As User2, comment on User1's post. NOTE: This case covers a current bug.
    - [ ] As User2, edit the comment and add a mention of User3.
    - [ ] As User3, confirm notification.
    

### Drafts

- [ ] As User2, comment on User1's post.
    - [ ] As User2, edit the comment.  Write some new text.
    - [ ] Reload the browser, confirm new text remains.
    - [ ] Navigate away from the page and back, confirm new text remains.
    - [ ] As User1, view the comment.  Confirm new text is absent.
    - [ ] As User2, post the comment.  Confirm edit shows up properly.

- [ ] As User2, comment on User1's post.
    - [ ] As User2, edit the comment.  Write some new text.
    - [ ] As User2, log out and log back in.  Confirm text is gone.

- [ ] As User2, comment on User1's post.
    - [ ] As User2, edit the comment. Write some new text.
    - [ ] As User2, reload the browser.  Confirm text remains.
    - [ ] As User2, cancel the edit.  Confirm previous text is restored.
