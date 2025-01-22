# Full Regression Test

## Friend Requests

- [x] From the administrator (Admin) account invite a new user.
    - [x] Accept the invite and register (Test[issue#].User1).

- [x] As User1, invite a new user.
    - [x] From the same browser session attempt to accept the invite.
        - [x] Expectation: Error.
    - [x] From a different browser session accept the invite and register (Test[Issue#].User2).

- [x] As User2, send Admin a friend request.
    - [x] As admin, reject the friend request.  Confirm its removed.


- [x] As User2, send Admin a friend request.
     - [x] As Admin, accept the friend request. Confirm request accepted.
     - [x] As Admin, remove User2 as a friend.

- [x] With two browser windows open, one As Admin and one As User2, have User2
     and Admin send each other simultaneous friend requests.  Confirm relationship
     confirmed.

## User Searching

- [x] As User2, on the Find Friends page, search for "Admin", confirm list filtered.

## Posting

- [ ] As User1, make a post with just text.
- [ ] As User1, make a post with just an image.
- [ ] As User1, make a post with just a link.
- [ ] As User1, make a post with text and an image.
- [ ] As User1, make a post with text and a link.

- [ ] As User1, write a post draft with a link.
    - [ ] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [ ] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [ ] Log out.  Log back in. Confirm draft is gone.

## Reactions

- [ ] As Admin, Like User2's post.
    - [ ] As Admin, unlike User2's post.
- [ ] As Admin, dislike User2's post.
     - [ ] As Admin, remove dislike of User2's post.
- [ ] As Admin, block User2's post.
    - [ ] As Admin, remove block of User2's post.
- [ ] As User2, react to each of User1's posts.

## Post Comments

- [ ] As Admin, comment on User2's post.
- [ ] As User2, click on comment notification from Admin's comment.
- [ ] As User2, comment on each of user1's posts.

## Post Subscriptions

- [ ] As User1, unsubscribe from a post.
    - [ ] As User2, comment on the post User1 unsubscribed from.
 
## Profile Editing

- [ ] As User2, upload a profile image and submit form.
- [ ] As User2, remove profile image and submit form.
- [ ] As User2, edit name and bio and submit form.
- [ ] As User2, edit name and bio and don't submit form.
- [ ] As User2, change email.  Confirm email.
- [ ] As user2, change password. Log out and log back in with new password.

## Authentication

- [ ] As User1, log out.
- [ ] As User2, log in.
- [ ] While logged out, request password reset for User2.

## Settings 

- [ ] As User2, turn off Post Comments.
    - [ ] As User1, comment on a User2 post. Confirm no emails.
- [ ] As User2, turn off friend requests.
