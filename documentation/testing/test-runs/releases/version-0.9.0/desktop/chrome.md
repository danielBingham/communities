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

- [x] Show Friends can be turned off.
- [x] Show Friends can be turned back on.

## [Update User: Notifications](documentation/testing/test-cases/User/update/notifications.md)

Cases covering the user updating their profile to toggle Notifications.

### Pre-requisites

- [ ] User1 has registered.
- [ ] User2 has registered.

### Cases

#### All Notifications

- [ ] Should not receive any notifications when All Notifications are Silenced.

##### Email

- [x] Should not receive Email notifications when All Notifications: Email is turned off.
- [x] Should receive Email Notifications when All Notifications: Email is turned on.
- [x] Should not receive Email notifications when a specific notification is turned off, if All Notifications: Email is turned on.
- [x] Turning on a specific notification should turn All Notifications: Email back on when it is off.

##### Desktop

- [x] Should not receive Desktop notifications when All Notifications: Desktop is turned off.
- [x] Should receive Desktop notifications when All Notifications: Desktop is turned on.
- [x] Should not recieve a Desktop notification when All Notifications: Desktop is turned on, but a more specific Desktop notification is turned off.
- [x] Turning on a more specific Desktop notification should turn All Notifications: Desktop back on.

##### Mobile

- [x] Should not recieve mobile notifications when All Notifications: Mobile is turned off.
- [x] Should recieve mobile notifications when All Notifications: Mobile is turned on.
- [x] Should not recieve a Mobile notification when All Notifications: Mobile is turned on, but a more specific Mobile notification is turned off.
- [x] Turning on a more specific Mobile notification should turn All Notifications: Mobile on.

## [Query User](documentation/testing/test-cases/User/query.md)

Cases covering searching for users.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.

### Cases

- [x] Should be able to search for people by name on the Find Users page.
- [x] Should be able to search for people by name on the Your Friends page.
- [x] Should be able to search for people by name on the Pending -> Requests page.

## [UserRelationship](documentation/testing/test-cases/UserRelationship/create-update-delete.md)

Cases covering sending friend requests, accepting friend requests, and
rejecting friend requests.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 and User2 are not friends.

### Cases

- [x] Users can send friend requests.
    1. As User1, send User2 a friend request.
        1. Confirm request shows on "Friend Requests" view.
        2. Confirm "Cancel Request" shows on User2's profile.
    2. As User2, confirm friend request notification.
        1. Confirm request shows on "Friend Requests" view.
        2. Confirm "Accept" or "Reject" show on User1's profile.
    5. As User1, cancel the request.

- [x] Users can reject friend requests.
    1. As User1, send User2 a friend request.
    2. As User2, reject the friend request.
        1. Confirm friend request is removed from profile.
        2. Confirm friend request is removed from "Friend Requests" view.

- [x] Users can remove friends.
    1. As User1, send User2 a friend request.
    2. As User2, accept the friend request. 
        1. Confirm request accepted.
        1. Remove User1 as a friend. 
        2. Confirm request removed.

- [x] It doesn't matter which user (requester or accepter) removes the request.
    1. As User1, send User2 a friend request.
    2. As User2, accept the friend request. 
        1. Confirm request accepted.
    3. As User1, remove User2 as a friend. 
        1. Confirm request removed.

- [x] Users can cancel friend requests they send.
    1. As User1, send User2 a friend request.
    2. As User2, confirm friend request visible.
    3. As User1, cancel the friend request. Confirm removed.
    4. As User2, confirm removed.

- [x] Users can simultaneously remove each other without error.
    1. As User1, send User2 a friend request.
    2. As User2, accept the request.
    3. With two browser windows open, one As User1 and one As User2,
         simultaneously remove each other as friends.

- [x] Users can simultaneously add each other as friends and the request will
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
    - [x] Wait 15 minutes.
    - [x] Attempt to log in with the wrong password once.  Confirm login fails.
    - [x] Attempt to log in with the correct password.  Confirm log in succeeds.

## [Create Post](documentation/testing/test-cases/Post/create.md)

Cases covering making posts in all their forms and with all their attachments.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.

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

- [x] As User1, make a post mentioning User2.
    - [x] As User2, confirm notification.

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

- [ ] User1 has been created.
- [ ] User2 has been created.

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

- [x] As User1, create a public post with text and a link.
    - [x] As User2, share User1's post.
    - [x] As User1, edit the shared post and change the text and the link.  Save the edit.
    - [x] As User2, confirm the share updated appropriately.

#### Post Edit Drafts

- [x] As User1, edit post with an image - change text and image.
    - [x] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [x] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [x] Post the draft. Confirm draft posts correctly.

- [x] As User1, edit a post with an image - change text and image.
    - [x] Log out. Log back in. Confirm draft is gone.

- [x] As User1, edit a post with a link - change text and link.
    - [x] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [x] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [x] Post the draft.  Confirm draft posts correctly. 

- [x] As User1, edit a post with a link - change text and link.
    - [x] Log out. Log back in. Confirm draft is gone.

## [Delete Post](documentation/testing/test-cases/Post/delete.md)

Test cases related to deleting posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.

### Cases

- [x] Users can delete private posts with images.
    1. As User1, create a private post with an image.
    2. As User2, comment and react to the post.
    3. As User1, delete the post.
    4. As User1, attempt to view the post. Confirm its gone.
    5. As User2, attempt to view the post. Confirm its gone.

- [x] Users can delete private posts with links. 
    1. As User1, create a private post with a link.
    2. As User2, comment and react to the post.
    3. As User1, delete the post.
    4. As User1, attempt to view the post. Confirm its gone.
    5. As User2, attempt to view the post. Confirm its gone.

