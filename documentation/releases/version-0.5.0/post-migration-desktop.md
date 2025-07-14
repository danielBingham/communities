## Regression

### User Registration

Cases covering the User Registration flow.

- [ ] Register a new user named James Johnson with username `james-johnson` (communities-james-johnson@mailinator.com)
    - [ ] Attempt to register with too short a password.
        - [ ] Confirm validation error.
    - [ ] Attempt to register without checking Age Confirmation.
        - [ ] Confirm validation error.
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.

- [ ] Register a new user named Marcia Garcia (communities-marcia-garcia@mailinator.com)
    - [ ] Attempt to register with the username `james-johnson`
        - [ ] Confirm validation error.
    - [ ] Register with the username `marcia-garcia`
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.

### User Invitation

Cases covering the User Invitation flow, in which a user is sent an invitation
email and may use it to register on the platform.

- [ ] From the administrator (Admin) account invite John Doe (communities-john-doe@mailinator.com).
    - [ ] As Admin, Confirm invitation is visible on the "Friend Requests" page.
    - [ ] As John Doe, Accept the invite and register John Doe with username `john-doe`
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.
    - [ ] As John Doe, accept the friend request and view Admin's profile page.

- [ ] As John Doe, invite Jane Doe (communities-jane.doe@mailiantor.com).
    - [ ] As John Doe, confirm invitation is visible on the "Friend Requests" page.
    - [ ] As John Doe, from the same browser session attempt to accept the invite.
        - [ ] Expectation: Error.
    - [ ] As Admin, confirm the invitation is *not* visible on the "Friend Requests" page.
    - [ ] From a different browser session accept the invite and register Jane Doe with username `jane.doe`.
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.
    - [ ] As Jane Doe, accept the friend request and view John Doe's profile page.

- [ ] As Jane Doe, invite James Smith (communities-james_smith@mailinator.com).
    - [ ] As Jane Doe, confirm the invitation is visible on the "Friend Requests" page.
    - [ ] From a different browser session accept the invite and register James Smith with username `james_smith`.
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.
    - [ ] As James Smith, accept the Friend Request and view Jane Doe's profile page.

### Friend Requests

Cases covering sending friend requests, accepting friend requests, and
rejecting friend requests.

- [ ] As Jane Doe, send Admin a friend request.
    - [ ] As admin, reject the friend request.  Confirm its removed.

- [ ] As Jane Doe, send Admin a friend request.
     - [ ] As Admin, accept the friend request. Confirm request accepted.
     - [ ] As Admin, remove Jane Doe as a friend.

- [ ] As Jane Doe, send Admin a friend request.
    - [ ] As Admin, confirm friend request visible.
    - [ ] As Jane Doe, cancel the friend request. Confirm removed.
    - [ ] As Admin, confirm removed.

- [ ] With two browser windows open, one As Admin and one As Jane Doe, have Jane Doe
     and Admin send each other simultaneous friend requests.  Confirm relationship
     confirmed.

### Authentication

Cases covering the authentication system, logging in, logging out, reset
password flow, etc.

- [ ] As John Doe, log out.
- [ ] As John Doe, attempt to log in with the wrong password. Confirm login fails.
- [ ] As John Doe, log in with the right password.  Confirm login succeeds.

- [ ] As Jane Doe, attempt to login with the wrong password.  Confirm login fails.
- [ ] As Jane Doe, attempt to login with the right password. Confirm login succeeds.

- [ ] As Jane Doe, log out and request a password reset. Change Jane Doe's password.
- [ ] As Jane Doe, log out and attempt to login with old password.  Confirm login fails.
- [ ] As Jane Doe, attempt to login with new password.  Confirm login succeeds.

- [ ] As James Smith, attempt to log in with the wrong password 10 times.
    - [ ] Confirm authentication timeout.
    - [ ] Wait 15 minutes.
    - [ ] Attempt to log in with the wrong password once.  Confirm login fails.
    - [ ] Attempt to log in with the correct password.  Confirm log in succeeds.

### User Searching

Cases covering searching for users.

- [ ] As Jane Doe, on the Find Friends page, search for "Admin", confirm list filtered.

### Posting

Cases covering making posts in all their forms and with all their attachments.

- [ ] As John Doe, make a private post with just text.
- [ ] As John Doe, make a private post with just an image.
- [ ] As John Doe, make a post with just a link.
- [ ] As John Doe, make a post with text and an image.
- [ ] As John Doe, make a post with text and a link.
- [ ] As John Doe, make a post mentioning Jane Doe.
    - [ ] As Jane Doe, confirm notification.

