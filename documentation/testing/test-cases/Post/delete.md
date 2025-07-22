# Post Update

Test cases related to editing posts.

## Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.

## Cases

- [ ] As User1, create a private post with text and an image.
    - [ ] As User1, delete the post.
    - [ ] As User1, attempt to view the post. Confirm its gone.
    - [ ] As User2, attempt to view the post. Confirm its gone.

- [ ] As User1, create a private post with text and a link.
    - [ ] As User1, delete the post.
    - [ ] As User1, attempt to view the post. Confirm its gone.
    - [ ] As User2, attempt to view the post. Confirm its gone.

- [ ] As User1, create a public post with text and a link.
    - [ ] As User2, share the post.
    - [ ] As User1, delete the post.
    - [ ] As User1, attempt to view the post.  Confirm its gone.
    - [ ] As User2, view the share. Confirm original post is gone but share remains.
