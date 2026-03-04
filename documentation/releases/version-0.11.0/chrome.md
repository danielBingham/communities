# Full Regression

For each heading, copy the content of the linked file under the heading and execute the test cases within.

## [Create User: Registration](documentation/testing/test-cases/User/create/registration.md)

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

- [ ] User1 has been registered and has made a private post.
- [ ] User2 has been registered and has made a public post.

### Cases

- [ ] As User1 invite James Smith (communities-james-smith@mailinator.com).
    - [ ] As User1, confirm invitation is visible on the "Friend Requests" page.
    - [ ] As James Smith, Accept the invite and register James Smith with username `james-smith`
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.
    - [ ] As James Smith, attempt to view User1's profile.  Confirm private post not visible.
    - [ ] As James Smith, accept the friend request and view User1's profile page.

- [ ] As User2, invite Jenny Smith (communities-jenny-smith@mailiantor.com).
    - [ ] As User2, confirm invitation is visible on the "Friend Requests" page.
    - [ ] As Jenny Smith, from the same browser session attempt to accept the invite.
        - [ ] Expectation: Error.
    - [ ] As User1, confirm the invitation is *not* visible on the "Friend Requests" page.
    - [ ] From a different browser session accept the invite and register Jenny Smith with username `jenny-smith`.
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.
    - [ ] As Jenny Smith, accept the friend request and view User1's profile page.

## [Create User: Email Confirmation](documentation/testing/test-cases/User/create/registration.md)

Cases covering the Email Confirmation flow. 

### Pre-requisites

No pre-requisites.

### Cases

#### Success cases

- [x] Users can confirm their email by following the link in the email.
    1. Register a new user.
    2. Check the email you registered.
        1. Confirm email arrives.
        2. Confirm it a link.
    3. Click the link in the email.
        1. Confirm user is confirmed.
        2. Confirm TOS page loads.

- [x] Users can confirm their email by copying and pasting the token into the form.
    1. Register a new user.
    2. Check the email you registered.
        1. Confirm email arrives.
        2. Confirm it contains a token.
    3. Click copy the token into the form.  Click Confirm.
        1. Confirm the user is confirmed.
        2. Confirm the TOS page loads.

- [x] Users can request a new confirmation email from the email confirmation form.
- [x] Users can logout from the email confirmation form.
- [x] Users can confirm their email by following the link in the email when they are logged out.
- [x] Users can log back in and confirm their email by copying and pasting the token from the email.

#### Error cases

- [x] Users are shown an error when they follow a link with an invalid token.
- [x] Users are shown an error when they manually enter an invalid token.
- [x] Users are shown an error when they attempt to request a new confirmation while already confirmed.
- [x] Users are simply forwarded to TOS when they attempt to re-confirm after already confirming.

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

- [ ] User can edit "Name".
    1. As User1:
        1. Select "Edit Profile" from the User Menu.
        2. Make a change to the "Name" field.
        3. Submit the form.  Confirm name updated.

- [ ] User can edit "About You".
    1. As User1:
        1. Select "Edit Profile" from the User Menu.
        2. Make a change to the "About You" field.
        3. Submit the form.  Navigate to profile page and confirm About You updated.

- [ ] User update form doesn't commit updates until submitted.
    1. As User1:
        1. Select "Edit Profile" from the User Menu.
        2. Change your profile picture.
        3. Make a change to the "Name" field.
        4. Make a change to the "About You" field.
        5. In a separate tab, navigate to your profile page. Confirm changes do not show.
        6. Submit the form.
        7. Refresh your separate tab and confirm the changes do show.

- [ ] User can update email and is required to confirm new email.
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

- [ ] User can change password.
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

- [ ] Should not receive Info posts in feed when turned off. 
    1. As User1, confirm info posts are present in your feed.
        1. If not, log into an admin user and create some info posts.
    2. As User1, navigate to User Menu -> Preferences.
    3. Toggle Info posts to "off".
    4. Return to your feed.
    5. Confirm info posts *are not* shown.

- [ ] Should receive Info posts in feed when turned on. 
    1. As User1, navigate to User Menu -> Preferences.
    2. Toggle Info posts to "on".
    3. Return to your feed.
    4. Confirm info posts *are* shown.

- [ ] Announcement posts can be turned off.
    1. As User1, confirm announcement posts are in your feed.
        1. If not, log into an admin user and create some announcement posts.
    2. As User1, navigate to User Menu -> Preferences.
    3. Toggle Announcement posts to "off".
    4. Return to your feed.
    5. Confirm announcement posts are not shown.

- [ ] Announcement posts can be turned back on.
    1. As User1, navigate to User Menu -> Preferences
    2. Toggle Announcement posts to "on"
    3. Return to your feed.
    4. Confirm Announcement posts *are* shown.

- [ ] Show Friends can be turned off.
- [ ] Show Friends can be turned back on.

## [Update User: Notifications](documentation/testing/test-cases/User/update/notifications.md)

Cases covering the user updating their profile to toggle Notifications.

### Pre-requisites

- [ ] User1 has registered.
- [ ] User2 has registered.

### Cases

#### All Notifications

- [ ] Should not receive any notifications when All Notifications are Silenced.

##### Email

- [ ] Should not receive Email notifications when All Notifications: Email is turned off.
- [ ] Should receive Email Notifications when All Notifications: Email is turned on.
- [ ] Should not receive Email notifications when a specific notification is turned off, if All Notifications: Email is turned on.
- [ ] Turning on a specific notification should turn All Notifications: Email back on when it is off.

##### Desktop

