## Regression

### User Registration

Cases covering the User Registration flow.

- [x] Register a new user named James Johnson with username `james-johnson` (communities-james-johnson@mailinator.com)
    - [x] Attempt to register with too short a password.
        - [x] Confirm validation error.
    - [x] Attempt to register without checking Age Confirmation.
        - [x] Confirm validation error.
    - [x] Successfully register.
        - [x] Confirm email.
        - [x] Accept Terms of Service.
        - [x] Skip Pay What you Can.
    - [x] Turn off all email notifications.

- [x] Register a new user named Marcia Garcia (communities-marcia-garcia@mailinator.com)
    - [x] Attempt to register with the username `james-johnson`
        - [x] Confirm validation error.
    - [x] Register with the username `marcia-garcia`
    - [x] Successfully register.
        - [x] Confirm email.
        - [x] Accept Terms of Service.
        - [x] Skip Pay What you Can.
    - [ ] Turn off all email notifications.

### User Invitation

Cases covering the User Invitation flow, in which a user is sent an invitation
email and may use it to register on the platform.

- [x] From the administrator (Admin) account invite John Doe (communities-john-doe@mailinator.com).
    - [x] As Admin, Confirm invitation is visible on the "Friend Requests" page.
    - [x] As John Doe, Accept the invite and register John Doe with username `john-doe`
    - [x] Successfully register.
        - [x] Confirm email.
        - [x] Accept Terms of Service.
        - [x] Skip Pay What you Can.
    - [x] Turn off all email notifications.
    - [x] As John Doe, accept the friend request and view Admin's profile page.

- [ ] As John Doe, invite Jane Doe (communities-jane.doe@mailiantor.com).
    - [ ] As John Doe, confirm invitation is visible on the "Friend Requests" page.
    - [x] As John Doe, from the same browser session attempt to accept the invite.
        - [x] Expectation: Error.
    - [x] As Admin, confirm the invitation is *not* visible on the "Friend Requests" page.
    - [x] From a different browser session accept the invite and register Jane Doe with username `jane.doe`.
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.
    - [ ] As Jane Doe, accept the friend request and view John Doe's profile page.

- [x] As Jane Doe, invite James Smith (communities-james_smith@mailinator.com).
    - [x] As Jane Doe, confirm the invitation is visible on the "Friend Requests" page.
    - [x] From a different browser session accept the invite and register James Smith with username `james_smith`.
    - [x] Successfully register.
        - [x] Confirm email.
        - [x] Accept Terms of Service.
        - [x] Skip Pay What you Can.
    - [x] Turn off all email notifications.
    - [x] As James Smith, accept the Friend Request and view Jane Doe's profile page.

### Friend Requests

Cases covering sending friend requests, accepting friend requests, and
rejecting friend requests.

- [x] As Jane Doe, send Admin a friend request.
    - [x] As admin, reject the friend request.  Confirm its removed.

- [x] As Jane Doe, send Admin a friend request.
     - [x] As Admin, accept the friend request. Confirm request accepted.
     - [x] As Admin, remove Jane Doe as a friend.

- [x] As Jane Doe, send Admin a friend request.
    - [x] As Admin, confirm friend request visible.
    - [x] As Jane Doe, cancel the friend request. Confirm removed.
    - [x] As Admin, confirm removed.

- [x] With two browser windows open, one As Admin and one As Jane Doe, have Jane Doe
     and Admin send each other simultaneous friend requests.  Confirm relationship
     confirmed.

### Authentication

Cases covering the authentication system, logging in, logging out, reset
password flow, etc.

- [x] As John Doe, log out.
- [x] As John Doe, attempt to log in with the wrong password. Confirm login fails.
- [x] As John Doe, log in with the right password.  Confirm login succeeds.

- [x] As Jane Doe, attempt to login with the wrong password.  Confirm login fails.
- [x] As Jane Doe, attempt to login with the right password. Confirm login succeeds.

- [x] As Jane Doe, log out and request a password reset. Change Jane Doe's password.
- [x] As Jane Doe, log out and attempt to login with old password.  Confirm login fails.
- [x] As Jane Doe, attempt to login with new password.  Confirm login succeeds.

- [x] As James Smith, attempt to log in with the wrong password 10 times.
    - [x] Confirm authentication timeout.
    - [x] Wait 15 minutes.
    - [x] Attempt to log in with the wrong password once.  Confirm login fails.
    - [x] Attempt to log in with the correct password.  Confirm log in succeeds.