- [ ] As John Doe, write a post draft with a link.
    - [ ] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [ ] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [ ] Log out.  Log back in. Confirm draft is gone.

### Reactions

- [ ] As Admin, Like Jane Doe's post.
    - [ ] As Admin, unlike Jane Doe's post.

- [ ] As Admin, dislike Jane Doe's post.
     - [ ] As Admin, remove dislike of Jane Doe's post.

- [ ] As Admin, block Jane Doe's post.
    - [ ] As Admin, remove block of Jane Doe's post.

- [ ] As Jane Doe, react to each of John Doe's posts.

### Post Comments

- [ ] As Admin, comment on John Doe's post.
    - [ ] As Admin, edit comment.
    - [ ] As Admin, delete comment.
    - [ ] As Admin, comment on John Doe's post.
- [ ] As John Doe, comment on Jane Doe's post.
- [ ] As Jane Doe comment on same John Doe post that Admin did.
    - [ ] As Jane Doe, edit comment.
    - [ ] As Jane Doe, edit comment and cancel edit.
    - [ ] As Jane Doe, delete comment.
    - [ ] As Jane Doe, write comment and cancel before posting.
    - [ ] As Jane Doe, comment on same John Doe post.
- [ ] As Jane Doe, comment on Admin's post.
- [ ] As Jane Doe, click on comment notification from Admin's comment.

### Post Subscriptions

- [ ] As John Doe, unsubscribe from a post.
    - [ ] As Jane Doe, comment on the post John Doe unsubscribed from. 
    - [ ] As John Doe, confirm no email.
- [ ] As John Doe, subscribe to the unsubscribed post.
    - [ ] As Jane Doe, comment on the post John Doe unsubscribed from.
    - [ ] As John Doe, confirm email.
 
### Profile Editing

- [ ] As Jane Doe, upload a profile image and submit form.
- [ ] As Jane Doe, remove profile image and submit form.
- [ ] As Jane Doe, edit name and bio and submit form.
- [ ] As Jane Doe, edit name and bio and don't submit form.
- [ ] As Jane Doe, change email.  Confirm email.
- [ ] As user2, change password. Log out and log back in with new password.

### Settings 

- [ ] As Jane Doe, turn off Post Comments.
    - [ ] As John Doe, comment on a Jane Doe post. Confirm no emails.
- [ ] As Jane Doe, turn off friend requests.

### Admin Moderation

- [ ] As John Doe, unfriend Admin.
- [ ] As Jane Doe, unfriend Admin.

- [ ] As John Doe, flag one of Jane Doe's posts.
    - [ ] As Admin, confirm the flagged post shows up on the Admin Moderation queue.
    - [ ] As Admin, approve the flagged post.
    - [ ] As John Doe, confirm the flagged post remains visible in the feed and can no longer be flagged.
- [ ] As John Doe, flag one of Jane Doe's comments.
    - [ ] As Admin, confirm the flagged comment shows up on the Admin Moderation queue.
    - [ ] As Admin, approve the flagged comment.
    - [ ] As John Doe, confirm the flagged comment remains visible in the feed and can no longer be flagged.
- [ ] As Jane Doe, flag one of John Doe's posts.
    - [ ] As Admin, confirm the flagged post shows up on the Admin Moderation queue.
    - [ ] As Admin, reject the flagged post with a reason.
    - [ ] As Jane Doe, confirm the rejected post shows the moderation message and reason.
- [ ] As Jane Doe, flag one of John Doe's comments.
    - [ ] As Admin, confirm the flagged comment shows up on the Admin Moderation queue.
    - [ ] As Admin, reject the flagged comment with a reason.
    - [ ] As Jane Doe, confirm the rejected comment shows the moderation message and reason.

### Groups

#### Test 'open' Groups

- [ ] As John Doe, create an "open" group named "Open Test Group"
    - [ ] As John Doe, create a post in "Open Test Group".

- [ ] As Jane Doe, attempt to view "Open Test Group", confirm posts and members are visible.
    - [ ] As Jane Doe, attempt to view a specific post in "Open Test Group" by loading the direct link.  Confirm visible.

- [ ] As John Doe, invite Jane Doe to "Open Test Group"
    - [ ] As Jane Doe, reject the invite.
    - [ ] As John Doe, invite Jane Doe to "Open Test Group"
    - [ ] As Jane Doe, accept the invite and join the group.
    - [ ] As Jane Doe, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As Jane Doe, post in the group.
    - [ ] As Jane Doe, comment on John Doe's post in the group.