- [ ] Should not receive Desktop notifications when All Notifications: Desktop is turned off.
- [ ] Should receive Desktop notifications when All Notifications: Desktop is turned on.
- [ ] Should not recieve a Desktop notification when All Notifications: Desktop is turned on, but a more specific Desktop notification is turned off.
- [ ] Turning on a more specific Desktop notification should turn All Notifications: Desktop back on.

##### Mobile

- [ ] Should not recieve mobile notifications when All Notifications: Mobile is turned off.
- [ ] Should recieve mobile notifications when All Notifications: Mobile is turned on.
- [ ] Should not recieve a Mobile notification when All Notifications: Mobile is turned on, but a more specific Mobile notification is turned off.
- [ ] Turning on a more specific Mobile notification should turn All Notifications: Mobile on.

## [Query User](documentation/testing/test-cases/User/query.md)

Cases covering searching for users.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.

### Cases

- [ ] Should be able to search for people by name on the Find Users page.
- [ ] Should be able to search for people by name on the Your Friends page.
- [ ] Should be able to search for people by name on the Pending -> Requests page.


## [UserRelationship](documentation/testing/test-cases/UserRelationship/create-update-delete.md)

Cases covering sending friend requests, accepting friend requests, and
rejecting friend requests.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 and User2 are not friends.

### Cases

- [ ] Users can send friend requests.
    1. As User1, send User2 a friend request.
        1. Confirm request shows on "Friend Requests" view.
        2. Confirm "Cancel Request" shows on User2's profile.
    2. As User2, confirm friend request notification.
        1. Confirm request shows on "Friend Requests" view.
        2. Confirm "Accept" or "Reject" show on User1's profile.
    5. As User1, cancel the request.

- [ ] Users can reject friend requests.
    1. As User1, send User2 a friend request.
    2. As User2, reject the friend request.
        1. Confirm friend request is removed from profile.
        2. Confirm friend request is removed from "Friend Requests" view.

- [ ] Users can remove friends.
    1. As User1, send User2 a friend request.
    2. As User2, accept the friend request. 
        1. Confirm request accepted.
        1. Remove User1 as a friend. 
        2. Confirm request removed.

- [ ] It doesn't matter which user (requester or accepter) removes the request.
    1. As User1, send User2 a friend request.
    2. As User2, accept the friend request. 
        1. Confirm request accepted.
    3. As User1, remove User2 as a friend. 
        1. Confirm request removed.

- [ ] Users can cancel friend requests they send.
    1. As User1, send User2 a friend request.
    2. As User2, confirm friend request visible.
    3. As User1, cancel the friend request. Confirm removed.
    4. As User2, confirm removed.

- [ ] Users can simultaneously remove each other without error.
    1. As User1, send User2 a friend request.
    2. As User2, accept the request.
    3. With two browser windows open, one As User1 and one As User2,
         simultaneously remove each other as friends.

- [ ] Users can simultaneously add each other as friends and the request will
     be auto-approved.
    1. With two browser windows open, one As User2 and one As User1, have User1
         and User2 send each other simultaneous friend requests.
         1. Confirm relationship confirmed.

## [Authentication](documentation/testing/test-cases/Authentication/authentication.md)

Cases covering the authentication system, logging in, logging out, reset
password flow, etc.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created.

### Cases

- [ ] As User1, log out.
- [ ] As User1, attempt to log in with the wrong password. Confirm login fails.
- [ ] As User1, log in with the right password.  Confirm login succeeds.

- [ ] As User2, attempt to login with the wrong password.  Confirm login fails.
- [ ] As User2, attempt to login with the right password. Confirm login succeeds.

#### Reset Password

- [ ] As User2, log out and request a password reset. Change User2's password.
- [ ] As User2, log out and attempt to login with old password.  Confirm login fails.
- [ ] As User2, attempt to login with new password.  Confirm login succeeds.

#### Authentication Lockout 

- [ ] As User3, attempt to log in with the wrong password 10 times.
    - [ ] Confirm authentication timeout.
    - [ ] Wait 15 minutes.
    - [ ] Attempt to log in with the wrong password once.  Confirm login fails.
    - [ ] Attempt to log in with the correct password.  Confirm log in succeeds.

## [Create Post](documentation/testing/test-cases/Post/create.md)

Cases covering making posts in all their forms and with all their attachments.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.

### Cases

#### Private Posts

- [ ] As User1, make a private post with just text.
- [ ] As User1, make a private post with just an image.
- [ ] As User1, make a private post with just a link.
- [ ] As User1, make a private post with just a video.
- [ ] As User1, make a private post with text and an image.
- [ ] As User1, make a private post with text and a link.
- [ ] As User1, make a private post with text and a video.

#### Public Posts

- [ ] As User1, make a public post with just text.
- [ ] As User1, make a public post with just an image.
- [ ] As User1, make a public post with just a link.
- [ ] As User1, make a public post with just a video.
- [ ] As User1, make a public post with text and an image.
- [ ] As User1, make a public post with text and a link.
- [ ] As User1, make a public post with text and a video.

- [ ] As User1, make a post mentioning User2.
    - [ ] As User2, confirm notification.

#### Links

- [ ] As User1, make a post with a link in the body. Confirm highlighted.
- [ ] As User1, make a post with a link with a long string in the body.  Confirm it doesn't expand the view on mobile.
- [ ] As User1, make a post with an incomplete link (www.refseek.com, refseek.com).  Confirm highlighted.

#### Images