- [x] Users can delete public posts with images that have been shared. 
    1. As User1, create a public post with an image.
    2. As User2, comment and react to the post.
    3. As User2, share the post.
    4. As User1, delete the post.
    5. As User1, attempt to view the post. Confirm its gone.
    6. As User2, attempt to view the post. Confirm its gone.

- [x] Users can delete public posts with links that have been shared. 
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

- [x] As User1, like one of User2's Posts.
    - [x] Confirm like highlighted and "likes" is incremented by 1.
    - [x] Confirm clicking on the reactions shows User1 as liking.
    - [x] Confirm post increases rank when feed is sorted by "Most Activity"

- [x] As User1, dislike a second one of User2's Posts.
    - [x] Confirm dislike highlighted and "dislikes" is incremented by 1.
    - [x] Confirm clicking on the reactions shows User1 as disliking.
    - [x] Confirm post increases rank when feed is sorted by "Most Activity"

- [x] As User1, demote a third one of User2's Posts.
    - [x] Confirm "Are You Sure" modal shows.
    - [x] Select "Yes".
    - [x] Confirm demote is highlighted and "demotes" is incremented by 1.
    - [x] Confirm clicking on reactions show User1 as demoting.
    - [x] Confirm post decreases rank when feed is sorted by "Most Activity".

## [Update PostReaction](documentation/testing/test-cases/PostReaction/update.md)

Cases covering updating reactions to Posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least three posts.
- [ ] User1 has reacted to each of User2 posts.

### Cases

- [x] As User1, dislike the User2 Post previously liked. 
    - [x] Confirm dislike highlighted and like not highlighted.
    - [x] Confirm "dislikes" is incremented by 1 and "likes" is decremented by 1.
    - [x] Confirm clicking on the reactions shows User1 as disliking.
    - [x] Confirm post rank when feed is sorted by "Most Activity" stays the same
 
- [x] As User1, demote the User2 Post previously disliked
    - [x] Confirm "Are You Sure" modal is shown.
    - [x] Select "yes".
    - [x] Confirm demote highlighted and dislike not highlighted.
    - [x] Confirm demotes is incremented by 1 and dislikes is decremented by 1.
    - [x] Confirm clicking on the reactions shows User1 as demoting.
    - [x] Confirm post decreases rank when feed is sorted by "Most Activity"
 
- [x] As User1, like the User2 Post previously demoted 
    - [x] Confirm like is highlighted and demote is not highlighted
    - [x] Confirm likes is incremented by 1 and demotes is decremented by 1.
    - [x] Confirm clicking on reactions show User1 as liking.
    - [x] Confirm post increases rank when feed is sorted by "Most Activity".

## [Delete PostReaction](documentation/testing/test-cases/PostReaction/delete.md)

Cases covering removing reactions from Posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least three posts.
- [ ] User1 has reacted to each of User2's posts.

### Cases

- [x] As User1, unlike one of User2's Posts.
    - [x] Confirm like unhighlighted and "likes" is decremented by 1.
    - [x] Confirm clicking on the reactions doesn't show User1 as liking.
    - [x] Confirm post decreases rank when feed is sorted by "Most Activity"
 
- [x] As User1, remove a dislike from a second one of User2's Posts.
    - [x] Confirm dislike is not highlighted and "dislikes" is decremented by 1.
    - [x] Confirm clicking on the reactions does not show User1 as disliking.
    - [x] Confirm post decreases rank when feed is sorted by "Most Activity"
 
- [x] As User1, remove a demote from a third one of User2's Posts.
    - [x] Confirm demote is not highlighted and "demotes" is decremented by 1.
    - [x] Confirm clicking on reactions does not show User1 as demoting.
    - [x] Confirm post increaess rank when feed is sorted by "Most Activity".

## [Create PostComment](documentation/testing/test-cases/PostComment/create.md)

Cases covering making comments on posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 has created a public post.

### Cases

- [x] Users can comment on posts they can see.
    1. As User2 comment "First." on User1's post.
        1. Confirm comment appears on User1's post.

- [x] Comments appear in the order they are made.
    1. As User1 comment "Second." on User1's post.
        1. Confirm comment appears on User1's post.
    2. As User2 comment "Third." on User1's post after User1.
        1. Confirm comment appears on User1's post.
        2. Confirm comments appear in correct order:
            - User2: "First." 
            - User1: "Second." 
            - User2: "Third." 

#### Mentions

- [x] Users can mention other users in comments.
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

- [x] Users can draft comments and the drafts will be saved as long as they are logged in.
    1. As User2, write a comment draft.
        1. Navigate away from the home feed and back to feed.  Confirm draft remains. 
        2. Close the Communities browser window. Reopen and reload.  Confirm draft remains.
        3. Post the draft. Confirm comment posts correctly.

- [x] User's comment drafts are deleted when they log out.
    1. As User2, write a comment draft.
        1. Log out. 
        2. Log back in. 
        3. Confirm draft is gone.

- [x] User's comment drafts can be cancelled, which deletes them.
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

- [x] Comments on public posts are always viewable.
    1. As User1, create a public post.
    2. As User2, comment on User1's post.
    3. As User3, attempt to view User2's comment by direct link.  Confirm visible.

- [x] Comments on private posts are only visible by the post author's friends.
    1. As User1, create a private post.
    2. As User2, comment on User1's post.
    3. As User3, attempt to view User2's comment by direct link.  Confirm not visible.

- [x] Users who comment on public posts of those they are not friends with
        lose visibility to those comments if the visibilty of the post changes to
        private.
    1. As User1, create public post.
    2. As User3, comment on User1's post.
    3. As User1, change visibility to private.
    4. As User2, comment on User1's post.
    5. As User3, confirm no comment notification is recieved.
    6. As User3, attempt to view User2's comment by direct link.  Confirm not visible.

#### Mentions

- [x] Users mentioned on posts they can see should be notified of the mention.
    1. As User1, create a public post.
    2. As User2, comment on User1's post and mention User3.
    3. As User3, confirm mention notification. Click through notification and confirm comment is visible.