### User Searching

Cases covering searching for users.

- [x] As Jane Doe, on the Find Friends page, search for "Admin", confirm list filtered.

### Posting

Cases covering making posts in all their forms and with all their attachments.

- [x] As John Doe, make a private post with just text.
- [x] As John Doe, make a private post with just an image.
- [x] As John Doe, make a post with just a link.
- [x] As John Doe, make a post with text and an image.
- [x] As John Doe, make a post with text and a link.
- [x] As John Doe, make a post mentioning Jane Doe.
    - [x] As Jane Doe, confirm notification.

- [x] As John Doe, write a post draft with a link.
    - [x] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [x] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [x] Log out.  Log back in. Confirm draft is gone.

### Reactions

- [x] As Admin, Like Jane Doe's post.
    - [x] As Admin, unlike Jane Doe's post.

- [x] As Admin, dislike Jane Doe's post.
     - [x] As Admin, remove dislike of Jane Doe's post.

- [x] As Admin, block Jane Doe's post.
    - [x] As Admin, remove block of Jane Doe's post.

- [x] As Jane Doe, react to each of John Doe's posts.

### Post Comments

- [x] As Admin, comment on John Doe's post.
    - [x] As Admin, edit comment.
    - [x] As Admin, delete comment.
    - [x] As Admin, comment on John Doe's post.
- [x] As John Doe, comment on Jane Doe's post.
- [x] As Jane Doe comment on same John Doe post that Admin did.
    - [x] As Jane Doe, edit comment.
    - [x] As Jane Doe, edit comment and cancel edit.
    - [x] As Jane Doe, delete comment.
    - [x] As Jane Doe, write comment and cancel before posting.
    - [x] As Jane Doe, comment on same John Doe post.
- [x] As Jane Doe, comment on Admin's post.
- [x] As Jane Doe, click on comment notification from Admin's comment.

### Post Subscriptions

- [x] As John Doe, unsubscribe from a post.
    - [x] As Jane Doe, comment on the post John Doe unsubscribed from. 
    - [x] As John Doe, confirm no email.
- [x] As John Doe, subscribe to the unsubscribed post.
    - [x] As Jane Doe, comment on the post John Doe unsubscribed from.
    - [x] As John Doe, confirm email.
 
### Profile Editing

- [x] As Jane Doe, upload a profile image and submit form.
- [x] As Jane Doe, remove profile image and submit form.
- [x] As Jane Doe, edit name and bio and submit form.
- [x] As Jane Doe, edit name and bio and don't submit form.
- [x] As Jane Doe, change email.  Confirm email.
- [x] As user2, change password. Log out and log back in with new password.

### Settings 

- [x] As Jane Doe, turn off Post Comments.
    - [x] As John Doe, comment on a Jane Doe post. Confirm no emails.
- [x] As Jane Doe, turn off friend requests.

### Admin Moderation

- [x] As John Doe, unfriend Admin.
- [x] As Jane Doe, unfriend Admin.

- [x] As John Doe, flag one of Jane Doe's posts.
    - [x] As Admin, confirm the flagged post shows up on the Admin Moderation queue.
    - [x] As Admin, approve the flagged post.
    - [x] As John Doe, confirm the flagged post remains visible in the feed and can no longer be flagged.
- [x] As John Doe, flag one of Jane Doe's comments.
    - [x] As Admin, confirm the flagged comment shows up on the Admin Moderation queue.
    - [x] As Admin, approve the flagged comment.
    - [x] As John Doe, confirm the flagged comment remains visible in the feed and can no longer be flagged.
- [x] As Jane Doe, flag one of John Doe's posts.
    - [x] As Admin, confirm the flagged post shows up on the Admin Moderation queue.
    - [x] As Admin, reject the flagged post with a reason.
    - [x] As Jane Doe, confirm the rejected post shows the moderation message and reason.
- [x] As Jane Doe, flag one of John Doe's comments.
    - [x] As Admin, confirm the flagged comment shows up on the Admin Moderation queue.
    - [x] As Admin, reject the flagged comment with a reason.
    - [x] As Jane Doe, confirm the rejected comment shows the moderation message and reason.

### Groups

#### Test 'open' Groups

- [x] As John Doe, create an "open" group named "Open Test Group"
    - [x] As John Doe, create a post in "Open Test Group".

- [x] As Jane Doe, attempt to view "Open Test Group", confirm posts and members are visible.
    - [x] As Jane Doe, attempt to view a specific post in "Open Test Group" by loading the direct link.  Confirm visible.