- [ ] As User1, make an image post using a `.jpg`.
- [ ] As User1, make an image post using a `.png`.
- [ ] As User1, attempt to make a post with a corrupted `.png` - confirm failure.
- [ ] As User1, attempt to make a post with a corrupted `.jpg` - confirm failure.

##### Videos

- [ ] As User1, make a video post using a `.mp4`
- [ ] As User1, make a video post using a `.mov`
- [ ] As User1, make a video post using a `.avi`
- [ ] As User1, make a video post using a `.webp`

- [ ] As User1, make a video post using a corrupted `.mp4` - confirm failure.
- [ ] As User1, make a video post using a corrupted `.mov` - confirm failure.
- [ ] As User1, make a video post using a corrupted `.avi` - confirm failure.
- [ ] As User1, make a video post using a corrupted `.webp` - confirm failure.

#### Long String

- [ ] As User1, make a post with a 500 character unbroken string.
    - [ ] Confirm the mobile view is not expanded and the string is broken appropriately.

#### Post Drafts

- [ ] As User1, write a post draft with an image.
    - [ ] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [ ] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [ ] Post the draft. Confirm draft posts correctly.

- [ ] As User1, write a post draft with an image.
    - [ ] Log out. Log back in. Confirm draft is gone.

- [ ] As User1, write a post draft with a link.
    - [ ] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [ ] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [ ] Post the draft.  Confirm draft posts correctly. 

- [ ] As User1, write a post draft with a link.
    - [ ] Log out. Log back in. Confirm draft is gone.

#### Youtube Videos

- [ ] As User1, create a post with a youtube video for a link, using the full link (`/watch?vid=`)
    - [ ] Confirm embed loads.
    - [ ] Post the post.  Confirm the embed will play.
- [ ] As User1, create a post with a youtube video for a link using the shorted link (`youtu.be`)
    - [ ] Confirm the embed loads.
    - [ ] Post the post. Confirm the embed will play.

## [Update Post](documentation/testing/test-cases/Post/update.md)

Test cases related to editing posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.

### Cases

#### Post Editing

- [ ] As User1, create a post with text and an image.
    - [ ] Edit the post and change the text.  Save the edit.  Confirm post updated appropriately.
    - [ ] Edit the post and change the image.  Save the edit and confirm the post updated appropriately.
    - [ ] Edit the post and change the text. Cancel the edit and confirm the post was not updated.
    - [ ] Edit the post and change the image.  Cancel the edit and confirm the post was not updated.

- [ ] As User1, create a post with text an a link.
    - [ ] Edit the post and change the text.  Save the edit.  Confirm post updated appropriately.
    - [ ] Edit the post and change the link.  Save the edit and confirm the post updated appropriately.
    - [ ] Edit the post and change the text. Cancel the edit and confirm the post was not updated.
    - [ ] Edit the post and change the link.  Cancel the edit and confirm the post was not updated.

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

Test cases related to deleting posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.

### Cases

- [ ] Users can delete private posts with images.
    1. As User1, create a private post with an image.
    2. As User2, comment and react to the post.
    3. As User1, delete the post.
    4. As User1, attempt to view the post. Confirm its gone.
    5. As User2, attempt to view the post. Confirm its gone.

- [ ] Users can delete private posts with links. 
    1. As User1, create a private post with a link.
    2. As User2, comment and react to the post.
    3. As User1, delete the post.
    4. As User1, attempt to view the post. Confirm its gone.
    5. As User2, attempt to view the post. Confirm its gone.

- [ ] Users can delete public posts with images that have been shared. 
    1. As User1, create a public post with an image.
    2. As User2, comment and react to the post.
    3. As User2, share the post.
    4. As User1, delete the post.
    5. As User1, attempt to view the post. Confirm its gone.
    6. As User2, attempt to view the post. Confirm its gone.

- [ ] Users can delete public posts with links that have been shared. 
    1. As User1, create a public post with a link.
    2. As User2, comment and react to the post.
    3. As User2, share the post.
    4. As User1, delete the post.
    5. As User1, attempt to view the post. Confirm its gone.
    6. As User2, attempt to view the post. Confirm its gone.

## [Create PostReaction](documentation/testing/test-cases/PostReaction/create.md)

Cases covering reacting to Posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least three posts.

### Cases

- [ ] As User1, like one of User2's Posts.
    - [ ] Confirm like highlighted and "likes" is incremented by 1.
    - [ ] Confirm clicking on the reactions shows User1 as liking.
    - [ ] Confirm post increases rank when feed is sorted by "Most Activity"

- [ ] As User1, dislike a second one of User2's Posts.
    - [ ] Confirm dislike highlighted and "dislikes" is incremented by 1.
    - [ ] Confirm clicking on the reactions shows User1 as disliking.
    - [ ] Confirm post increases rank when feed is sorted by "Most Activity"
  
- [ ] As User1, demote a third one of User2's Posts.
    - [ ] Confirm "Are You Sure" modal shows.
    - [ ] Select "Yes".
    - [ ] Confirm demote is highlighted and "demotes" is incremented by 1.
    - [ ] Confirm clicking on reactions show User1 as demoting.
    - [ ] Confirm post decreases rank when feed is sorted by "Most Activity".

## [Update PostReaction](documentation/testing/test-cases/PostReaction/update.md)

Cases covering updating reactions to Posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least three posts.
- [ ] User1 has reacted to each of User2 posts.

### Cases

- [ ] As User1, dislike the User2 Post previously liked. 
    - [ ] Confirm dislike highlighted and like not highlighted.
    - [ ] Confirm "dislikes" is incremented by 1 and "likes" is decremented by 1.
    - [ ] Confirm clicking on the reactions shows User1 as disliking.
    - [ ] Confirm post rank when feed is sorted by "Most Activity" stays the same
    
