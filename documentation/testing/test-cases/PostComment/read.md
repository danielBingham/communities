# Read PostComment 

Cases covering who can and cannot see post comments.

## Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.
- [ ] User4 has been created and is friends with User1.

## Cases

- [ ] As User1, create a public post.
    - [ ] As User2, comment on User1's post.
    - [ ] As User3, attempt to view User2's comment by direct link.  Confirm visible.

- [ ] As User1, create a private post.
    - [ ] As User2, comment on User1's post.
    - [ ] As User3, attempt to view User2's comment by direct link.  Confirm not visible.

- [ ] As User1, create public post.
    - [ ] As User3, comment on User1's post.
    - [ ] As User1, change visibility to private.
    - [ ] As User2, comment on User1's post.
    - [ ] As User3, confirm no comment notification is recieved.
    - [ ] As User3, attempt to view User2's comment by direct link.  Confirm not visible.

### Mentions

- [ ] As User1 create a public post.
    - [ ] As User2, comment on User1's post and mention User3.
    - [ ] As User3, confirm mention notification. Click through notification and confirm comment is visible.

- [ ] As User1 create a private post.
    - [ ] As User2, comment on User1's post and mention User3.
    - [ ] As User3, confirm no mention notification.
    - [ ] As User3, attempt to visit direct link for comment. confirm not visible.
