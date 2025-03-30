# Full Regression Test

This document contains a checklist of test cases to be run during a full
regression of the platform. To run a full regression, run through the full
checklist on Desktop and then again on Mobile.

Create a directory under `releases/` named for the feature, eg.
`19-private-groups` and place the checklist below in the `index.md` file. Copy
the [Regression](#regression) section to a file with an appropriate name, eg.
`pre-migration-desktop-regression.md` and work through it.

- [-] Run a full regression pre-migration to confirm feature flag works (if
    applicable).  -- Choosing to skip this even though the feature flag definitely breaks things.
    - [-] On a Desktop browser, run through [Regression](#regression)
    - [-] On a Mobile browser, run through [Regression](#regression)
- [ ] Run a full regression post-migration (if applicable) to confirm feature
    works.
    - [ ] On a Desktop browser, run through [Regression](#regression)
    - [ ] On a Mobile browser, run through [Regression](#regression)

## Migrations
- [x] As Administrator, run any migrations associated with this release.
- [x] As Administrator, create content associated with those migrations. Confirm content creates.
- [x] As Administrator, rollback the migrations. Confirm migrations rollback cleanly.
- [x] As Administrator, run migrations forward again.

## Regression

### User Invitation

Cases covering the User Invitation and Registration flow, in which a user is
sent an invitation email and may use it to register on the platform.

- [x] From the administrator (Admin) account invite a new user (communities-issue#.user1).
    - [x] As Admin, Confirm invitation is visible on the "Friend Requests" page.
    - [x] As User1, Accept the invite and register (Issue#.User1), referred to as User1
    - [x] As User1, accept the friend request and view Admin's profile page.

- [x] As User1, invite a new user (communities-issue#.user2).
    - [x] As User1, confirm invitation is visible on the "Friend Requests" page.
    - [ ] As User1, from the same browser session attempt to accept the invite.
        - [x] Expectation: Error.
    - [x] As Admin, confirm the invitation is *not* visible on the "Friend Requests" page.
    - [x] From a different browser session accept the invite and register (Issue#.User2), referred to as User2.
    - [x] As User2, accept the friend request and view User1's profile page.

- [x] As User2, invite a new user (communities-isssue#.user3).
    - [x] As User2, confirm the invitation is visible on the "Friend Requests" page.
    - [x] As User2, invite User3 again using the same email.
    - [x] From a different browser session accept the invite and register (Issue#.User3), referred to as User3. Confirm both invites recieved.
    - [x] As User3, accept the Friend Request and view User2's profile page.

### Friend Requests

Cases covering sending friend requests, accepting friend requests, and
rejecting friend requests.

- [x] As User2, send Admin a friend request.
    - [x] As admin, reject the friend request.  Confirm its removed.

- [x] As User2, send Admin a friend request.
     - [x] As Admin, accept the friend request. Confirm request accepted.
     - [x] As Admin, remove User2 as a friend.

- [x] As User2, send Admin a friend request.
    - [x] As Admin, confirm friend request visible.
    - [x] As User2, cancel the friend request. Confirm removed.
    - [x] As Admin, confirm removed.

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

- [x] As User1, make a private post with just text.
- [x] As User1, make a private post with just an image.
- [x] As User1, make a private post with just a link.
- [x] As User1, make a private post with text and an image.
- [x] As User1, make a private post with text and a link.

- [x] As User1, make a public post with just text.
- [x] As User1, make a public post with just an image.
- [x] As User1, make a public post with just a link.
- [x] As User1, make a public post with text and an image.
- [x] As User1, make a public post with text and a link.

- [x] As User3, visit User1's profile and confirm public posts are visible.
- [x] As User3, share one of User1's posts. Confirm shared.
- [x] As User2, share User3's share of User1's post.  Confirm shared.

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

- [x] As Admin, comment on User1's post.
    - [x] As Admin, edit comment.
    - [x] As Admin, delete comment.
    - [x] As Admin, comment on User1's post.
- [x] As User1, comment on User2's post.
- [x] As User2 comment on same User1 post that Admin did.
    - [x] As User2, edit comment.
    - [x] As User2, edit comment and cancel edit.
    - [x] As User2, delete comment.
    - [x] As User2, write comment and cancel before posting.
    - [x] As User2, comment on same User1 post.
- [x] As User2, comment on Admin's post.
- [x] As User2, click on comment notification from Admin's comment.

### Post Subscriptions

- [x] As User1, unsubscribe from a post.
    - [x] As User2, comment on the post User1 unsubscribed from. 
    - [x] As User1, confirm no email.
- [x] As User1, subscribe to the unsubscribed post.
    - [x] As User2, comment on the post User1 unsubscribed from.
    - [x] As User1, confirm email.
 
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

- [ ] As User2, invite User4 to "Open Test Group" using an email
    - [ ] As User4, accept the email invite.
    - [ ] As User4, accept the group invite.
    - [ ] As User4, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As User4, post in the group.
    - [ ] As User4, leave the group.
        - [ ] Confirm User4's, post remains.
        - [ ] As User2, comment on User4's post.  Confirm User4 still subscribed and notified.

- [ ] As User1, invite User5 to "Open Test Group" using an email
    - [ ] As User5, accept the email invite.
    - [ ] As User5, accept the group invite.
    - [ ] As User5, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As User5, make a post.
    - [ ] As User1, remove User5 from the group.
        - [ ] Confirm User5's post remains.
        - [ ] As User1, comment on User5's post.  Confirm User5 still subscribed and notified.

- [ ] As User1, promote User2 to "admin"

- [ ] As User1, modify the group's profile in Settings.
- [ ] As User2, modify the group's profile in Settings.
- [ ] As User1, delete the group.
    - [ ] Confirm all posts deleted.

#### Test 'private' Groups

- [ ] As User1, create a "private" group named "Private Test Group"
    - [ ] As User1, create a post in "Private Test Group".

- [ ] As User2, attempt to view "Private Test Group", confirm posts and members are *not* visible.
    - [ ] As User2, attempt to view a specific post in "Private Test Group" by loading the direct link.  Confirm 404.

- [ ] As User1, invite User2 to "Private Test Group"
    - [ ] As User2, reject the invite.
    - [ ] As User1, invite User2 to "Private Test Group".
    - [ ] As User2, accept the invite and join the group.
    - [ ] As User2, confirm posts and members are now visible.
        - [ ] As User2, attempt to view a specific post in "Private Test Group" by loading the direct link, confirm visible.
        - [ ] As User2, post in the group.

- As User1, promote User2 to "moderator".

- [ ] As User2, invite User4 to "Private Test Group" using an email
    - [ ] As User4, accept the email invite.
    - [ ] As User4, accept the group invite.
    - [ ] As User4, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As User4, post in the group.
    - [ ] As User4, leave the group.
        - [ ] As User4, confirm post no longer visible.
        - [ ] As User2, confirm User4's, post remains.
        - [ ] As User2, comment on User4's post.  Confirm User4 is *not* still subscribed and *not* notified.

- [ ] As User1, invite User5 to "Private Test Group" using an email
    - [ ] As User5, accept the email invite.
    - [ ] As User5, accept the group invite.
    - [ ] As User5, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As User5, make a post.
    - [ ] As User1, remove User5 from the group.
        - [ ] As User1, confirm User5's post remains.
        - [ ] As User1, comment on User5's post.  Confirm User5 is *not* still subscribed and is *not* notified.
        - [ ] As User5, confirm User5's post is no longer visible.

- [ ] As User1, promote User2 to "admin"

- [ ] As User1, modify the group's profile in Settings.
- [ ] As User2, modify the group's profile in Settings.
- [ ] As User1, delete the group.
    - [ ] Confirm all posts deleted.

#### Test 'hidden' Groups

- [ ] As User1, create a "hidden" group named "Hidden Test Group"
    - [ ] As User1, create a post in "Hidden Test Group".

- [ ] As User2, attempt to view "Hidden Test Group", confirm 404.
    - [ ] As user2, attempt to view a specific post in "Hidden Test Group" by loading the direct link, confirm 404.

- [ ] As User1, invite User2 to "Hidden Test Group"
    - [ ] As User2, confirm "Hidden Test Group" is visible.
    - [ ] As User2, reject the invite.
    - [ ] As User2, confirm group is no longer visible.
    - [ ] As User1, invite User2 to "Hidden Test Group".
    - [ ] As User2, accept the invite and join the group.
    - [ ] As User2, confirm posts and members are now visible.
        - [ ] As User2, attempt to view a specific post in "Hidden Test Group" by loading the direct link, confirm visible.
        - [ ] As User2, post in the group.

- [ ] As User2, invite User4 to "Hidden Test Group" using an email
    - [ ] As User4, accept the email invite.
    - [ ] As User4, confirm group is visible.
    - [ ] As User4, accept the group invite.
    - [ ] As User4, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As User4, post in the group.
    - [ ] As User4, leave the group.
        - [ ] As User4, confirm group is no longer visible.
        - [ ] As User4, confirm post is no longer visible.
        - [ ] As User2, confirm User4's, post remains.
        - [ ] As User2, comment on User4's post.  Confirm User4 is *not* still subscribed and *not* notified.

- [ ] As User1, invite User5 to "Hidden Test Group" using an email
    - [ ] As User5, accept the email invite.
    - [ ] As User5, confirm the group is visible.
    - [ ] As User5, accept the group invite.
    - [ ] As User5, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As User5, make a post.
    - [ ] As User1, remove User5 from the group.
        - [ ] As User1, confirm User5's post remains.
        - [ ] As User1, comment on User5's post.  Confirm User5 is *not* still subscribed and is *not* notified.
        - [ ] As User5, confirm User5's post is no longer visible.
        - [ ] As User5, confirm the group is no longer visible.

- [ ] As User1, promote User2 to "admin"

- [ ] As User1, modify the group's profile in Settings.
- [ ] As User2, modify the group's profile in Settings.
- [ ] As User1, delete the group.
    - [ ] Confirm all posts deleted.