- [ ] As User1, demote the User2 Post previously disliked
    - [ ] Confirm "Are You Sure" modal is shown.
    - [ ] Select "yes".
    - [ ] Confirm demote highlighted and dislike not highlighted.
    - [ ] Confirm demotes is incremented by 1 and dislikes is decremented by 1.
    - [ ] Confirm clicking on the reactions shows User1 as demoting.
    - [ ] Confirm post decreases rank when feed is sorted by "Most Activity"
    
- [ ] As User1, like the User2 Post previously demoted 
    - [ ] Confirm like is highlighted and demote is not highlighted
    - [ ] Confirm likes is incremented by 1 and demotes is decremented by 1.
    - [ ] Confirm clicking on reactions show User1 as liking.
    - [ ] Confirm post increases rank when feed is sorted by "Most Activity".

## [Delete PostReaction](documentation/testing/test-cases/PostReaction/delete.md)

Cases covering removing reactions from Posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least three posts.
- [ ] User1 has reacted to each of User2's posts.

### Cases

- [ ] As User1, unlike one of User2's Posts.
    - [ ] Confirm like unhighlighted and "likes" is decremented by 1.
    - [ ] Confirm clicking on the reactions doesn't show User1 as liking.
    - [ ] Confirm post decreases rank when feed is sorted by "Most Activity"

- [ ] As User1, remove a dislike from a second one of User2's Posts.
    - [ ] Confirm dislike is not highlighted and "dislikes" is decremented by 1.
    - [ ] Confirm clicking on the reactions does not show User1 as disliking.
    - [ ] Confirm post decreases rank when feed is sorted by "Most Activity"

- [ ] As User1, remove a demote from a third one of User2's Posts.
    - [ ] Confirm demote is not highlighted and "demotes" is decremented by 1.
    - [ ] Confirm clicking on reactions does not show User1 as demoting.
    - [ ] Confirm post increaess rank when feed is sorted by "Most Activity".

## [Create PostComment](documentation/testing/test-cases/PostComment/create.md)

Cases covering making comments on posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 has created a public post.

### Cases

- [ ] Users can comment on posts they can see.
    1. As User2 comment "First." on User1's post.
        1. Confirm comment appears on User1's post.

- [ ] Comments appear in the order they are made.
    1. As User1 comment "Second." on User1's post.
        1. Confirm comment appears on User1's post.
    2. As User2 comment "Third." on User1's post after User1.
        1. Confirm comment appears on User1's post.
        2. Confirm comments appear in correct order:
            - User2: "First." 
            - User1: "Second." 
            - User2: "Third." 

#### Mentions

- [ ] Users can mention other users in comments.
    1. As User2 comment on User1's post and begin a mention by typing '@' and the beginning of User1's name.
        1. Confirm mention suggestions menu is limited to User2's friends and User1.
        2. Confirm list is filtered by User1's name. Continue typing it and confirm it continues to be filtered.
        3. Use the down arrow key to walk down the list.
        4. Use the up arrow key to walk up the list.
        5. Select User1 and hit the "Enter" key. Confirm mention completes with User1's username.
        6. Post comment.
    2. As User1, confirm mention notification received.
        1. Click on the notification.  Confirm comment highlighted.

#### Drafts

- [ ] Users can draft comments and the drafts will be saved as long as they are logged in.
    1. As User2, write a comment draft.
        1. Navigate away from the home feed and back to feed.  Confirm draft remains. 
        2. Close the Communities browser window. Reopen and reload.  Confirm draft remains.
        3. Post the draft. Confirm comment posts correctly.

- [ ] User's comment drafts are deleted when they log out.
    1. As User2, write a comment draft.
        1. Log out. 
        2. Log back in. 
        3. Confirm draft is gone.

- [ ] User's comment drafts can be cancelled, which deletes them.
    1. As User2, write a comment draft.
        1. Cancel the draft.
        2. Confirm draft is gone.
        3. Reload the page.
        4. Confirm draft is still gone.
        5. Navigate away and back. 
        6. Confirm draft is still gone.

## [Read PostComment](documentation/testing/test-cases/PostComment/read.md)

Cases covering who can and cannot see post comments.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.

### Cases

- [ ] Comments on public posts are always viewable.
    1. As User1, create a public post.
    2. As User2, comment on User1's post.
    3. As User3, attempt to view User2's comment by direct link.  Confirm visible.

- [ ] Comments on private posts are only visible by the post author's friends.
    1. As User1, create a private post.
    2. As User2, comment on User1's post.
    3. As User3, attempt to view User2's comment by direct link.  Confirm not visible.

- [ ] Users who comment on public posts of those they are not friends with
        lose visibility to those comments if the visibilty of the post changes to
        private.
    1. As User1, create public post.
    2. As User3, comment on User1's post.
    3. As User1, change visibility to private.
    4. As User2, comment on User1's post.
    5. As User3, confirm no comment notification is recieved.
    6. As User3, attempt to view User2's comment by direct link.  Confirm not visible.

#### Mentions

- [ ] Users mentioned on posts they can see should be notified of the mention.
    1. As User1, create a public post.
    2. As User2, comment on User1's post and mention User3.
    3. As User3, confirm mention notification. Click through notification and confirm comment is visible.

- [ ] Users mentioned on posts they cannot see should not be notified of the mention.
    1. As User1, create a private post.
    2. As User2, comment on User1's post and mention User3.
    3. As User3, confirm no mention notification.
    4. As User3, attempt to visit direct link for comment. confirm not visible.