- [x] Users mentioned on posts they cannot see should not be notified of the mention.
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

- [x] Users should be able to edit their comments.
    1. As User2, comment on User1's post.
        1. Edit comment.
        2. Write edit text.
        3. Post the edit. 
        4. Confirm comment shows the edit.

- [x] Users should be able to cancel edits on their comments.
    1. As User2, comment on User1's post.
        1. Edit the comment.
        2. Write some edit text.
        3. Cancel the edit.
        4. Confirm comment shows original text.

#### Mentions

- [x] Users mentioned in comments should not be notified again when those comments are editted.
    1. As User2, comment on User1's post and mention User3.
    2. As User3, confirm mention notification.
    3. As User2, edit the comment.
        1. Confirm User3 is not notified again.

- [x] Users newly mentioned during a comment edit should be notified. NOTE: This case covers a current bug.
    1. As User2, comment on User1's post. 
        1. Edit the comment and add a mention of User3.
    2. As User3, confirm notification.

#### Drafts

- [x] Users can draft edits of their comments and have them saved.
    1. As User2, comment on User1's post.
        1. Edit the comment.
        2. Write some new text.
        3. Reload the browser, confirm new text remains.
        4. Navigate away from the page and back, confirm new text remains.
    2. As User1, view the comment.
        1. Confirm new text is absent.
    3. As User2, post the comment.
        1. Confirm edit shows up properly.

- [x] User's comment edit drafts are deleted when they log out.
    1. As User2, comment on User1's post.
        1. Edit the comment.
        2. Write some new text.
        3. Log out and log back in.
        4. Confirm text is gone.

- [x] Users can cancel comment edits and the drafts will be deleted.
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

- [x] Users can delete their comments.
    1. As User2, comment on User1's post.
        1. Delete the comment.
        2. Confirm the comment is removed.

- [x] Users should not be able to delete other user's comments.
    1. As User2, comment on User1's post.
    2. As User1, check the dots menu for User2's comment.
        1. Confirm "delete" is not shown.

- [x] Users mentioned in comments should still be able to view the post from the notification, but not the comment.
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

- [x] When a user creates a post they should be subscribed to the post and notified of comments.
    1. As User1, create a post.
        1. Confirm subscribed.
    2. As User2, comment on User1's post.
    3. As User1, confirm notified.

- [x] When a user comments on a post, they should be subscribed to the post and notified of comments.
    1. As User1, create a post.
    2. As User2, comment on User1's post.
        1. Confirm subscribed.
    3. As User1, comment on User1's post.
    4. As User2, confirm notified.

- [x] When a user subscribes to a post, they should be notified of comments.
    1. As User1, create a public post.
    2. As User3, subscribe to User1's post.
    3. As User2, comment on User1's post.
    4. As User3, confirm notification.

- [x] When a user loses the ability to view a subscribed post they should no longer be notified of comments.
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

- [x] When a user unsubscribes from a post they created, they should no longer be notified of comments. 
    1. As User1, create a post.
        1. Unsubscribe from post. 
    2. As User2, comment on User1's post.
    3. As User1, confirm not notified.

- [x] When a user unsubscribes from a post they commented on, they should no longer be notified of comments. 
    1. As User1, create a post.
    2. As User2, comment on User1's post.
        1. Unsubscribe from User1's post. 
    3. As User1, comment on User1's post.
    4. As User2, confirm not notified.

- [x] When a user unsubscribes from a post they subscribed to, they should not longer be notified of comments. 
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

- [x] Users can flag private posts they can see for Site Moderators.
    1. As User1, create a private post.
    2. As User2, flag User1's post for Site Moderators.

- [x] Users can flag public posts they can see for Site moderators.
    1. As User1, create a public post.
    1. As User3, flag User1's public post for Site Moderators.

- [x] Users **cannot** flag posts they can't see.
    1. As User1, create a private post.
    2. As User3, confirm cannot see or flag post.

- [x] Users can flag comments on private posts they can see for Site Moderators.
    1. As User1, create a private post.
    2. As User2, comment on User1's private post.
    3. As User4, flag User2's comment.

- [x] Users can flag comments on public posts they can see for Site Moderators.
    1. As User1, create a public post.
    2. As User2, comment on User1's post.
    3. As User3, flag User2's comment.

- [x] Users **cannot** flag comments on private posts they can't see.
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

- [x] A SiteAdmin can reject flagged posts.
- [x] A SiteAdmin can reject flagged posts with a reason.
- [x] A SiteAdmin can approve flagged posts.
- [x] A SiteAdmin can approve flagged posts with a reason.

- [x] A SiteAdmin can reject flagged comments.
- [x] A SiteAdmin can reject flagged comments with a reason.
- [x] A SiteAdmin can approve flagged comments.
- [x] A SiteAdmin can approve flagged comments with a reason.

## [Create Group](documentation/testing/test-cases/Group/create.md)

Cases covering group creation.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created.

### Cases

#### Top level Groups

- [x] Users can create Public groups.
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

- [x] Users can create Private Groups.
    1. As User1, go to Groups -> Create.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Private Group'
        4. Confirm URL is autopopulated as 'private-group'
        5. Enter some text in the About field.
        6. Choose 'Private' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Private Group'.
    3. As User2, visit 'Private Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

- [x] Users can create Hidden Groups.
    1. As User1, go to Groups -> Create.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Hidden Group'
        4. Confirm URL is autopopulated as 'hidden-group'
        5. Enter some text in the About field.
        6. Choose 'Hidden' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Hidden Group'.
    3. As User2, visit 'Hidden Group'.
        1. Confirm group is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

#### Subgroups

##### Subgroups of Public Groups

- [x] Users can create Public subgroups of Public groups.
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

