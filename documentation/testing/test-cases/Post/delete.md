# Post Update

Test cases related to editing posts.

## Pre-requisites

- [ ] User named `John Doe` has been created.
- [ ] User named `Jane Doe` has been created and is friends with `John Doe`.

## Cases

### Post Deletion

- [ ] As John Doe, create a private post with text and an image.
    - [ ] As John Doe, delete the post.
    - [ ] As John Doe, attempt to view the post. Confirm its gone.
    - [ ] As Jane Doe, attempt to view the post. Confirm its gone.

- [ ] As John Doe, create a private post with text and a link.
    - [ ] As John Doe, delete the post.
    - [ ] As John Doe, attempt to view the post. Confirm its gone.
    - [ ] As Jane Doe, attempt to view the post. Confirm its gone.

- [ ] As John Doe, create a public post with text and a link.
    - [ ] As Jane Doe, share the post.
    - [ ] As John Doe, delete the post.
    - [ ] As John Doe, attempt to view the post.  Confirm its gone.
    - [ ] As Jane Doe, view the share. Confirm original post is gone but share remains.