## [Update PostComment](documentation/testing/test-cases/PostComment/delete.md)

Cases covering making comments on posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created and is friends with User2.
- [ ] User1 has created a public post.

### Cases

- [ ] Users should be able to edit their comments.
    1. As User2, comment on User1's post.
        1. Edit comment.
        2. Write edit text.
        3. Post the edit. 
        4. Confirm comment shows the edit.

- [ ] Users should be able to cancel edits on their comments.
    1. As User2, comment on User1's post.
        1. Edit the comment.
        2. Write some edit text.
        3. Cancel the edit.
        4. Confirm comment shows original text.

#### Mentions

- [ ] Users mentioned in comments should not be notified again when those comments are editted.
    1. As User2, comment on User1's post and mention User3.
    2. As User3, confirm mention notification.
    3. As User2, edit the comment.
        1. Confirm User3 is not notified again.

- [ ] Users newly mentioned during a comment edit should be notified. NOTE: This case covers a current bug.
    1. As User2, comment on User1's post. 
        1. Edit the comment and add a mention of User3.
    2. As User3, confirm notification.

#### Drafts

- [ ] Users can draft edits of their comments and have them saved.
    1. As User2, comment on User1's post.
        1. Edit the comment.
        2. Write some new text.
        3. Reload the browser, confirm new text remains.
        4. Navigate away from the page and back, confirm new text remains.
    2. As User1, view the comment.
        1. Confirm new text is absent.
    3. As User2, post the comment.
        1. Confirm edit shows up properly.

- [ ] User's comment edit drafts are deleted when they log out.
    1. As User2, comment on User1's post.
        1. Edit the comment.
        2. Write some new text.
        3. Log out and log back in.
        4. Confirm text is gone.

- [ ] Users can cancel comment edits and the drafts will be deleted.
    1. As User2, comment on User1's post.
        1. Edit the comment. 
        2. Write some new text.
        3. Reload the browser.
        4. Confirm text remains.
        5. Cancel the edit.
        6. Confirm previous text is restored.

## [Delete PostComment](documentation/testing/test-cases/PostComment/update.md)

Cases covering deleting comments on posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 has created a public post.

### Cases

- [ ] Users can delete their comments.
    1. As User2, comment on User1's post.
        1. Delete the comment.
        2. Confirm the comment is removed.

- [ ] Users should not be able to delete other user's comments.
    1. As User2, comment on User1's post.
    2. As User1, check the dots menu for User2's comment.
        1. Confirm "delete" is not shown.

- [ ] Users mentioned in comments should still be able to view the post from the notification, but not the comment.
    1. As User2, comment on User1's post, mentioning User1.
        1. Delete the comment.
    2. As User1, click on the mention notification. Confirm is shows the post, but comment is gone.

## [Create PostSubscription](documentation/testing/test-cases/PostSubscription/create.md)

Cases covering subscribing to posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.

### Cases

- [ ] When a user creates a post they should be subscribed to the post and notified of comments.
    1. As User1, create a post.
        1. Confirm subscribed.
    2. As User2, comment on User1's post.
    3. As User1, confirm notified.

- [ ] When a user comments on a post, they should be subscribed to the post and notified of comments.
    1. As User1, create a post.
    2. As User2, comment on User1's post.
        1. Confirm subscribed.
    3. As User1, comment on User1's post.
    4. As User2, confirm notified.

- [ ] When a user subscribes to a post, they should be notified of comments.
    1. As User1, create a public post.
    2. As User3, subscribe to User1's post.
    3. As User2, comment on User1's post.
    4. As User3, confirm notification.

- [ ] When a user loses the ability to view a subscribed post they should no longer be notified of comments.
    1. As User1, create a public post.
    2. As User3, subscribe to User1's post.
    3. As User1, change visibility of post to private.
    4. As User2, comment on User1's post.
    5. As User3, confirm no notification.

## [Delete PostSubscription](documentation/testing/test-cases/PostSubscription/delete.md)

Cases covering unsubscribing from posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.

### Cases

- [ ] When a user unsubscribes from a post they created, they should no longer be notified of comments. 
    1. As User1, create a post.
        1. Unsubscribe from post. 
    2. As User2, comment on User1's post.
    3. As User1, confirm not notified.

- [ ] When a user unsubscribes from a post they commented on, they should no longer be notified of comments. 
    1. As User1, create a post.
    2. As User2, comment on User1's post.
        1. Unsubscribe from User1's post. 
    3. As User1, comment on User1's post.
    4. As User2, confirm not notified.

- [ ] When a user unsubscribes from a post they subscribed to, they should not longer be notified of comments. 
    1. As User1, create a public post.
    2. As User3, subscribe to User1's post.
    3. As User2, comment on User1's post.
    4. As User3, confirm notification.
        1. Unsubscribe from User1's post.
    5. As User2 comment on User1's post.
    6. As User3, confirm no notification.
 
## [Create SiteModeration](documentation/testing/test-cases/SiteModeration/create.md)

Test cases related to SiteModeration creation.  Who can flag posts for site moderation?

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is **not** friends with User1.
- [ ] User4 has been created and is friends with User1.

### Cases

- [ ] Users can flag private posts they can see for Site Moderators.
    1. As User1, create a private post.
    2. As User2, flag User1's post for Site Moderators.

- [ ] Users can flag public posts they can see for Site moderators.
    1. As User1, create a public post.
    1. As User3, flag User1's public post for Site Moderators.

- [ ] Users **cannot** flag posts they can't see.
    1. As User1, create a private post.
    2. As User3, confirm cannot see or flag post.