- [x] Users can create Private subgroups of Public groups.
    1. As User1, create a Public group called 'Public Group'.
    1. As User1, go to 'Public Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Public -> Private Group'
        4. Confirm URL is autopopulated as 'public---private-group'
        5. Enter some text in the About field.
        6. Choose 'Private' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Public -> Private Group'.
    3. As User2, a non-member of both groups, visit 'Public -> Private Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

- [x] Users can create Hidden subgroups of Public groups.
    1. As User1, create a Public group called 'Public Group'.
    1. As User1, go to 'Public Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Public -> Hidden Group'
        4. Confirm URL is autopopulated as 'public---hidden-group'
        5. Enter some text in the About field.
        6. Choose 'Hidden' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Public -> Hidden Group'.
    3. As User2, a non-member of both groups, visit 'Public -> Hidden Group'.
        1. Confirm group is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

#### Subgroups of Private Groups

- [x] Users can create Open subgroups of Priavte groups.
    1. As User1, create a Private group called 'Private Group'.
    1. As User1, go to 'Private Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Private -> Open Group'
        4. Confirm URL is autopopulated as 'private---open-group'
        5. Enter some text in the About field.
        6. Choose 'Open to Group Members' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Private -> Open Group'.
    3. As User2, a non-member of both groups, visit 'Private -> Open Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

- [x] Users can create Private subgroups of Private groups. 1. As User1, create a Private group called 'Private Group'.
    1. As User1, go to 'Private Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Private -> Private Group'
        4. Confirm URL is autopopulated as 'private---private-group'
        5. Enter some text in the About field.
        6. Choose 'Private' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Private -> Private Group'.
    3. As User2, a non-member of both groups, visit 'Private -> Private Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

- [x] Users can create Hidden subgroups of Private groups.
    1. As User1, create a Private group called 'Private Group'.
    1. As User1, go to 'Private Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Private -> Hidden Group'
        4. Confirm URL is autopopulated as 'priavte---hidden-group'
        5. Enter some text in the About field.
        6. Choose 'Hidden' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Private -> Hidden Group'.
    3. As User2, a non-member of both groups, visit 'Private -> Hidden Group'.
        1. Confirm group is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

#### Subgroups of Hidden Groups

- [x] Users can create Open subgroups of Hidden groups.
    1. As User1, create a Hidden group called 'Hidden Group'.
    1. As User1, go to 'Hidden Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Hidden -> Open Group'
        4. Confirm URL is autopopulated as 'hidden---open-group'
        5. Enter some text in the About field.
        6. Choose 'Open to Group Members' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Hidden -> Open Group'.
    3. As User2, a non-member of both groups, visit 'Hidden -> Open Group'.
        1. Confirm group is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

- [x] Users can create Private subgroups of Hidden groups.
    1. As User1, create a Hidden group called 'Hidden Group'.
    1. As User1, go to 'Hidden Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Hidden -> Private Group'
        4. Confirm URL is autopopulated as 'hidden---private-group'
        5. Enter some text in the About field.
        6. Choose 'Private' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Hidden -> Private Group'.
    3. As User2, visit 'Hidden -> Private Group'.
        1. Confirm group is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

- [x] Users can create Hidden subgroups of Hidden groups.
    1. As User1, create a Hidden group called 'Hidden Group'.
    1. As User1, go to 'Hidden Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Hidden -> Hidden Group'
        4. Confirm URL is autopopulated as 'hidden---hidden-group'
        5. Enter some text in the About field.
        6. Choose 'Hidden' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Hidden -> Hidden Group'.
    3. As User2, visit 'Hidden -> Hidden Group'.
        1. Confirm group is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

## [Read Group](documentation/testing/test-cases/Group/read.md)

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

- [x] Non-members can see a Public Group exists and read its description.

- [x] Non-members can view the content of a Public Group.

- [x] Members can see a Public Group exists and read its description.

- [x] Members can view the content of a Public Group.

##### Private Groups

- [x] Non-members can see a Private Group exists and read its description.

- [x] Non-members **cannot*** view the content of a Private Group.

- [x] Members can see a Private Group exists and read its description.

- [x] Members can view the content of a Private Group.

##### Hidden Groups

- [x] Non-members **cannot*** seen a Hidden Group exists or read the description.

- [x] Non-members **cannot*** view the content of a Hidden Group.

- [x] Invited Members can see a Hidden Group exists and read the description.

- [x] Invited Members **cannot*** view the content of a Hidden Group.

- [x] Members can see a Hidden Group exists and read the description.

- [x] Members can view the content of a Hidden Group.

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups


- [x] Non-members can view the content of a Public - Public Group.

- [x] Parent Group Members can view the content of a Public - Public Group.

- [x] Parent Group Admins can view the content of a Public - Public Group.

- [x] Members can view the content of a Public - Public Group.

##### Private Subgroups of Public Groups

- [x] Non-members can see a Public - Private Group exists and read its description.

- [x] Non-members **cannot*** view the content of a Public - Private Group.

- [x] Parent Group Members can see a Public - Private Group exists and read its description.

- [x] Parent Group Members **cannot*** view the content of a Public - Private Group.

- [x] Parent Group Admins can see a Public - Private Group exists and read its description.

- [x] Parent Group Admins can view the content of a Public - Private Group.

- [x] Members can see a Public - Private Group exists and read its description.

- [x] Members can view the content of a Public - Private Group.

###### Hidden Subgroups of Public Groups

- [x] Non-members **cannot*** see a Public - Hidden Group exists or read its description.

- [x] Non-members **cannot*** view the content of a Public - Hidden Group.

- [x] Parent Group Members **cannot*** see a Public - Hidden Group exists or read its description.

- [x] Parent Group Members **cannot*** view the content of a Public - Hidden Group.

- [x] Parent Group Admins can see a Public - Hidden Group exists and read its description.

- [x] Parent Group Admins can view the content of a Public - Hidden Group.

- [x] Members can see a Public - Hidden Group exists and read its description.

