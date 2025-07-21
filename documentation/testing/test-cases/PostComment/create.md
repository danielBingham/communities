# Create PostComment 

Cases covering making comments on posts.

## Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 has created a public post.

## Cases

- [ ] As User2 comment "First." on User1's post.
    - [ ] Confirm comment appears on User1's post.

- [ ] As User1 comment "Second." on User1's post.
    - [ ] Confirm comment appears on User1's post.

- [ ] As User2 comment "Third." on User1's post after User1.
    - [ ] Confirm comment appears on User1's post.
    - [ ] Confirm comments appear in correct order:
        - User2: "First." 
        - User1: "Second." 
        - User2: "Third." 

### Mentions

- [ ] As User2 comment on User1's post and begin a mention by typing '@' and the beginning of User1's name.
    - [ ] Confirm mention suggestions menu is limited to User2's friends and User1.
    - [ ] Confirm list is filtered by User1's name. Continue typing it and confirm it continues to be filtered.
    - [ ] Use the down arrow key to walk down the list.
    - [ ] Use the up arrow key to walk up the list.
    - [ ] Select User1 and hit the "Enter" key. Confirm mention completes with User1's username.
    - [ ] Post comment.
    - [ ] As User1, confirm mention notification received.
    - [ ] As User1, click on the notification.  Confirm comment highlighted.

### Drafts

- [ ] As User2, write a comment draft.
    - [ ] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [ ] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [ ] Post the draft. Confirm comment posts correctly.

- [ ] As User2, write a comment draft.
    - [ ] Log out. Log back in. Confirm draft is gone.

- [ ] As User2, write a comment draft.
    - [ ] Cancel the draft.
    - [ ] Confirm draft is gone.
    - [ ] Reload the page.  Confirm draft is still gone.
    - [ ] Navigate away and back. Confirm draft is still gone.
