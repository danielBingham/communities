# Full Regression

For each heading, copy the `Cases` section of the linked file under the heading and execute the test cases within.

## [Create User: Invitation](documentation/testing/test-cases/User/create/invitation.md)

Cases covering the User Registration flow.

### Pre-requisites

No pre-requisites.

### Cases

- [x] Register a new user named John Doe with username `john-doe` (communities-john-doe@mailinator.com)
    - [x] Attempt to register with too short a password.
        - [x] Confirm validation error.
    - [x] Attempt to register without checking Age Confirmation.
        - [x] Confirm validation error.
    - [x] Successfully register.
        - [x] Confirm email.
        - [x] Accept Terms of Service.
        - [x] Skip Pay What you Can.
    - [x] Turn off all email notifications.

- [x] Register a new user named Jane Doe (communities-jane-doe@mailinator.com)
    - [x] Attempt to register with the username `john-doe`
        - [x] Confirm validation error.
    - [x] Register with the username `jane-doe`
    - [x] Successfully register.
        - [x] Confirm email.
        - [x] Accept Terms of Service.
        - [x] Skip Pay What you Can.
    - [x] Turn off all email notifications.

## [Create User: Invitation](documentation/testing/test-cases/User/create/invitation.md)

Cases covering the User Invitation flow, in which a user is sent an invitation
email and may use it to register on the platform.

### Pre-requisites

- [x] User1 has been registered and has made a private post.
- [x] User2 has been registered and has made a public post.

### Cases

- [x] As User1 invite James Smith (communities-james-smith@mailinator.com).
    - [x] As User1, confirm invitation is visible on the "Friend Requests" page.
    - [x] As James Smith, Accept the invite and register James Smith with username `james-smith`
    - [x] Successfully register.
        - [x] Confirm email.
        - [x] Accept Terms of Service.
        - [x] Skip Pay What you Can.
    - [x] Turn off all email notifications.
    - [x] As James Smith, attempt to view User1's profile.  Confirm private post not visible.
    - [x] As James Smith, accept the friend request and view User1's profile page.

- [x] As User2, invite Jenny Smith (communities-jenny-smith@mailiantor.com).
    - [x] As User2, confirm invitation is visible on the "Friend Requests" page.
    - [x] As Jenny Smith, from the same browser session attempt to accept the invite.
        - [x] Expectation: Error.
    - [x] As User1, confirm the invitation is *not* visible on the "Friend Requests" page.
    - [x] From a different browser session accept the invite and register Jenny Smith with username `jenny-smith`.
    - [x] Successfully register.
        - [x] Confirm email.
        - [x] Accept Terms of Service.
        - [x] Skip Pay What you Can.
    - [x] Turn off all email notifications.
    - [x] As Jenny Smith, accept the friend request and view User1's profile page.
    
## [Update User: Profile](documentation/testing/test-cases/User/update/profile.md)

Cases covering the user updating their profile.

### Pre-requisites

- [ ] User1 has registered.

### Cases

- [x] User can upload a profile image.
    1. As User1:
        1. Select "Edit Profile" from the User Menu.
        2. Click Upload Image and choose a profile image. Submit.
        3. Confirm image successfully uploaded.

- [x] User can crop an uploaded profile image.
    1. As User1:
        1. Select "Edit Profile" from the User Menu.
        2. Click Upload Image and choose a profile image that does not have a 1:1 aspect ratio. 
        3. Confirm image successfully uploaded.
        4. Drag the crop box to an appropriate crop.  Submit the profile form. 
        5. Confirm the image is cropped to the chose crop box.

- [x] User can remove an uploaded profile image.
    1. As User1:
        1. Select "Edit Profile" from the User Menu.
        2. Click "Remove Image" under your profile image.  Confirm image removed.
        3. Submit the form. Confirm image removed.

- [x] User can edit "Name".
    1. As User1:
        1. Select "Edit Profile" from the User Menu.
        2. Make a change to the "Name" field.
        3. Submit the form.  Confirm name updated.

