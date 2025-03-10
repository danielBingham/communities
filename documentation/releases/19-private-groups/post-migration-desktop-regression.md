## Post-migration Desktop Regression

### User Invitation

Cases covering the User Invitation and Registration flow, in which a user is
sent an invitation email and may use it to register on the platform.

- [x] From the administrator (Admin) account invite a new user (communities-test[issue#].user1).
    - [x] Accept the invite and register (Test[issue#].User1), referred to as User1

- [x] As User1, invite a new user (communities-test[issue#].user2).
    - [x] From the same browser session attempt to accept the invite.
        - [x] Expectation: Error.
    - [x] From a different browser session accept the invite and register (Test[Issue#].User2), referred to as User2.

### Friend Requests

Cases covering sending friend requests, accepting friend requests, and
rejecting friend requests.

- [x] As User2, send Admin a friend request.
    - [x] As admin, reject the friend request.  Confirm its removed.

- [x] As User2, send Admin a friend request.
     - [x] As Admin, accept the friend request. Confirm request accepted.
     - [x] As Admin, remove User2 as a friend.

- [x] With two browser windows open, one As Admin and one As User2, have User2
     and Admin send each other simultaneous friend requests.  Confirm relationship
     confirmed.

### Authentication

Cases covering the authentication system, logging in, logging out, reset
password flow, etc.

- [x] As User1, log out.
- [x] As User1, attempt to log in with the wrong password. Confirm login fails.
- [x] As User1, log in with the right password.  Confirm login succeeds.

- [x] As User2, attempt to login with the wrong password.  Confirm login fails.
- [x] As User2, attempt to login with the right password. Confirm login succeeds.

- [x] As User2, log out and request a password reset. Change User2's password.
- [x] As User2, log out and attempt to login with old password.  Confirm login fails.
- [x] As User2, attempt to login with new password.  Confirm login succeeds.

### User Searching

Cases covering searching for users.

- [x] As User2, on the Find Friends page, search for "Admin", confirm list filtered.

### Posting

Cases covering making posts in all their forms and with all their attachments.

- [x] As User1, make a post with just text.
- [x] As User1, make a post with just an image.
- [x] As User1, make a post with just a link.
- [x] As User1, make a post with text and an image.
- [x] As User1, make a post with text and a link.

- [x] As User1, write a post draft with a link.
    - [x] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [x] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [x] Log out.  Log back in. Confirm draft is gone.

### Reactions

- [x] As Admin, Like User2's post.
    - [x] As Admin, unlike User2's post.

- [x] As Admin, dislike User2's post.
     - [x] As Admin, remove dislike of User2's post.

- [x] As Admin, block User2's post.
    - [x] As Admin, remove block of User2's post.

- [x] As User2, react to each of User1's posts.

### Post Comments

- [x] As Admin, comment on User2's post.
- [x] As User2, click on comment notification from Admin's comment.
- [x] As User2, comment on each of user1's posts.

### Post Subscriptions

- [x] As User1, unsubscribe from a post.
    - [x] As User2, comment on the post User1 unsubscribed from.
 
### Profile Editing

- [x] As User2, upload a profile image and submit form.
- [x] As User2, remove profile image and submit form.
- [x] As User2, edit name and bio and submit form.
- [x] As User2, edit name and bio and don't submit form.
- [x] As User2, change email.  Confirm email.
- [x] As user2, change password. Log out and log back in with new password.

### Settings 

- [x] As User2, turn off Post Comments.
    - [x] As User1, comment on a User2 post. Confirm no emails.
- [x] As User2, turn off friend requests.

### Groups

#### Test 'open' Groups

- [x] As User1, create an "open" group named "Open Test Group"
    - [x] As User1, create a post in "Open Test Group".

- [x] As User2, attempt to view "Open Test Group", confirm posts and members are visible.
    - [x] As User2, attempt to view a specific post in "Open Test Group" by loading the direct link.  Confirm visible.

- [x] As User1, invite User2 to "Open Test Group"
    - [x] As User2, reject the invite.
    - [x] As User1, invite User2 to "Open Test Group"
    - [x] As User2, accept the invite and join the group.
    - [x] As User2, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As User2, post in the group.

- [x] As User1, promote User2 to "moderator".
    - [x] As User2, delete a post from the group.

- [x] As User2, invite User4 to "Open Test Group" using an email
    - [x] As User4, accept the email invite.
    - [x] As User4, accept the group invite.
    - [x] As User4, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As User4, post in the group.
    - [x] As User4, leave the group.
        - [x] Confirm User4's, post remains.
        - [x] As User2, comment on User4's post.  Confirm User4 still subscribed and notified.
    - [x] As User2, invite User4 back into group. As User4, accept the invitation.
        - [x] As User2, remove User4 from group.  Confirm User4's post remains.

- [x] As User1, promote User2 to "admin"

- [x] As User1, modify the group's profile in Settings.
- [x] As User2, modify the group's profile in Settings.
- [x] As User1, delete the group.
    - [x] Confirm all posts deleted.

#### Test 'private' Groups

- [x] As User1, create a "private" group named "Private Test Group"
    - [x] As User1, create a post in "Private Test Group".

- [x] As User2, attempt to view "Private Test Group", confirm posts and members are *not* visible.
    - [x] As User2, attempt to view a specific post in "Private Test Group" by loading the direct link.  Confirm 404.

- [x] As User1, invite User2 to "Private Test Group"
    - [x] As User2, reject the invite.
    - [x] As User1, invite User2 to "Private Test Group".
    - [x] As User2, accept the invite and join the group.
    - [ ] As User2, confirm posts and members are now visible.
        - [x] As User2, attempt to view a specific post in "Private Test Group" by loading the direct link, confirm visible.
        - [x] As User2, post in the group.

- [x] As User1, promote User2 to "moderator".
    - [ ] As User2, delete a post from another user in group.

- [x] As User2, invite User4 to "Private Test Group" using an email
    - [x] As User4, accept the email invite.
    - [x] As User4, accept the group invite.
    - [x] As User4, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As User4, post in the group.
    - [x] As User4, leave the group.
        - [x] As User4, confirm post no longer visible.
        - [x] As User2, confirm User4's, post remains.
        - [x] As User2, comment on User4's post.  Confirm User4 is *not* still subscribed and *not* notified.
    - [x] As User2, invite User4 back into group. As User4, accept the invitation.
        - [x] As User2, remove User4 from group.  Confirm User4's post remains.

- [x] As User1, promote User2 to "admin"

- [x] As User1, modify the group's profile in Settings.
- [x] As User2, modify the group's profile in Settings.
- [x] As User1, delete the group.
    - [x] Confirm all posts deleted.

#### Test 'hidden' Groups

- [x] As User1, create a "hidden" group named "Hidden Test Group"
    - [x] As User1, create a post in "Hidden Test Group".

- [x] As User2, attempt to view "Hidden Test Group", confirm 404.
    - [x] As user2, attempt to view a specific post in "Hidden Test Group" by loading the direct link, confirm 404.

- [x] As User1, invite User2 to "Hidden Test Group"
    - [x] As User2, confirm "Hidden Test Group" is visible.
    - [x] As User2, reject the invite.
    - [x] As User2, confirm group is no longer visible.
    - [x] As User1, invite User2 to "Hidden Test Group".
    - [x] As User2, accept the invite and join the group.
    - [x] As User2, confirm posts and members are now visible.
        - [x] As User2, attempt to view a specific post in "Hidden Test Group" by loading the direct link, confirm visible.
        - [x] As User2, post in the group.

- [x] As User2, invite User4 to "Hidden Test Group" using an email
    - [x] As User4, accept the email invite.
    - [x] As User4, confirm group is visible.
    - [x] As User4, accept the group invite.
    - [x] As User4, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As User4, post in the group.
    - [x] As User4, leave the group.
        - [x] As User4, confirm group is no longer visible.
        - [x] As User4, confirm post is no longer visible.
        - [x] As User2, confirm User4's, post remains.
        - [x] As User2, comment on User4's post.  Confirm User4 is *not* still subscribed and *not* notified.
    - [x] As User2, invite User4 back into group. As User4, accept the invitation.
        - [x] As User2, remove User4 from group.  Confirm User4's post remains.

- [x] As User1, promote User2 to "admin"
    - [x] As User2, delete a post.

- [x] As User1, modify the group's profile in Settings.
- [x] As User2, modify the group's profile in Settings.
- [x] As User1, delete the group.
    - [x] Confirm all posts deleted.