- [x] As John Doe, invite Jane Doe to "Open Test Group"
    - [x] As Jane Doe, reject the invite.
    - [x] As John Doe, invite Jane Doe to "Open Test Group"
    - [x] As Jane Doe, accept the invite and join the group.
    - [x] As Jane Doe, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As Jane Doe, post in the group.
    - [x] As Jane Doe, comment on John Doe's post in the group.

- [x] As John Doe, promote Jane Doe to "moderator".

- [x] As Jane Doe, invite James Smith to "Open Test Group"
    - [x] As James Smith, accept the email invite.
    - [x] As James Smith, accept the group invite.
    - [x] As James Smith, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As James Smith, post in the group.
    - [x] As James Smith, leave the group.
        - [x] Confirm James Smith's, post remains.
        - [x] As Jane Doe, comment on James Smith's post.  Confirm James Smith still subscribed and notified.

- [x] As John Doe, invite Maria Rodriguez to "Open Test Group" using an email
    - [x] As Maria Rodriguez, accept the email invite.
    - [x] As Maria Rodriguez, accept the group invite.
    - [x] As Maria Rodriguez, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As Maria Rodriguez, make a post.
    - [x] As John Doe, remove Maria Rodriguez from the group.
        - [x] Confirm Maria Rodriguez's post remains.
        - [x] As John Doe, comment on Maria Rodriguez's post.  Confirm Maria Rodriguez still subscribed and notified.
    - [x] As Maria Rodriguez, delete account.

- [x] As John Doe, flag Jane Doe's post in the group for Admin.
    - [x] As Admin, confirm flagged post shows up in Admin Moderation queue.
    - [x] As Admin, reject the flagged post with a reason.
    - [x] As John Doe, confirm the rejected post shows the moderation message and reason.
- [x] As John Doe, flag Jane Doe's comment on a post in the group.
    - [x] As Admin, confirm the flagged comment shows up in the Admin Moderation Queue.
    - [x] As Admin, reject the flagged comment.
    - [x] As John Doe, confirm the rejected comment shows the moderation message and reason.

- [x] As John Doe, promote Jane Doe to group "admin"

- [x] As John Doe, modify the group's profile in Settings.
- [x] As Jane Doe, modify the group's profile in Settings.
- [x] As John Doe, delete the group.
    - [ ] Confirm all posts deleted.

#### Test 'private' Groups

- [x] As John Doe, create a "private" group named "Private Test Group"
    - [x] As John Doe, create a post in "Private Test Group".

- [x] As Jane Doe, attempt to view "Private Test Group", confirm posts and members are *not* visible.
    - [x] As Jane Doe, attempt to view a specific post in "Private Test Group" by loading the direct link.  Confirm 404.

- [x] As John Doe, invite Jane Doe to "Private Test Group"
    - [x] As Jane Doe, reject the invite.
    - [x] As John Doe, invite Jane Doe to "Private Test Group".
    - [x] As Jane Doe, accept the invite and join the group.
    - [x] As Jane Doe, confirm posts and members are now visible.
        - [x] As Jane Doe, attempt to view a specific post in "Private Test Group" by loading the direct link, confirm visible.
        - [x] As Jane Doe, comment on the viewed post.
        - [x] As Jane Doe, post in the group.

- [x] As John Doe, promote Jane Doe to "moderator".

- [x] As Jane Doe, invite James Smith to "Private Test Group"
    - [x] As James Smith, accept the email invite.
    - [x] As James Smith, accept the group invite.
    - [x] As James Smith, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As James Smith, post in the group.
    - [x] As James Smith, leave the group.
        - [x] As James Smith, confirm post no longer visible.
        - [x] As Jane Doe, confirm James Smith's, post remains.
        - [x] As Jane Doe, comment on James Smith's post.  Confirm James Smith is *not* still subscribed and *not* notified.

- [x] As John Doe, invite Maria Rodriguez to "Private Test Group" using an email
    - [x] As Maria Rodriguez, accept the email invite.
    - [x] As Maria Rodriguez, accept the group invite.
    - [x] As Maria Rodriguez, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As Maria Rodriguez, make a post.
    - [x] As John Doe, remove Maria Rodriguez from the group.
        - [x] As John Doe, confirm Maria Rodriguez's post remains.
        - [x] As John Doe, comment on Maria Rodriguez's post.  Confirm Maria Rodriguez is *not* still subscribed and is *not* notified.
        - [x] As Maria Rodriguez, confirm Maria Rodriguez's post is no longer visible.
    - [x] As Maria Rodriguez, delete account.