- [ ] As John Doe, promote Jane Doe to "moderator".

- [ ] As Jane Doe, invite James Smith to "Open Test Group"
    - [ ] As James Smith, accept the email invite.
    - [ ] As James Smith, accept the group invite.
    - [ ] As James Smith, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As James Smith, post in the group.
    - [ ] As James Smith, leave the group.
        - [ ] Confirm James Smith's, post remains.
        - [ ] As Jane Doe, comment on James Smith's post.  Confirm James Smith still subscribed and notified.

- [ ] As John Doe, invite Maria Rodriguez to "Open Test Group" using an email
    - [ ] As Maria Rodriguez, accept the email invite.
    - [ ] As Maria Rodriguez, accept the group invite.
    - [ ] As Maria Rodriguez, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As Maria Rodriguez, make a post.
    - [ ] As John Doe, remove Maria Rodriguez from the group.
        - [ ] Confirm Maria Rodriguez's post remains.
        - [ ] As John Doe, comment on Maria Rodriguez's post.  Confirm Maria Rodriguez still subscribed and notified.
    - [ ] As Maria Rodriguez, delete account.

- [ ] As John Doe, flag Jane Doe's post in the group for Admin.
    - [ ] As Admin, confirm flagged post shows up in Admin Moderation queue.
    - [ ] As Admin, reject the flagged post with a reason.
    - [ ] As John Doe, confirm the rejected post shows the moderation message and reason.
- [ ] As John Doe, flag Jane Doe's comment on a post in the group.
    - [ ] As Admin, confirm the flagged comment shows up in the Admin Moderation Queue.
    - [ ] As Admin, reject the flagged comment.
    - [ ] As John Doe, confirm the rejected comment shows the moderation message and reason.

- [ ] As John Doe, promote Jane Doe to group "admin"

- [ ] As John Doe, modify the group's profile in Settings.
- [ ] As Jane Doe, modify the group's profile in Settings.
- [ ] As John Doe, delete the group.
    - [ ] Confirm all posts deleted.

#### Test 'private' Groups

- [ ] As John Doe, create a "private" group named "Private Test Group"
    - [ ] As John Doe, create a post in "Private Test Group".

- [ ] As Jane Doe, attempt to view "Private Test Group", confirm posts and members are *not* visible.
    - [ ] As Jane Doe, attempt to view a specific post in "Private Test Group" by loading the direct link.  Confirm 404.

- [ ] As John Doe, invite Jane Doe to "Private Test Group"
    - [ ] As Jane Doe, reject the invite.
    - [ ] As John Doe, invite Jane Doe to "Private Test Group".
    - [ ] As Jane Doe, accept the invite and join the group.
    - [ ] As Jane Doe, confirm posts and members are now visible.
        - [ ] As Jane Doe, attempt to view a specific post in "Private Test Group" by loading the direct link, confirm visible.
        - [ ] As Jane Doe, comment on the viewed post.
        - [ ] As Jane Doe, post in the group.

- As John Doe, promote Jane Doe to "moderator".

- [ ] As Jane Doe, invite James Smith to "Private Test Group"
    - [ ] As James Smith, accept the email invite.
    - [ ] As James Smith, accept the group invite.
    - [ ] As James Smith, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As James Smith, post in the group.
    - [ ] As James Smith, leave the group.
        - [ ] As James Smith, confirm post no longer visible.
        - [ ] As Jane Doe, confirm James Smith's, post remains.
        - [ ] As Jane Doe, comment on James Smith's post.  Confirm James Smith is *not* still subscribed and *not* notified.

- [ ] As John Doe, invite Maria Rodriguez to "Private Test Group" using an email
    - [ ] As Maria Rodriguez, accept the email invite.
    - [ ] As Maria Rodriguez, accept the group invite.
    - [ ] As Maria Rodriguez, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As Maria Rodriguez, make a post.
    - [ ] As John Doe, remove Maria Rodriguez from the group.
        - [ ] As John Doe, confirm Maria Rodriguez's post remains.
        - [ ] As John Doe, comment on Maria Rodriguez's post.  Confirm Maria Rodriguez is *not* still subscribed and is *not* notified.
        - [ ] As Maria Rodriguez, confirm Maria Rodriguez's post is no longer visible.
    - [ ] As Maria Rodriguez, delete account.