- [ ] Users can flag comments on private posts they can see for Site Moderators.
    1. As User1, create a private post.
    2. As User2, comment on User1's private post.
    3. As User4, flag User2's comment.

- [ ] Users can flag comments on public posts they can see for Site Moderators.
    1. As User1, create a public post.
    2. As User2, comment on User1's post.
    3. As User3, flag User2's comment.

- [ ] Users **cannot** flag comments on private posts they can't see.
    1. As User1, create a private post.
    2. As User2, comment on User1's post.
    3. As User3, confirm cannot see or flag User2's comment.

## [Update SiteModeration](documentation/testing/test-cases/SiteModeration/update.md)

Test cases related to SiteModeration creation.  Who can flag posts for site moderation?

### Pre-requisites

- [ ] A Site admin user has been created.
- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.

### Cases

- [ ] A SiteAdmin can reject flagged posts.
- [ ] A SiteAdmin can reject flagged posts with a reason.
- [ ] A SiteAdmin can approve flagged posts.
- [ ] A SiteAdmin can approve flagged posts with a reason.

- [ ] A SiteAdmin can reject flagged comments.
- [ ] A SiteAdmin can reject flagged comments with a reason.
- [ ] A SiteAdmin can approve flagged comments.
- [ ] A SiteAdmin can approve flagged comments with a reason.

## [Create Group](documentation/testing/test-cases/Group/create.md)

Cases covering group creation.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created.

### Cases

#### Top level Groups

- [ ] Users can create Public groups.
    1. As User1, go to Groups -> Create.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Public Group'
        4. Confirm URL is autopopulated as 'public-group'
        5. Enter some text in the About field.
        6. Choose 'Public' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Public Group'.
    3. As User2, visit 'Public Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is visible.
        3. Confirm members are visible and User1 is listed as Admin.
        4. Click on User1's post permalink, confirm visible on post view.
        3. React to User1's post.
        4. Comment on User1's post.

#### Subgroups

- [ ] Users can create Public subgroups of Public groups.
    1. As User1, create a Public group called 'Public Group'.
    1. As User1, go to 'Public Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Public -> Public Group'
        4. Confirm URL is autopopulated as 'public---public-group'
        5. Enter some text in the About field.
        6. Choose 'Public' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Public -> Public Group'.
    3. As User2, a non-member of both groups, visit 'Public -> Public Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is visible.
        3. Confirm members are visible and User1 is listed as Admin.
        4. Click on User1's post permalink, confirm visible on post view.
        3. React to User1's post.
        4. Comment on User1's post.
    4. As User1, invite User3 to 'Public Group'.
    5. As User3, accept User1's invitation to join 'Public Group'.
    6. As User3, visit 'Public -> Public Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is visible.
        3. Confirm members are visible and User1 is listed as Admin.
        4. Click on User1's post permalink, confirm visible on post view.
        3. React to User1's post.
        4. Comment on User1's post.

## [Read Group](documentation/testing/test-cases/Group/read.md)

Cases covering group deletion.

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and added as an admin only of the top level groups.
- [ ] User5 has been created an added as a moderator only of the top level groups.
- [ ] User6 has been created and added as a member only of the top level groups.

- [ ] User7 has been created and is a non-member of all groups.

### Cases

#### Top level Groups

##### Public Groups

- [ ] Non-members can see a Public Group exists and read its description.

- [ ] Non-members can view the content of a Public Group.

- [ ] Members can see a Public Group exists and read its description.

- [ ] Members can view the content of a Public Group.

##### Private Groups

- [ ] Non-members can see a Private Group exists and read its description.

- [ ] Non-members **cannot*** view the content of a Private Group.

- [ ] Members can see a Private Group exists and read its description.

- [ ] Members can view the content of a Private Group.

##### Hidden Groups

- [ ] Non-members **cannot*** seen a Hidden Group exists or read the description.

- [ ] Non-members **cannot*** view the content of a Hidden Group.

- [ ] Members can see a Hidden Group exists and read the description.

- [ ] Members can view the content of a Hidden Group.

## [Query Group](documentation/testing/test-cases/Group/query.md)

Cases covering group querying.

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group
- [ ] A Private Group, Private Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Private - Public Group
        - [ ] A Private Group named Private - Private Group 
        - [ ] A Hidden Group named Private - Hidden Group
- [ ] A Hidden Group, Hidden Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Hidden - Public Group
        - [ ] A Private Group named Hidden - Private Group 
        - [ ] A Hidden Group named Hidden - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and added as an admin only of the top level groups.
- [ ] User5 has been created an added as a moderator only of the top level groups.
- [ ] User6 has been created and added as a member only of the top level groups.

- [ ] User7 has been created and is a non-member of all groups.

### Cases

- [ ] The Find Group list includes all groups and subgroups users can see exist and read the description for.

- [ ] Users can filter the Find Group list based on name using the Search control.

## [Update Group](documentation/testing/test-cases/Group/update.md)

Cases covering group updates.

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group
- [ ] A Private Group, Private Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Private - Public Group
        - [ ] A Private Group named Private - Private Group 
        - [ ] A Hidden Group named Private - Hidden Group
- [ ] A Hidden Group, Hidden Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Hidden - Public Group
        - [ ] A Private Group named Hidden - Private Group 
        - [ ] A Hidden Group named Hidden - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and added as an admin only of the top level groups.
- [ ] User5 has been created an added as a moderator only of the top level groups.
- [ ] User6 has been created and added as a member only of the top level groups.

- [ ] User7 has been created and is a non-member of all groups.

### Cases