- [x] Members can view the content of a Public - Hidden Group.

#### Subgroups of Private Groups

##### Public Subgroups of Private Groups

- [x] Non-members can see a Private - Public Group exists and read its description.

- [x] Non-members **cannot*** view the content of a Private - Public Group.

- [x] Parent Group Members can see a Private - Public Group exists and read its description.

- [x] Parent Group Members can view the content of a Private - Public Group.

- [x] Parent Group Admins can see a Private - Public Group exists and read its description.

- [x] Parent Group Admins can view the content of a Private - Public Group.

- [x] Members can see a Private - Public Group exists and read its description.

- [x] Members can view the content of a Private - Public Group.

##### Private Subgroups of Private Groups

- [x] Non-members can see a Private - Private Group exists and read its description.

- [x] Non-members **cannot*** view the content of a Private - Private Group.

- [x] Parent Group Members can see a Private - Private Group exists and read its description.

- [x] Parent Group Members **cannot*** view the content of a Private - Private Group.

- [x] Parent Group Admins can see a Private - Private Group exists and read its description.

- [x] Parent Group Admins can view the content of a Private - Private Group.

- [x] Members can see a Private - Private Group exists and read its description.

- [x] Members can view the content of a Private - Private Group.

###### Hidden Subgroups of Private Groups

- [x] Non-members **cannot*** see a Private - Hidden Group exists or read its description.

- [x] Non-members **cannot*** view the content of a Private - Hidden Group.

- [x] Parent Group Members **cannot*** see a Private - Hidden Group exists or read its description.

- [x] Parent Group Members **cannot*** view the content of a Private - Hidden Group.

- [x] Parent Group Admins can see a Private - Hidden Group exists and read its description.

- [x] Parent Group Admins can view the content of a Private - Hidden Group.

- [x] Members can see a Private - Hidden Group exists and read its description.

- [x] Members can view the content of a Private - Hidden Group.

#### Subgroups of Hidden Groups

##### Public Subgroups of Hidden Groups

- [x] Non-members **cannot*** see a Hidden - Public Group exists or read its description.

- [x] Non-members **cannot*** view the content of a Hidden - Public Group.

- [x] Parent Group Members can see a Hidden - Public Group exists and read its description.

- [x] Parent Group Members can view the content of a Hidden - Public Group.

- [x] Parent Group Admins can see a Hidden - Public Group exists and read its description.

- [x] Parent Group Admins can view the content of a Hidden - Public Group.

- [x] Members can see a Hidden - Public Group exists and read its description.

- [x] Members can view the content of a Hidden - Public Group.

##### Private Subgroups of Hidden Groups

- [x] Non-members **cannot** see a Hidden - Private Group exists or read its description.

- [x] Non-members **cannot*** view the content of a Hidden - Private Group.

- [x] Parent Group Members can see a Hidden - Private Group exists and read its description.

- [x] Parent Group Members **cannot*** view the content of a Hidden - Private Group.

- [x] Parent Group Admins can see a Hidden - Private Group exists and read its description.

- [x] Parent Group Admins can view the content of a Hidden - Private Group.

- [x] Members can see a Hidden - Private Group exists and read its description.

- [x] Members can view the content of a Hidden - Private Group.

###### Hidden Subgroups of Hidden Groups

- [x] Non-members **cannot*** see a Hidden - Hidden Group exists or read its description.

- [x] Non-members **cannot*** view the content of a Hidden - Hidden Group.

- [x] Parent Group Members **cannot*** see a Hidden - Hidden Group exists or read its description.

- [x] Parent Group Members **cannot*** view the content of a Hidden - Hidden Group.

- [x] Parent Group Admins can see a Hidden - Hidden Group exists and read its description.

- [x] Parent Group Admins can view the content of a Hidden - Hidden Group.

- [x] Members can see a Hidden - Hidden Group exists and read its description.

- [x] Members can view the content of a Hidden - Hidden Group.

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

- [x] The Find Group list includes all groups and subgroups users can see exist and read the description for.

- [x] Users can filter the Find Group list based on name using the Search control.

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

- [x] Members with 'admin' role can update the profile image of a group.

- [x] Members with 'admin' role can update the description of a group.

- [x] Members with 'admin' role can update the Posting Permissions of a group.

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

- [x] Non-members can join.

- [x] Group Moderators can invite non-member friends to join.

- [x] Group Moderators can invite non-users to join using their email.

##### Private Groups

- [x] Non-members can request membership.

- [x] Group Moderators can accept or reject non-member membership requests.

- [x] Group Moderators can invite non-member friends to join.

- [x] Group Moderators can invite non-users to join use their email.

##### Hidden Groups

- [x] Group Moderators can invite non-member friends to join.

- [x] Group Moderators can invite non-users to join use their email.

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

- [x] Non-members can join.

- [x] Parent Group Members can join.

- [x] Parent Group Admins can join.

- [x] Group Moderators can invite non-member friends to join.

- [x] Group Moderators can invite non-users to join using their email.

##### Private Subgroups of Public Groups

- [x] Non-members can request membership.

- [x] Parent Group Members can request membership.

- [x] Parent Group Admins can join.

- [x] Group Moderators can accept or reject non-member membership requests.

- [x] Group Moderators can invite non-member friends to join.

- [x] Group Moderators can invite non-users to join using their email.

###### Hidden Subgroups of Public Groups

- [x] Parent Group Admins can join.

- [x] Group Moderators can invite non-member friends to join.

- [x] Group Moderators can invite non-users to join using their email.

#### Subgroups of Private Groups

##### Public Subgroups of Private Groups

- [x] Non-members can request membership.

- [x] Parent Group Members can join.

- [x] Parent Group Admins can join.

- [x] Group Moderators can accept or reject non-member membership requests.

- [x] Group Moderators can invite non-member friends to join.

