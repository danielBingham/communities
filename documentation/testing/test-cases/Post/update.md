# Post Update

Test cases related to editing posts.

## Pre-requisites

- [ ] User named `John Doe` has been created.
- [ ] User named `Jane Doe` has been created.

## Cases

### Post Editing

- [ ] As John Doe, create a post with text and an image.
    - [ ] Edit the post and change the text.  Save the edit.  Confirm post updated appropriately.
    - [ ] Edit the post and change the image.  Save the edit and confirm the post updated appropriately.
    - [ ] Edit the post and change the text. Cancel the edit and confirm the post was not updated.
    - [ ] Edit the post and change the image.  Cancel the edit and confirm the post was not updated.

- [ ] As John Doe, create a post with text an a link.
    - [ ] Edit the post and change the text.  Save the edit.  Confirm post updated appropriately.
    - [ ] Edit the post and change the link.  Save the edit and confirm the post updated appropriately.
    - [ ] Edit the post and change the text. Cancel the edit and confirm the post was not updated.
    - [ ] Edit the post and change the link.  Cancel the edit and confirm the post was not updated.

- [ ] As John Doe, create a public post with text and a link.
    - [ ] As Jane Doe, share John Doe's post.
    - [ ] As John Doe, edit the shared post and change the text and the link.  Save the edit.
    - [ ] As Jane Doe, confirm the share updated appropriately.

### Post Edit Drafts

- [ ] As John Doe, edit post with an image - change text and image.
    - [ ] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [ ] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [ ] Post the draft. Confirm draft posts correctly.

- [ ] As John Doe, edit a post with an image - change text and image.
    - [ ] Log out. Log back in. Confirm draft is gone.

- [ ] As John Doe, edit a post with a link - change text and link.
    - [ ] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [ ] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [ ] Post the draft.  Confirm draft posts correctly. 

- [ ] As John Doe, edit a post with a link - change text and link.
    - [ ] Log out. Log back in. Confirm draft is gone.