- [x] User can edit "About You".
    1. As User1:
        1. Select "Edit Profile" from the User Menu.
        2. Make a change to the "About You" field.
        3. Submit the form.  Navigate to profile page and confirm About You updated.

- [x] User update form doesn't commit updates until submitted.
    1. As User1:
        1. Select "Edit Profile" from the User Menu.
        2. Change your profile picture.
        3. Make a change to the "Name" field.
        4. Make a change to the "About You" field.
        5. In a separate tab, navigate to your profile page. Confirm changes do not show.
        6. Submit the form.
        7. Refresh your separate tab and confirm the changes do show.

- [x] User can update email and is required to confirm new email.
    1. As User1:
        1. Select "Change Email" from the User Menu.
        2. Enter a new email and your current password.
        3. Submit. 
        4. Confirm you are limited to the "Confirm your email" screen.
        5. Open your email client (mailinator) to the new email. Confirm email is present.
        6. Click "Resend Confirmation".
        7. In your email client, confirm second email arrives.
        8. Click the confirmation link in the email.  Confirm email is updated and access to the platform restored.
        9. Log out.
        10. Log in using the new email.  Confirm login successful.

- [x] User can change password.
    1. As User1:
        1. Select "Change Password" from the User Menu.
        2. Enter a new password. 
        3. Enter a different password in the "Confirm Password" field.  Confirm validation error.
        4. Enter the correct new password in the "Confirm Password" field.
        5. Enter an incorrect old password in the "Old Password" field.
        6. Submit the form.  Confirm submission fails.
        7. Enter the correct old password in the "Old Password" field.
        8. Submit the form. Confirm form submits successful and reports success.
        9. Log out.
        10. Attempt to log in using old password.  Confirm login fails.
        11. Log in using the new password.  Confirm log in is successful.

## [Update User: Preferences](documentation/testing/test-cases/User/update/preferences.md)

Cases covering the user updating their profile.

### Pre-requisites

- [ ] User1 has registered.

### Cases

- [x] Should not receive Info posts in feed when turned off. 
    1. As User1, confirm info posts are present in your feed.
        1. If not, log into an admin user and create some info posts.
    2. As User1, navigate to User Menu -> Preferences.
    3. Toggle Info posts to "off".
    4. Return to your feed.
    5. Confirm info posts *are not* shown.

- [x] Should receive Info posts in feed when turned on. 
    1. As User1, navigate to User Menu -> Preferences.
    2. Toggle Info posts to "on".
    3. Return to your feed.
    4. Confirm info posts *are* shown.

- [x] Announcement posts can be turned off.
    1. As User1, confirm announcement posts are in your feed.
        1. If not, log into an admin user and create some announcement posts.
    2. As User1, navigate to User Menu -> Preferences.
    3. Toggle Announcement posts to "off".
    4. Return to your feed.
    5. Confirm announcement posts are not shown.

- [x] Announcement posts can be turned back on.
    1. As User1, navigate to User Menu -> Preferences
    2. Toggle Announcement posts to "on"
    3. Return to your feed.
    4. Confirm Announcement posts *are* shown.

## [Update User: Notifications](documentation/testing/text-cases/User/update/notifications.md)
## [Query User](documentation/testing/test-cases/User/query.md)

Cases covering searching for users.

### Pre-requisites