- [x] Group Moderators can invite non-users to join using their email.

##### Private Subgroups of Private Groups

- [x] Non-members can request membership.

- [x] Parent Group Members can request membership.

- [x] Parent Group Admins can join.

- [x] Group Moderators can accept or reject non-member membership requests.

- [x] Group Moderators can invite non-member friends to join.

- [x] Group Moderators can invite non-users to join using their email.

###### Hidden Subgroups of Private Groups

- [x] Parent Group Admins can join.

- [x] Group Moderators can invite non-member friends to join.

- [x] Group Moderators can invite non-users to join using their email.

#### Subgroups of Hidden Groups

##### Public Subgroups of Hidden Groups

- [x] Parent Group Members can join.

- [x] Parent Group Admins can join.

- [x] Group Moderators can invite non-member friends to join.

- [x] Group Moderators can invite non-users to join using their email.

##### Private Subgroups of Hidden Groups

- [x] Parent Group Members can request membership.

- [x] Parent Group Admins can join.

- [x] Group Moderators can accept or reject non-member membership requests.

- [x] Group Moderators can invite non-member friends to join.

- [x] Group Moderators can invite non-users to join using their email.

###### Hidden Subgroups of Hidden Groups

- [x] Parent Group Admins can join.

- [x] Group Moderators can invite non-member friends to join.

- [x] Group Moderators can invite non-users to join using their email.

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

- [x] Non-members can query Members.
- [x] Non-members can query Administrators.
- [x] Members can query Members.
- [x] Members can query Administrators.
- [x] Group Moderators can query Members.
- [x] Group Moderators can query Administrators.
- [x] Group Moderators can query Invitations.
- [x] Group Moderators can query Banned Users.
- [x] Group Moderators can query Email Invitations.

##### Private Groups

- [x] Non-members **cannot** query Members.
- [x] Non-members **cannot** query Administrators.
- [x] Members can query Members.
- [x] Members can query Administrators.
- [x] Group Moderators can query Members.
- [x] Group Moderators can query Administrators.
- [x] Group Moderators can query Invitations.
- [x] Group Moderators can query Requests.
- [x] Group Moderators can query Banned Users.
- [x] Group Moderators can query Email Invitations.

##### Hidden Groups

- [x] Non-members **cannot** query Members.
- [x] Non-members **cannot** query Administrators.
- [x] Members can query Members.
- [x] Members can query Administrators.
- [x] Group Moderators can query Members.
- [x] Group Moderators can query Administrators.
- [x] Group Moderators can query Invitations.
- [x] Group Moderators can query Banned Users.
- [x] Group Moderators can query Email Invitations.

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

- [x] Non-members can query Members.
- [x] Non-members can query Administrators.
- [x] Members can query Members.
- [x] Members can query Administrators.
- [x] Parent Group Members can query Members.
- [x] Parent Group Members can query Administrators.
- [x] Parent Group Admins can query Members.
- [x] Parent Group Admins can query Administrators.
- [x] Group Moderators can query Members.
- [x] Group Moderators can query Administrators.
- [x] Group Moderators can query Invitations.
- [x] Group Moderators can query Banned Users.
- [x] Group Moderators can query Email Invitations.

##### Private Subgroups of Public Groups

- [x] Non-members **cannot** query Members.
- [x] Non-members **cannot** query Administrators.
- [x] Members can query Members.
- [x] Members can query Administrators.
- [x] Parent Group Members **cannot** query Members.
- [x] Parent Group Members **cannot** query Administrators.
- [x] Parent Group Admins can query Members.
- [x] Parent Group Admins can query Administrators.
- [x] Group Moderators can query Members.
- [x] Group Moderators can query Administrators.
- [x] Group Moderators can query Invitations.
- [x] Group Moderators can query Requests.
- [x] Group Moderators can query Banned Users.
- [x] Group Moderators can query Email Invitations.

###### Hidden Subgroups of Public Groups

- [x] Non-members **cannot** query Members.
- [x] Non-members **cannot** query Administrators.
- [x] Members can query Members.
- [x] Members can query Administrators.
- [x] Parent Group Members **cannot** query Members.
- [x] Parent Group Members **cannot** query Administrators.
- [x] Parent Group Admins can query Members.
- [x] Parent Group Admins can query Administrators.
- [x] Group Moderators can query Members.
- [x] Group Moderators can query Administrators.
- [x] Group Moderators can query Invitations.
- [x] Group Moderators can query Requests.
- [x] Group Moderators can query Banned Users.
- [x] Group Moderators can query Email Invitations.

#### Subgroups of Private Groups

##### Public Subgroups of Private Groups

- [x] Non-members **cannot** query Members.
- [x] Non-members **cannot** query Administrators.
- [x] Members can query Members.
- [x] Members can query Administrators.
- [x] Parent Group Members can query Members.
- [x] Parent Group Members can query Administrators.
- [x] Parent Group Admins can query Members.
- [x] Parent Group Admins can query Administrators.
- [x] Group Moderators can query Members.
- [x] Group Moderators can query Administrators.
- [x] Group Moderators can query Invitations.
- [x] Group Moderators can query Requests.
- [x] Group Moderators can query Banned Users.
- [x] Group Moderators can query Email Invitations.

##### Private Subgroups of Private Groups

- [x] Non-members **cannot** query Members.
- [x] Non-members **cannot** query Administrators.
- [x] Members can query Members.
- [x] Members can query Administrators.
- [x] Parent Group Members **cannot** query Members.
- [x] Parent Group Members **cannot** query Administrators.
- [x] Parent Group Admins can query Members.
- [x] Parent Group Admins can query Administrators.
- [x] Group Moderators can query Members.
- [x] Group Moderators can query Administrators.
- [x] Group Moderators can query Invitations.
- [x] Group Moderators can query Requests.
- [x] Group Moderators can query Banned Users.
- [x] Group Moderators can query Email Invitations.