- [ ] Members with 'admin' role can update the profile image of a group.

- [ ] Members with 'admin' role can update the description of a group.

- [ ] Members with 'admin' role can update the Posting Permissions of a group.

## [Create GroupMember](documentation/testing/test-cases/GroupMember/create.md)

Cases covering group deletion.

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group
- [ ] A Private Group, Private Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Private - Public Group
        - [ ] A Private Group named Private - Private Group 
        - [ ] A Hidden Group named Private - Hidden Group
- [ ] A Hidden Group, Hidden Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Hidden - Public Group
        - [ ] A Private Group named Hidden - Private Group 
        - [ ] A Hidden Group named Hidden - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and added as an admin only of the top level groups.
- [ ] User5 has been created an added as a moderator only of the top level groups.
- [ ] User6 has been created and added as a member only of the top level groups.

- [ ] User7 has been created and is a non-member of all groups.

### Cases

#### Top level Groups

##### Public Groups

- [ ] Non-members can join.

- [ ] Group Moderators can invite non-member friends to join.

- [ ] Group Moderators can invite non-users to join using their email.

##### Private Groups

- [ ] Non-members can request membership.

- [ ] Group Moderators can accept or reject non-member membership requests.

- [ ] Group Moderators can invite non-member friends to join.

- [ ] Group Moderators can invite non-users to join use their email.

##### Hidden Groups

- [ ] Group Moderators can invite non-member friends to join.

- [ ] Group Moderators can invite non-users to join use their email.

## [Query GroupMember](documentation/testing/test-cases/GroupMember/query.md)

Cases covering searching or browsing for GroupMembers.

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group
- [ ] A Private Group, Private Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Private - Public Group
        - [ ] A Private Group named Private - Private Group 
        - [ ] A Hidden Group named Private - Hidden Group
- [ ] A Hidden Group, Hidden Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Hidden - Public Group
        - [ ] A Private Group named Hidden - Private Group 
        - [ ] A Hidden Group named Hidden - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and added as an admin only of the top level groups.
- [ ] User5 has been created an added as a moderator only of the top level groups.
- [ ] User6 has been created and added as a member only of the top level groups.

- [ ] User7 has been created and is a non-member of all groups.

### Cases

#### Top level Groups

##### Public Groups

- [ ] Non-members can query Members.
- [ ] Non-members can query Administrators.
- [ ] Members can query Members.
- [ ] Members can query Administrators.
- [ ] Group Moderators can query Invitations.
- [ ] Group Moderators can query Banned Users.
- [ ] Group Moderators can query Email Invitations.

##### Private Groups

- [ ] Non-members **cannot** query Members.
- [ ] Non-members **cannot** query Administrators.
- [ ] Members can query Members.
- [ ] Members can query Administrators.
- [ ] Group Moderators can query Invitations.
- [ ] Group Moderators can query Requests.
- [ ] Group Moderators can query Banned Users.
- [ ] Group Moderators can query Email Invitations.

##### Hidden Groups

- [ ] Non-members **cannot** query Members.
- [ ] Non-members **cannot** query Administrators.
- [ ] Members can query Members.
- [ ] Members can query Administrators.
- [ ] Group Moderators can query Invitations.
- [ ] Group Moderators can query Requests.
- [ ] Group Moderators can query Banned Users.
- [ ] Group Moderators can query Email Invitations.

## [Read GroupMember](documentation/testing/test-cases/GroupMember/read.md)

Cases covering group deletion.

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group
- [ ] A Private Group, Private Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Private - Public Group
        - [ ] A Private Group named Private - Private Group 
        - [ ] A Hidden Group named Private - Hidden Group
- [ ] A Hidden Group, Hidden Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Hidden - Public Group
        - [ ] A Private Group named Hidden - Private Group 
        - [ ] A Hidden Group named Hidden - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and added as an admin only of the top level groups.
- [ ] User5 has been created an added as a moderator only of the top level groups.
- [ ] User6 has been created and added as a member only of the top level groups.

- [ ] User7 has been created and is a non-member of all groups.

### Cases

#### Top level Groups

##### Public Groups

- [ ] Non-members can view GroupMembers.

- [ ] Members can view GroupMembers.

##### Private Groups

- [ ] Non-members **cannot** view GroupMembers.

- [ ] Members can view GroupMembers.

##### Hidden Groups

- [ ] Non-members **cannot** view GroupMembers.

- [ ] Members can view GroupMembers.

## [Update GroupMember](documentation/testing/test-cases/GroupMember/read.md)

Cases covering group deletion.

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group
- [ ] A Private Group, Private Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Private - Public Group
        - [ ] A Private Group named Private - Private Group 
        - [ ] A Hidden Group named Private - Hidden Group
- [ ] A Hidden Group, Hidden Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Hidden - Public Group
        - [ ] A Private Group named Hidden - Private Group 
        - [ ] A Hidden Group named Hidden - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and added as an admin only of the top level groups.
- [ ] User5 has been created an added as a moderator only of the top level groups.
- [ ] User6 has been created and added as a member only of the top level groups.

- [ ] User7 has been created and is a non-member of all groups.

### Cases

- [ ] Group Moderators can ban members.

- [ ] Group Moderators can accept membership requests.

- [ ] Group Admins can promote members to moderator.

- [ ] Group Admins can promote members to admin.

## [Delete GroupMember](documentation/testing/test-cases/GroupMember/delete.md)

Cases covering GroupMember deletion.

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group
- [ ] A Private Group, Private Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Private - Public Group
        - [ ] A Private Group named Private - Private Group 
        - [ ] A Hidden Group named Private - Hidden Group
