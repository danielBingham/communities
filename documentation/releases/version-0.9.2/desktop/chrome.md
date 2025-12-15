# Release 0.9.2 

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
    - [ ] Turn off all email notifications.

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

- [x] Should not receive any notifications when All Notifications are Silenced.

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


#### Friends

#### Posts

#### Post Comments

#### Groups

#### Moderation

## [Query User](documentation/testing/test-cases/User/query.md)

Cases covering searching for users.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.

### Cases

- [x] Should be able to search for people by name on the Find Users page.
- [x] Should be able to search for people by name on the Your Friends page.
- [x] Should be able to search for people by name on the Pending -> Requests page.
- [x] Should not be able to find users who've blocked you.

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

- [x] As User1, make a post mentioning User2.
    - [x] As User2, confirm notification.

#### Public Posts

- [x] As User1, make a post mentioning User2.
    - [x] As User2, confirm notification.

#### Links

- [x] As User1, make a post with a link in the body. Confirm highlighted.
- [x] As User1, make a post with a link with a long string in the body.  Confirm it doesn't expand the view on mobile.

#### Long String

- [x] As User1, make a post with a 500 character unbroken string.
    - [x] Confirm the mobile view is not expanded and the string is broken appropriately.

## [Create PostComment](documentation/testing/test-cases/PostComment/create.md)

Cases covering making comments on posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 has created a public post.

### Cases

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

## [Update Group](documentation/testing/test-cases/Group/update.md)

Cases covering group updates.

### Cases

- [x] Members with 'admin' role can update the profile image of a group.

- [x] Members with 'admin' role can update the description of a group.

- [x] Members with 'admin' role can update the Posting Permissions of a group.

## [Query GroupMember](documentation/testing/test-cases/GroupMember/query.md)

Cases covering searching or browsing for GroupMembers.

### Cases

- [ ] Users can query group members.


## [Create GroupPost](documentation/testing/test-cases/GroupPost/create.md)

Cases covering group deletion.


### Cases

- [x] Users can create group posts.
- [x] Users can mention any group members.

## [Create GroupModeration](documentation/testing/test-cases/GroupModeration/create.md)

Cases covering GroupModeration creation.  Who can flag the posts in a group for group moderators?


### Cases

- [x] Users can flag group posts.
- [x] Users can make pending group posts.


## [Read GroupModeration](documentation/testing/test-cases/GroupModeration/read.md)

Cases covering GroupModeration creation.  Who can flag the posts in a group for group moderators?


### Cases

- [x] Users can see flagged posts.
- [x] Authors and moderators can see pending posts.


## [Update GroupModeration](documentation/testing/test-cases/GroupModeration/update.md)

Cases covering GroupModeration updating.  Who can moderate the posts in a group?


### Cases

- [x] Admins and moderators are notified of posts pending moderation.