###### Hidden Subgroups of Private Groups

- [x] Non-members **cannot** query Members.
- [x] Non-members **cannot** query Administrators.
- [x] Members can query Members.
- [x] Members can query Administrators.
- [x] Parent Group Members **cannot** query Members.
- [x] Parent Group Members **cannot** query Administrators.
- [x] Parent Group Admins can query Members.
- [x] Parent Group Admins can query Administrators.
- [x] Group Moderators can query Members.
- [x] Group Moderators can query Administators.
- [x] Group Moderators can query Invitations.
- [x] Group Moderators can query Requests.
- [x] Group Moderators can query Banned Users.
- [x] Group Moderators can query Email Invitations.

#### Subgroups of Hidden Groups

##### Public Subgroups of Hidden Groups

- [x] Non-members **cannot** query Members.
- [x] Non-members **cannot** query Administrators.
- [x] Members can query Members.
- [x] Members can query Administrators.
- [x] Parent Group Members can query Members.
- [x] Parent Group Members can query Administrators.
- [x] Parent Group Admins can query Members.
- [x] Parent Group Admins can query Administrators.
- [x] Group Moderators can query Members.
- [x] Group Moderators can query Administrators.
- [x] Group Moderators can query Invitations.
- [x] Group Moderators can query Banned Users.
- [x] Group Moderators can query Email Invitations.

##### Private Subgroups of Hidden Groups

- [x] Non-members **cannot** query Members.
- [x] Non-members **cannot** query Administrators.
- [x] Members can query Members.
- [x] Members can query Administrators.
- [x] Parent Group Members **cannot** query Members.
- [x] Parent Group Members **cannot** query Administrators.
- [x] Parent Group Admins can query Members.
- [x] Parent Group Admins can query Administrators.
- [x] Group Moderators can query Members.
- [x] Group Moderators can query Administrators.
- [x] Group Moderators can query Invitations.
- [x] Group Moderators can query Requests.
- [x] Group Moderators can query Banned Users.
- [x] Group Moderators can query Email Invitations.

###### Hidden Subgroups of Hidden Groups

- [x] Non-members **cannot** query Members.
- [x] Non-members **cannot** query Administrators.
- [x] Members can query Members.
- [x] Members can query Administrators.
- [x] Parent Group Members **cannot** query Members.
- [x] Parent Group Members **cannot** query Administrators.
- [x] Parent Group Admins can query Members.
- [x] Parent Group Admins can query Administrators.
- [x] Group Moderators can query Members.
- [x] Group Moderators can query Administrators.
- [x] Group Moderators can query Invitations.
- [x] Group Moderators can query Banned Users.
- [x] Group Moderators can query Email Invitations.

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

- [x] Group Moderators can ban members.

- [x] Group Moderators can accept membership requests.

- [x] Group Admins can promote members to moderator.

- [x] Group Admins can promote members to admin.

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

- [x] Members can leave the group.

- [x] Invited Members can reject the invitation.

- [x] Members Requesting Membership can cancel the request.

- [x] Group Moderators can remove members.

- [x] The last Group Admin cannot leave the group.

## [Create GroupPost](documentation/testing/test-cases/GroupPost/create.md)

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

###### Posting Permissions: Anyone

- [x] Non-members can create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Members

- [x] Non-members **cannot** create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [x] Non-members **cannot** create posts.
- [x] Members can create pending posts.
- [x] Group Moderators can create pending posts.
- [x] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [x] Non-members **cannot** create posts.
- [x] Members **cannot** create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

##### Private Groups

###### Posting Permissions: Anyone

- [x] Non-members **cannot** create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Members

- [x] Non-members **cannot** create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [x] Non-members **cannot** create posts.
- [x] Members can create pending posts.
- [x] Group Moderators can create pending posts.
- [x] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [x] Non-members **cannot** create posts.
- [x] Members **cannot** create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

##### Hidden Groups

###### Posting Permissions: Anyone

- [x] Non-members **cannot** create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Members

- [x] Non-members **cannot** create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [x] Non-members **cannot** create posts.
- [x] Members can create pending posts.
- [x] Group Moderators can create pending posts.
- [x] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [x] Non-members **cannot** create posts.
- [x] Members **cannot** create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

###### Posting Permissions: Anyone

- [x] Non-members can create posts.
- [x] Parent Group Members can create posts. 
- [x] Parent Group Admins can create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Members

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create pending posts.
- [x] Group Moderators can create pending posts.
- [x] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [x] Non-members **cannot** create posts.
- [x] Members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

##### Private Subgroups of Public Groups

###### Posting Permissions: Anyone

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins can create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Members

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create pending posts.
- [x] Group Moderators can create pending posts.
- [x] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [x] Non-members **cannot** create posts.
- [x] Members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Hidden Subgroups of Public Groups

###### Posting Permissions: Anyone

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins can create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Members

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create pending posts.
- [x] Group Moderators can create pending posts.
- [x] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [x] Non-members **cannot** create posts.
- [x] Members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

#### Subgroups of Private Groups

##### Public Subgroups of Private Groups

###### Posting Permissions: Anyone

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members can create posts. 
- [x] Parent Group Admins can create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Members

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create pending posts.
- [x] Group Moderators can create pending posts.
- [x] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [x] Non-members **cannot** create posts.
- [x] Members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

##### Private Subgroups of Private Groups

###### Posting Permissions: Anyone

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins can create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Members

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create pending posts.
- [x] Group Moderators can create pending posts.
- [x] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [x] Non-members **cannot** create posts.
- [x] Members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Hidden Subgroups of Private Groups

###### Posting Permissions: Anyone

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins can create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Members

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create pending posts.
- [x] Group Moderators can create pending posts.
- [x] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [x] Non-members **cannot** create posts.
- [x] Members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

#### Subgroups of Hidden Groups

