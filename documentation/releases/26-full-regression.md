# Full Regression Test

## Friend Requests

- [x] From the administrator (Admin) account invite a new user.
    - [x] Accept the invite and register (Test[issue#].User1).

- [ ] As User1, invite a new user.
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

## Authentication

- [x] As User1, log out.
- [x] As User1, attempt to log in with the wrong password. Confirm login fails.
- [x] As User1, log in with the right password.  Confirm login succeeds.

- [x] As User2, attempt to login with the wrong password.  Confirm login fails.
- [x] As User2, attempt to login with the right password. Confirm login succeeds.

- [x] As User2, log out and request a password reset. Change User2's password.
- [x] As User2, log out and attempt to login with old password.  Confirm login fails.
- [x] As User2, attempt to login with new password.  Confirm login succeeds.

## User Searching

- [x] As User2, on the Find Friends page, search for "Admin", confirm list filtered.

## Posting

- [x] As User1, make a post with just text.
- [x] As User1, make a post with just an image.
- [x] As User1, make a post with just a link.
- [x] As User1, make a post with text and an image.
- [x] As User1, make a post with text and a link.

- [x] As User1, write a post draft with a link.
    - [x] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [x] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [x] Log out.  Log back in. Confirm draft is gone.

## Reactions

- [x] As Admin, Like User2's post.
    - [x] As Admin, unlike User2's post.
- [x] As Admin, dislike User2's post.
     - [x] As Admin, remove dislike of User2's post.
- [x] As Admin, block User2's post.
    - [x] As Admin, remove block of User2's post.
- [x] As User2, react to each of User1's posts.

## Post Comments

- [x] As Admin, comment on User2's post.
- [x] As User2, click on comment notification from Admin's comment.
- [x] As User2, comment on each of user1's posts.

## Post Subscriptions

- [x] As User1, unsubscribe from a post.
    - [x] As User2, comment on the post User1 unsubscribed from.
 
## Profile Editing

- [x] As User2, upload a profile image and submit form.
- [x] As User2, remove profile image and submit form.
- [x] As User2, edit name and bio and submit form.
- [x] As User2, edit name and bio and don't submit form.
- [x] As User2, change email.  Confirm email.
- [x] As user2, change password. Log out and log back in with new password.

## Settings 

- [x] As User2, turn off Post Comments.
    - [x] As User1, comment on a User2 post. Confirm no emails.
- [x] As User2, turn off friend requests.
