# Post Update

Test cases related to editing posts.

## Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.

## Cases

### Post Editing

- [ ] As User1, create a post with text and an image.
    - [ ] Edit the post and change the text.  Save the edit.  Confirm post updated appropriately.
    - [ ] Edit the post and change the image.  Save the edit and confirm the post updated appropriately.
    - [ ] Edit the post and change the text. Cancel the edit and confirm the post was not updated.
    - [ ] Edit the post and change the image.  Cancel the edit and confirm the post was not updated.

- [ ] As User1, create a post with text an a link.
    - [ ] Edit the post and change the text.  Save the edit.  Confirm post updated appropriately.
    - [ ] Edit the post and change the link.  Save the edit and confirm the post updated appropriately.
    - [ ] Edit the post and change the text. Cancel the edit and confirm the post was not updated.
    - [ ] Edit the post and change the link.  Cancel the edit and confirm the post was not updated.

- [ ] As User1, create a public post with text and a link.
    - [ ] As User2, share User1's post.
    - [ ] As User1, edit the shared post and change the text and the link.  Save the edit.
    - [ ] As User2, confirm the share updated appropriately.

### Post Edit Drafts

- [ ] As User1, edit post with an image - change text and image.
    - [ ] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [ ] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [ ] Post the draft. Confirm draft posts correctly.

- [ ] As User1, edit a post with an image - change text and image.
    - [ ] Log out. Log back in. Confirm draft is gone.

- [ ] As User1, edit a post with a link - change text and link.
    - [ ] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [ ] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [ ] Post the draft.  Confirm draft posts correctly. 

- [ ] As User1, edit a post with a link - change text and link.
    - [ ] Log out. Log back in. Confirm draft is gone.