- [ ] A Hidden Group, Hidden Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Hidden - Public Group
        - [ ] A Private Group named Hidden - Private Group 
        - [ ] A Hidden Group named Hidden - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and added as an admin only of the top level groups.
- [ ] User5 has been created an added as a moderator only of the top level groups.
- [ ] User6 has been created and added as a member only of the top level groups.

- [ ] User7 has been created and is a non-member of all groups.

### Cases

- [ ] Members can leave the group.

- [ ] Invited Members can reject the invitation.

- [ ] Members Requesting Membership can cancel the request.

- [ ] Group Moderators can remove members.

- [ ] The last Group Admin cannot leave the group.

## [Create GroupPost](documentation/testing/test-cases/GroupPost/create.md)

Cases covering group deletion.

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group
        - [ ] A Hidden Group named Hidden - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and is a non-member of all groups.

### Cases

#### Top level Groups

##### Public Groups

###### Posting Permissions: Anyone

- [ ] Non-members can create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Members

- [ ] Non-members **cannot** create posts.
- [ ] Members can create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [ ] Non-members **cannot** create posts.
- [ ] Members can create pending posts.
- [ ] Group Moderators can create pending posts.
- [ ] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [ ] Non-members **cannot** create posts.
- [ ] Members **cannot** create posts.
- [ ] Group Moderators can create posts.
- [ ] Group Admins can create posts.

## [Read GroupPost](documentation/testing/test-cases/GroupPost/read.md)

Cases covering GroupPost reading.  Who can view the posts in a group?

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and is a non-member of all groups.

### Cases

#### Top level Groups

##### Public Groups

- [ ] Non-members can view posts.
- [ ] Members can view posts.
- [ ] Group Moderators can view posts.
- [ ] Group Admins can view posts.

##### Private Groups

- [ ] Non-members **cannot** view posts.
- [ ] Members can view posts.
- [ ] Group Moderators can view posts.
- [ ] Group Admins can view posts.

##### Hidden Groups

- [ ] Non-members **cannot** view posts.
- [ ] Members can view posts.
- [ ] Group Moderators can view posts.
- [ ] Group Admins can view posts.

## [Update GroupPost](documentation/testing/test-cases/GroupPost/update.md)

Cases covering GroupPost reading.  Who can view the posts in a group?

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and is a non-member of all groups.

### Cases

- [ ] Post authors can edit their posts.
- [ ] Non-post authors cannot edit posts.

## [Delete GroupPost](documentation/testing/test-cases/GroupPost/delete.md)

Cases covering GroupPost reading.  Who can view the posts in a group?

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and is a non-member of all groups.

### Cases

- [ ] Post authors can delete their posts.
- [ ] Non-post authors **cannot** delete posts.

## [Create GroupModeration](documentation/testing/test-cases/GroupModeration/create.md)

Cases covering GroupModeration creation.  Who can flag the posts in a group for group moderators?

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and is a non-member of all groups.

### Cases

#### Top level Groups

##### Public Groups

- [ ] Non-members can flag posts.
- [ ] Members can flag posts.
- [ ] Group Moderators can flag posts.
- [ ] Group Admins can flag posts.

##### Private Groups

- [ ] Non-members **cannot** flag posts.
- [ ] Members can flag posts.
- [ ] Group Moderators can flag posts.
- [ ] Group Admins can flag posts.

##### Hidden Groups

- [ ] Non-members **cannot** flag posts.
- [ ] Members can flag posts.
- [ ] Group Moderators can flag posts.
- [ ] Group Admins can flag posts.

## [Read GroupModeration](documentation/testing/test-cases/GroupModeration/read.md)

Cases covering GroupModeration creation.  Who can flag the posts in a group for group moderators?

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and is a non-member of all groups.

### Cases

#### Top level Groups

##### Public Groups

- [ ] Non-members can can see moderation status of posts.
- [ ] Members can can see moderation status of posts.
- [ ] Group Moderators can can see moderation status of posts.
- [ ] Group Admins can can see moderation status of posts.

##### Private Groups

- [ ] Non-members **cannot** can see moderation status of posts.
- [ ] Members can can see moderation status of posts.
- [ ] Group Moderators can can see moderation status of posts.
- [ ] Group Admins can can see moderation status of posts.

##### Hidden Groups

- [ ] Non-members **cannot** can see moderation status of posts.
- [ ] Members can can see moderation status of posts.
- [ ] Group Moderators can can see moderation status of posts.
- [ ] Group Admins can can see moderation status of posts.

## [Update GroupModeration](documentation/testing/test-cases/GroupModeration/update.md)

Cases covering GroupModeration updating.  Who can moderate the posts in a group?

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group 
        - [ ] A Hidden Group named Public - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and is a non-member of all groups.

### Cases

#### Top level Groups

##### Public Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators can moderate posts.
- [ ] Group Admins can moderate posts.

##### Private Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators can moderate posts.
- [ ] Group Admins can moderate posts.

##### Hidden Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators can moderate posts.
- [ ] Group Admins can moderate posts.

## [Delete Group](documentation/testing/test-cases/Group/delete.md)

Cases covering group deletion.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created.
- [ ] User4 has been created.
- [ ] A Group has been created with User1 as admin, User2 as moderator, and
      User3 as member, and User4 as non-member.

### Cases

- [ ] Members with 'admin' role can delete groups.

- [ ] Non-members with 'admin' or 'superadmin' siteRole can delete groups.

- [ ] Deleting a group with content deletes all its content.

- [ ] Deleting a group with subgroups also deletes its subgroups.