- [ ] As John Doe, flag Jane Doe's post in the group for Admin.
    - [ ] As Admin, confirm flagged post shows up in Admin Moderation queue.
    - [ ] As Admin, reject the flagged post with a reason.
    - [ ] As John Doe, confirm the rejected post shows the moderation message and reason.
- [ ] As John Doe, flag Jane Doe's comment on a post in the group.
    - [ ] As Admin, confirm the flagged comment shows up in the Admin Moderation Queue.
    - [ ] As Admin, reject the flagged comment.
    - [ ] As John Doe, confirm the rejected comment shows the moderation message and reason.

- [ ] As John Doe, promote Jane Doe to group "admin"

- [ ] As John Doe, modify the group's profile in Settings.
- [ ] As Jane Doe, modify the group's profile in Settings.
- [ ] As John Doe, delete the group.
    - [ ] Confirm all posts deleted.

#### Test 'hidden' Groups

- [ ] As John Doe, create a "hidden" group named "Hidden Test Group"
    - [ ] As John Doe, create a post in "Hidden Test Group".

- [ ] As Jane Doe, attempt to view "Hidden Test Group", confirm 404.
    - [ ] As user2, attempt to view a specific post in "Hidden Test Group" by loading the direct link, confirm 404.

- [ ] As John Doe, invite Jane Doe to "Hidden Test Group"
    - [ ] As Jane Doe, confirm "Hidden Test Group" is visible.
    - [ ] As Jane Doe, reject the invite.
    - [ ] As Jane Doe, confirm group is no longer visible.
    - [ ] As John Doe, invite Jane Doe to "Hidden Test Group".
    - [ ] As Jane Doe, accept the invite and join the group.
    - [ ] As Jane Doe, confirm posts and members are now visible.
        - [ ] As Jane Doe, attempt to view a specific post in "Hidden Test Group" by loading the direct link, confirm visible.
        - [ ] As Jane Doe, comment on the viewed post.
        - [ ] As Jane Doe, post in the group.

- [ ] As Jane Doe, invite James Smith to "Hidden Test Group" using an email
    - [ ] As James Smith, accept the email invite.
    - [ ] As James Smith, confirm group is visible.
    - [ ] As James Smith, accept the group invite.
    - [ ] As James Smith, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As James Smith, post in the group.
    - [ ] As James Smith, leave the group.
        - [ ] As James Smith, confirm group is no longer visible.
        - [ ] As James Smith, confirm post is no longer visible.
        - [ ] As Jane Doe, confirm James Smith's, post remains.
        - [ ] As Jane Doe, comment on James Smith's post.  Confirm James Smith is *not* still subscribed and *not* notified.

- [ ] As John Doe, invite Maria Rodriguez to "Hidden Test Group" using an email
    - [ ] As Maria Rodriguez, accept the email invite.
    - [ ] As Maria Rodriguez, confirm the group is visible.
    - [ ] As Maria Rodriguez, accept the group invite.
    - [ ] As Maria Rodriguez, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As Maria Rodriguez, make a post.
    - [ ] As John Doe, remove Maria Rodriguez from the group.
        - [ ] As John Doe, confirm Maria Rodriguez's post remains.
        - [ ] As John Doe, comment on Maria Rodriguez's post.  Confirm Maria Rodriguez is *not* still subscribed and is *not* notified.
        - [ ] As Maria Rodriguez, confirm Maria Rodriguez's post is no longer visible.
        - [ ] As Maria Rodriguez, confirm the group is no longer visible.
    - [ ] As Maria Rodriguez, delete account.
 
- [ ] As John Doe, flag Jane Doe's post in the group for Admin.
    - [ ] As Admin, confirm flagged post shows up in Admin Moderation queue.
    - [ ] As Admin, reject the flagged post with a reason.
    - [ ] As John Doe, confirm the rejected post shows the moderation message and reason.
- [ ] As John Doe, flag Jane Doe's comment on a post in the group.
    - [ ] As Admin, confirm the flagged comment shows up in the Admin Moderation Queue.
    - [ ] As Admin, reject the flagged comment.
    - [ ] As John Doe, confirm the rejected comment shows the moderation message and reason.

- [ ] As John Doe, promote Jane Doe to group "admin"

- [ ] As John Doe, modify the group's profile in Settings.
- [ ] As Jane Doe, modify the group's profile in Settings.
- [ ] As John Doe, delete the group.
    - [ ] Confirm all posts deleted.