- [ ] Have created a full page of users using random names (IE from https://1000randomnames.com/).

### Cases

- [x] Should be able to search for people by name on the Find Users page.
- [x] Should be able to search for people by name on the Your Friends page.
- [x] Should be able to search for people by name on the Pending -> Requests page.

## [UserRelationship](documentation/testing/test-cases/UserRelationship/create-update-delete.md)

Cases covering sending friend requests, accepting friend requests, and
rejecting friend requests.

### Pre-requisites

- [x] User1 has been created.
- [x] User2 has been created.
- [x] User1 and User2 are not friends.

### Cases

- [x] Users can send friend requests.
    - [x] As User1, send User2 a friend request.
        - [x] As User1, confirm request shows on "Friend Requests" view.
        - [x] As User2, confirm friend request notification.
        - [x] As User2, confirm request shows on "Friend Requests" view.
        - [x] As User1, confirm "Cancel Request" shows on User2's profile.
        - [x] As User2, confirm "Accept" or "Reject" show on User1's profile.
    - [x] As User1, cancel the request.

- [x] Users can reject friend requests.
    - [x] As User1, send User2 a friend request.
    - [x] As User2, reject the friend request.
    - [x] As User2, confirm friend request is removed from profile.
    - [x] As User2, confirm friend request is removed from "Friend Requests" view.

- [x] Users can remove friends.
    - [x] As User1, send User2 a friend request.
    - [x] As User2, accept the friend request. Confirm request accepted.
    - [x] As User2, remove User1 as a friend. Confirm request removed.

- [x] It doesn't matter which user (requester or accepter) removes the request.
    - [x] As User1, send User2 a friend request.
    - [x] As User2, accept the friend request. Confirm request accepted.
    - [x] As User1, remove User2 as a friend. Confirm request removed.

- [x] Users can cancel friend requests they send.
    - [x] As User1, send User2 a friend request.
    - [x] As User2, confirm friend request visible.
    - [x] As User1, cancel the friend request. Confirm removed.
    - [x] As User2, confirm removed.

- [x] Users can simultaneously remove each other without error.
    - [x] As User1, send User2 a friend request.
    - [x] As User2, accept the request.
    - [x] With two browser windows open, one As User1 and one As User2,
         simultaneously remove each other as friends.

- [x] Users can simultaneously add each other as friends and the request will
     be auto-approved.
    - [x] With two browser windows open, one As User2 and one As User1, have User1
         and User2 send each other simultaneous friend requests.  Confirm relationship
         confirmed.

## [Authentication](documentation/testing/test-cases/Authentication/authentication.md)

Cases covering the authentication system, logging in, logging out, reset
password flow, etc.

### Pre-requisites

- [x] User1 has been created.
- [x] User2 has been created.
- [x] User3 has been created.

### Cases

- [x] As User1, log out.
- [x] As User1, attempt to log in with the wrong password. Confirm login fails.
- [x] As User1, log in with the right password.  Confirm login succeeds.

- [x] As User2, attempt to login with the wrong password.  Confirm login fails.
- [x] As User2, attempt to login with the right password. Confirm login succeeds.

#### Reset Password

- [x] As User2, log out and request a password reset. Change User2's password.
- [x] As User2, log out and attempt to login with old password.  Confirm login fails.
- [x] As User2, attempt to login with new password.  Confirm login succeeds.

#### Authentication Lockout 

- [x] As User3, attempt to log in with the wrong password 10 times.
    - [x] Confirm authentication timeout.
    - [ ] Wait 15 minutes.
    - [ ] Attempt to log in with the wrong password once.  Confirm login fails.
    - [ ] Attempt to log in with the correct password.  Confirm log in succeeds.

## [Create Post](documentation/testing/test-cases/Post/create.md)

Cases covering making posts in all their forms and with all their attachments.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created who is not friends with User1.
- [ ] User3 have been created and is friends with User1.

### Cases

#### Private Posts

- [x] As User1, make a private post with just text.
- [x] As User1, make a private post with just an image.
- [x] As User1, make a private post with just a link.
- [x] As User1, make a private post with text and an image.
- [x] As User1, make a private post with text and a link.

#### Public Posts

- [x] As User1, make a public post with just text.
- [x] As User1, make a public post with just an image.
- [x] As User1, make a public post with just a link.
- [x] As User1, make a public post with text and an image.
- [x] As User1, make a public post with text and a link.

#### Shares

- [x] As User2, visit User1's profile and share a public post with text.
- [x] As User2, visit User1's profile and share a public post with an image.
- [x] As User2, visit User1's profile and share a public post with a link.
- [x] As User2, visit User1's profile and share a public post with text and an image.
- [x] As USer2, visit User1's profile and share a public with with text and a link.

- [x] As User3, visit User1's profile and share a public post with text.
- [x] As User3, visit User1's profile and share a public post with an image.
- [x] As User3, visit User1's profile and share a public post with a link.
- [x] As User3, visit User1's profile and share a public post with text and an image.
- [x] As USer3, visit User1's profile and share a public with with text and a link.


#### Mentions

- [x] As User3, make a post mentioning User1.
    - [x] As User1, confirm notification.

#### Links

- [x] As User1, make a post with a link in the body. Confirm highlighted.
- [x] As User1, make a post with a link with a long string in the body.  Confirm it doesn't expand the view on mobile.

#### Long String

- [x] As User1, make a post with a 500 character unbroken string.
    - [x] Confirm the mobile view is not expanded and the string is broken appropriately.

#### Post Drafts

- [x] As User1, write a post draft with an image.
    - [x] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [x] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [x] Post the draft. Confirm draft posts correctly.

- [x] As User1, write a post draft with an image.
    - [x] Log out. Log back in. Confirm draft is gone.

- [x] As User1, write a post draft with a link.
    - [x] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [x] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [x] Post the draft.  Confirm draft posts correctly. 

- [x] As User1, write a post draft with a link.
    - [x] Log out. Log back in. Confirm draft is gone.

#### Youtube Videos

- [x] As User1, create a post with a youtube video for a link, using the full link (`/watch?vid=`)
    - [x] Confirm embed loads.
    - [x] Post the post.  Confirm the embed will play.
- [x] As User1, create a post with a youtube video for a link using the shorted link (`youtu.be`)
    - [x] Confirm the embed loads.
    - [x] Post the post. Confirm the embed will play.

## [Update Post](documentation/testing/test-cases/Post/update.md)

Test cases related to editing posts.

### Pre-requisites

- [x] User1 has been created.
- [x] User2 has been created.

### Cases

#### Post Editing

- [x] As User1, create a post with text and an image.
    - [x] Edit the post and change the text.  Save the edit.  Confirm post updated appropriately.
    - [x] Edit the post and change the image.  Save the edit and confirm the post updated appropriately.
    - [x] Edit the post and change the text. Cancel the edit and confirm the post was not updated.
    - [x] Edit the post and change the image.  Cancel the edit and confirm the post was not updated.

- [x] As User1, create a post with text an a link.
    - [x] Edit the post and change the text.  Save the edit.  Confirm post updated appropriately.
    - [x] Edit the post and change the link.  Save the edit and confirm the post updated appropriately.
    - [x] Edit the post and change the text. Cancel the edit and confirm the post was not updated.
    - [x] Edit the post and change the link.  Cancel the edit and confirm the post was not updated.

- [ ] As User1, create a public post with text and a link.
    - [ ] As User2, share User1's post.
    - [ ] As User1, edit the shared post and change the text and the link.  Save the edit.
    - [ ] As User2, confirm the share updated appropriately.

#### Post Edit Drafts

- [ ] As User1, edit post with an image - change text and image.
    - [ ] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [ ] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [ ] Post the draft. Confirm draft posts correctly.

- [ ] As User1, edit a post with an image - change text and image.
    - [ ] Log out. Log back in. Confirm draft is gone.

- [ ] As User1, edit a post with a link - change text and link.
    - [ ] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [ ] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [ ] Post the draft.  Confirm draft posts correctly. 

- [ ] As User1, edit a post with a link - change text and link.
    - [ ] Log out. Log back in. Confirm draft is gone.

## [Delete Post](documentation/testing/test-cases/Post/delete.md)

## [Create PostReaction](documentation/testing/test-cases/PostReaction/create.md)
## [Update PostReaction](documentation/testing/test-cases/PostReaction/update.md)
## [Delete PostReaction](documentation/testing/test-cases/PostReaction/delete.md)

## [Read PostComment](documentation/testing/test-cases/PostComment/read.md)
## [Create PostComment](documentation/testing/test-cases/PostComment/create.md)
## [Update PostComment](documentation/testing/test-cases/PostComment/delete.md)
## [Delete PostComment](documentation/testing/test-cases/PostComment/update.md)

## [Create PostSubscription](documentation/testing/test-cases/PostSubscription/create.md)
## [Delete PostSubscription](documentation/testing/test-cases/PostSubscription/delete.md)
 

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

