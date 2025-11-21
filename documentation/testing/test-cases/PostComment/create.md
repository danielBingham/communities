## [Create PostComment](documentation/testing/test-cases/PostComment/create.md)

Cases covering making comments on posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 has created a public post.

### Cases

- [ ] Users can comment on posts they can see.
    1. As User2 comment "First." on User1's post.
        1. Confirm comment appears on User1's post.

- [ ] Comments appear in the order they are made.
    1. As User1 comment "Second." on User1's post.
        1. Confirm comment appears on User1's post.
    2. As User2 comment "Third." on User1's post after User1.
        1. Confirm comment appears on User1's post.
        2. Confirm comments appear in correct order:
            - User2: "First." 
            - User1: "Second." 
            - User2: "Third." 

#### Mentions

- [ ] Users can mention other users in comments.
    1. As User2 comment on User1's post and begin a mention by typing '@' and the beginning of User1's name.
        1. Confirm mention suggestions menu is limited to User2's friends and User1.
        2. Confirm list is filtered by User1's name. Continue typing it and confirm it continues to be filtered.
        3. Use the down arrow key to walk down the list.
        4. Use the up arrow key to walk up the list.
        5. Select User1 and hit the "Enter" key. Confirm mention completes with User1's username.
        6. Post comment.
    2. As User1, confirm mention notification received.
        1. Click on the notification.  Confirm comment highlighted.

#### Drafts

- [ ] Users can draft comments and the drafts will be saved as long as they are logged in.
    1. As User2, write a comment draft.
        1. Navigate away from the home feed and back to feed.  Confirm draft remains. 
        2. Close the Communities browser window. Reopen and reload.  Confirm draft remains.
        3. Post the draft. Confirm comment posts correctly.

- [ ] User's comment drafts are deleted when they log out.
    1. As User2, write a comment draft.
        1. Log out. 
        2. Log back in. 
        3. Confirm draft is gone.

- [ ] User's comment drafts can be cancelled, which deletes them.
    1. As User2, write a comment draft.
        1. Cancel the draft.
        2. Confirm draft is gone.
        3. Reload the page.
        4. Confirm draft is still gone.
        5. Navigate away and back. 
        6. Confirm draft is still gone.