##### Public Subgroups of Hidden Groups

###### Posting Permissions: Anyone

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members can create posts. 
- [x] Parent Group Admins can create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Members

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create pending posts.
- [x] Group Moderators can create pending posts.
- [x] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [x] Non-members **cannot** create posts.
- [x] Members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

##### Private Subgroups of Hidden Groups

###### Posting Permissions: Anyone

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins can create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Members

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create pending posts.
- [x] Group Moderators can create pending posts.
- [x] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [x] Non-members **cannot** create posts.
- [x] Members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Hidden Subgroups of Hidden Groups

###### Posting Permissions: Anyone

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins can create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Members

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

###### Posting Permissions: Requires Approval 

- [x] Non-members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Members can create pending posts.
- [x] Group Moderators can create pending posts.
- [x] Group Admins can create pending posts.

###### Posting Permissions: Restricted 

- [x] Non-members **cannot** create posts.
- [x] Members **cannot** create posts.
- [x] Parent Group Members **cannot** create posts. 
- [x] Parent Group Admins **cannot** create posts.
- [x] Group Moderators can create posts.
- [x] Group Admins can create posts.

xx [Read GroupPost](documentation/testing/test-cases/GroupPost/read.md) -- Skipping because we've already covered it in the create casts.

## [Update GroupPost](documentation/testing/test-cases/GroupPost/update.md)

Cases covering GroupPost reading.  Who can view the posts in a group?

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

- [x] Post authors can edit their posts.
- [x] Non-post authors cannot edit posts.

## [Delete GroupPost](documentation/testing/test-cases/GroupPost/delete.md)

Cases covering GroupPost reading.  Who can view the posts in a group?

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

- [x] Post authors can delete their posts.
- [x] Non-post authors **cannot** delete posts.

## [Create GroupModeration](documentation/testing/test-cases/GroupModeration/create.md)

Cases covering GroupModeration creation.  Who can flag the posts in a group for group moderators?

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

- [x] Non-members can flag posts.
- [x] Members can flag posts.
- [x] Group Moderators can flag posts.
- [x] Group Admins can flag posts.

##### Private Groups

- [x] Non-members **cannot** flag posts.
- [x] Members can flag posts.
- [x] Group Moderators can flag posts.
- [x] Group Admins can flag posts.

##### Hidden Groups

- [x] Non-members **cannot** flag posts.
- [x] Members can flag posts.
- [x] Group Moderators can flag posts.
- [x] Group Admins can flag posts.

#### Subgroups of Public Groups

##### Public Subgroups of Public Groups

- [x] Non-members can flag posts.
- [x] Members can flag posts.
- [x] Parent Group Members can flag posts. 
- [x] Parent Group Admins can flag posts.
- [x] Group Moderators can flag posts.
- [x] Group Admins can flag posts.

##### Private Subgroups of Public Groups

- [x] Non-members **cannot** flag posts.
- [x] Parent Group Members **cannot** flag posts. 
- [x] Parent Group Admins can flag posts.
- [x] Members can flag posts.
- [x] Group Moderators can flag posts.
- [x] Group Admins can flag posts.

###### Hidden Subgroups of Public Groups

- [x] Non-members **cannot** flag posts.
- [x] Parent Group Members **cannot** flag posts. 
- [x] Parent Group Admins can flag posts.
- [x] Members can flag posts.
- [x] Group Moderators can flag posts.
- [x] Group Admins can flag posts.

#### Subgroups of Private Groups

##### Public Subgroups of Private Groups

- [x] Non-members **cannot** flag posts.
- [x] Parent Group Members can flag posts. 
- [x] Parent Group Admins can flag posts.
- [x] Members can flag posts.
- [x] Group Moderators can flag posts.
- [x] Group Admins can flag posts.

##### Private Subgroups of Private Groups

- [x] Non-members **cannot** flag posts.
- [x] Parent Group Members **cannot** flag posts. 
- [x] Parent Group Admins can flag posts.
- [x] Members can flag posts.
- [x] Group Moderators can flag posts.
- [x] Group Admins can flag posts.

###### Hidden Subgroups of Private Groups

- [x] Non-members **cannot** flag posts.
- [x] Parent Group Members **cannot** flag posts. 
- [x] Parent Group Admins can flag posts.
- [x] Members can flag posts.
- [x] Group Moderators can flag posts.
- [x] Group Admins can flag posts.

#### Subgroups of Hidden Groups

##### Public Subgroups of Hidden Groups

- [x] Non-members **cannot** flag posts.
- [x] Parent Group Members can flag posts. 
- [x] Parent Group Admins can flag posts.
- [x] Members can flag posts.
- [x] Group Moderators can flag posts.
- [x] Group Admins can flag posts.

##### Private Subgroups of Hidden Groups

- [x] Non-members **cannot** flag posts.
- [x] Parent Group Members **cannot** flag posts. 
- [x] Parent Group Admins can flag posts.
- [x] Members can flag posts.
- [x] Group Moderators can flag posts.
- [x] Group Admins can flag posts.

###### Hidden Subgroups of Hidden Groups

- [x] Non-members **cannot** flag posts.
- [x] Parent Group Members **cannot** flag posts. 
- [x] Parent Group Admins can flag posts.
- [x] Members can flag posts.
- [x] Group Moderators can flag posts.
- [x] Group Admins can flag posts.

xx [Read GroupModeration](documentation/testing/test-cases/GroupModeration/read.md) -- Already tested in the previous test cases.
xx [Update GroupModeration](documentation/testing/test-cases/GroupModeration/update.md) -- Already tested in the previous test cases.

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

- [x] Members with 'admin' role can delete groups.

- [x] Non-members with 'admin' or 'superadmin' siteRole can delete groups.

- [x] Deleting a group with content deletes all its content.

- [x] Deleting a group with subgroups also deletes its subgroups.