- [x] As John Doe, flag Jane Doe's post in the group for Admin.
    - [x] As Admin, confirm flagged post shows up in Admin Moderation queue.
    - [x] As Admin, reject the flagged post with a reason.
    - [x] As John Doe, confirm the rejected post shows the moderation message and reason.
- [x] As John Doe, flag Jane Doe's comment on a post in the group.
    - [x] As Admin, confirm the flagged comment shows up in the Admin Moderation Queue.
    - [x] As Admin, reject the flagged comment.
    - [x] As John Doe, confirm the rejected comment shows the moderation message and reason.

- [x] As John Doe, promote Jane Doe to group "admin"

- [x] As John Doe, modify the group's profile in Settings.
- [x] As Jane Doe, modify the group's profile in Settings.
- [x] As John Doe, delete the group.
    - [x] Confirm all posts deleted.

#### Test 'hidden' Groups

- [x] As John Doe, create a "hidden" group named "Hidden Test Group"
    - [x] As John Doe, create a post in "Hidden Test Group".

- [x] As Jane Doe, attempt to view "Hidden Test Group", confirm 404.
    - [x] As Jane Doe, attempt to view a specific post in "Hidden Test Group" by loading the direct link, confirm 404.

- [x] As John Doe, invite Jane Doe to "Hidden Test Group"
    - [x] As Jane Doe, confirm "Hidden Test Group" is visible.
    - [x] As Jane Doe, reject the invite.
    - [x] As Jane Doe, confirm group is no longer visible.
    - [x] As John Doe, invite Jane Doe to "Hidden Test Group".
    - [x] As Jane Doe, accept the invite and join the group.
    - [x] As Jane Doe, confirm posts and members are now visible.
        - [x] As Jane Doe, attempt to view a specific post in "Hidden Test Group" by loading the direct link, confirm visible.
        - [x] As Jane Doe, comment on the viewed post.
        - [x] As Jane Doe, post in the group.

- [x] As John Doe, invite James Smith to "Hidden Test Group" using an email
    - [x] As James Smith, accept the email invite.
    - [x] As James Smith, confirm group is visible.
    - [x] As James Smith, accept the group invite.
    - [x] As James Smith, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As James Smith, post in the group.
    - [x] As James Smith, leave the group.
        - [x] As James Smith, confirm group is no longer visible.
        - [x] As James Smith, confirm post is no longer visible.
        - [x] As Jane Doe, confirm James Smith's, post remains.
        - [x] As Jane Doe, comment on James Smith's post.  Confirm James Smith is *not* still subscribed and *not* notified.

- [x] As John Doe, invite Maria Rodriguez to "Hidden Test Group" using an email
    - [x] As Maria Rodriguez, accept the email invite.
    - [x] As Maria Rodriguez, confirm the group is visible.
    - [x] As Maria Rodriguez, accept the group invite.
    - [x] As Maria Rodriguez, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As Maria Rodriguez, make a post.
    - [x] As John Doe, remove Maria Rodriguez from the group.
        - [x] As John Doe, confirm Maria Rodriguez's post remains.
        - [x] As John Doe, comment on Maria Rodriguez's post.  Confirm Maria Rodriguez is *not* still subscribed and is *not* notified.
        - [x] As Maria Rodriguez, confirm Maria Rodriguez's post is no longer visible.
        - [x] As Maria Rodriguez, confirm the group is no longer visible.
    - [x] As Maria Rodriguez, delete account.
 
- [x] As John Doe, flag Jane Doe's post in the group for Admin.
    - [x] As Admin, confirm flagged post shows up in Admin Moderation queue.
    - [x] As Admin, reject the flagged post with a reason.
    - [x] As John Doe, confirm the rejected post shows the moderation message and reason.
- [x] As John Doe, flag Jane Doe's comment on a post in the group.
    - [x] As Admin, confirm the flagged comment shows up in the Admin Moderation Queue.
    - [x] As Admin, reject the flagged comment.
    - [x] As John Doe, confirm the rejected comment shows the moderation message and reason.

- [x] As John Doe, promote Jane Doe to group "admin"

- [x] As John Doe, modify the group's profile in Settings.
- [x] As Jane Doe, modify the group's profile in Settings.
- [x] As John Doe, delete the group.
    - [x] Confirm all posts deleted.

