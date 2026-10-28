# Test Index

For each heading, copy the content of the linked file under the heading and
execute the test cases within.

## [Create User: Registration](documentation/testing/test-cases/User/create/registration.md)

Cases covering the User Registration flow.

### Smoke Test

#### Pre-requisites

- [ ] An email client (mailinator) is available for the addresses under test.

#### Cases

- [x] As a new user, I can register an account.
    - As unauthenticated user:
        - Go to the registration form and register a new user named John Doe
          with username `john-doe` (communities-john-doe@mailinator.com).
        - Attempt to register with too short a password.
            - **Confirm validation error.**
        - Attempt to register without checking Age Confirmation.
            - **Confirm validation error.**
        - Complete the form correctly and submit.
            - **Confirm registration succeeds.**
        - Confirm the email address.
        - Accept the Terms of Service.
        - Skip "Pay What you Can".
            - **Confirm landed in the app as an authenticated user.**
        - Turn off all email notifications.

## [Create User: Invitation](documentation/testing/test-cases/User/create/invitation.md)

Cases covering the User Invitation flow, in which a user is sent an invitation
email and may use it to register on the platform.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been registered and has made a private post.
- [ ] An email client (mailinator) is available for the invited addresses.

#### Cases

- [x] As a user, I can invite someone by email and they can register from the invitation.
    - As User1:
        - Invite James Smith (communities-james-smith@mailinator.com).
            - **Confirm invitation is visible on the "Friend Requests" page.**
    - As James Smith:
        - Accept the invite and register with username `james-smith`.
            - **Confirm registration succeeds.**
        - Confirm the email address.
        - Accept the Terms of Service.
        - Skip "Pay What you Can".
        - Turn off all email notifications.
        - Attempt to view User1's profile.
            - **Confirm User1's private post is *not* visible.**
        - Accept the friend request and view User1's profile page.
            - **Confirm User1's private post is now visible.**

## [Create User: Email Confirmation](documentation/testing/test-cases/User/create/email-confirmation.md)

Cases covering the Email Confirmation flow.

### Smoke Test

#### Pre-requisites

- [ ] An email client (mailinator) is available for the addresses under test.

#### Cases

- [x] As a user, I can confirm my email by following the link in the email.
    - As a new user:
        - Register a new user.
        - Check the email you registered.
            - **Confirm email arrives.**
            - **Confirm email contains the token in plain text.**
            - **Confirm it contains a link.**
        - Click the link in the email.
            - **Confirm user is confirmed.**
            - **Confirm TOS page loads.**

- [x] As a user, I can confirm my email by copying and pasting the token into the form.
    - As a new user:
        - Register a new user.
        - Check the email you registered.
            - **Confirm email arrives.**
            - **Confirm it contains a token.**
        - Copy the token into the form and click "Confirm".
            - **Confirm the user is confirmed.**
            - **Confirm the TOS page loads.**

## [Update User: Profile](documentation/testing/test-cases/User/update/profile.md)

Cases covering the user updating their profile.

### Smoke Test

#### Pre-requisites

- [ ] User1 has registered.
- [ ] Sample images are available to upload.

#### Cases

- [ ] As a user, I can upload a profile image.
    - As User1:
        - Select "Edit Profile" from the User Menu.
        - Click Upload Image and choose a profile image. Submit.
            - **Confirm image successfully uploaded.**

- [ ] As a user, I can edit my "Name".
    - As User1:
        - Select "Edit Profile" from the User Menu.
        - Make a change to the "Name" field.
        - Submit the form.
            - **Confirm name updated.**

## [Update User: Notifications](documentation/testing/test-cases/User/update/notifications.md)

Cases covering the user updating their profile to toggle Notifications.

### Smoke Test

#### Pre-requisites

- [ ] User1 has registered.
- [ ] User2 has registered.
- [ ] Email, desktop and mobile notification channels are all available to check.

#### Cases

- [ ] As a user, I should not receive any notifications when All Notifications are Silenced.
    - As User1:
        - Navigate to User Menu -> Notifications and silence All Notifications.
    - As User2:
        - Send User1 a friend request, then post and mention User1.
    - As User1:
        - Check your email, desktop and mobile notifications.
            - **Confirm no notification of any kind is received.**

## [Update User: MFA](documentation/testing/test-cases/User/update/mfa.md)

Cases cover Multifactor Authentication (MFA) setup.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been registered.
- [ ] An authenticator app is available to enrol.

#### Cases

- [ ] As a user, I can enable multifactor authentication.
    - As User1:
        - Select "Multifactor Authentication" from the UserMenu.
        - Click "Setup Multifactor Authentication"
        - Use an authentication app to follow the QR code.
            - **Confirm app loads an authentication site with correct values for Site (Communities) and email (User1's email).**
        - Enter an invalid 6 digit code.
            - **Confirm error.**
        - Enter the 6 digit code from the authentication app to confirm setup.
            - **Confirm setup confirmed and recovery codes presented.**
            - **Confirm email notifying of MFA change.**
        - Save the backup codes somewhere accessible.

- [ ] As a user, my MFA secret and recovery codes do not leak in application responses after setup.
    - As User1:
        - With browser developer tools open (Network tab), complete MFA setup and continue using the app.
            - **Confirm the secret only appears in the response to the setup (pending) request.**
            - **Confirm the recovery codes only appear in the response that confirms setup.**
        - Reload the app and inspect the authenticated user object and subsequent responses.
            - **Confirm neither the secret nor the recovery codes appear in any later response.**

## [Update User: Security](documentation/testing/test-cases/User/update/security.md)

Cases covering the user updating their security fields.

### Smoke Test

#### Pre-requisites

- [ ] User1 has registered.
- [ ] An email client (mailinator) is available for User1's addresses.
- [ ] A second browser or profile (Browser B) is available for the
      multi-session case.

#### Change Email

- [ ] As a user, I can update my email and am required to confirm new email.
    - As User1:
        - Select "Change Email" from the User Menu.
        - Enter a new email and your current password.
        - Submit.
            - **Confirm you are limited to the "Confirm your email" screen.**
        - Open your email client (mailinator) to the new email.
            - **Confirm email is present.**
        - Click "Resend Confirmation".
            - **Confirm second email arrives.**
        - Click the confirmation link in the email.
            - **Confirm email is updated and access to the platform restored.**
        - Log out.
        - Log in using the new email.
            - **Confirm login successful.**

#### Change Password

- [ ] As a user, I can change my password.
    - As User1:
        - Select "Change Password" from the User Menu.
        - Enter a new password.
        - Enter a different password in the "Confirm Password" field.
            - **Confirm validation error.**
        - Enter the correct new password in the "Confirm Password" field.
        - Enter an incorrect old password in the "Old Password" field. Submit the form.
            - **Confirm submission fails.**
        - Enter the correct old password in the "Old Password" field. Submit the form.
            - **Confirm form submits successfully and reports success.**
        - Log out.
        - Attempt to log in using old password.
            - **Confirm login fails.**
        - Log in using the new password.
            - **Confirm log in is successful.**

- [ ] As a logged-in user, changing my password logs out my other sessions but keeps the current one.
    - As User1:
        - Log in on Browser A and, separately, on Browser B.
        - On Browser A, change the password from the Security settings.
            - **Confirm Browser A stays logged in.**
            - **Confirm a password change notification email is received.**
        - Return to Browser B and attempt to navigate or post.
            - **Confirm Browser B's session is no longer authenticated.**

## [Read User](documentation/testing/test-cases/User/read.md)

Cases covering viewing a user's profile and the fields that are disclosed to
each kind of viewer.

NOTE: This file is new.  It gives the manual counterparts for the
`GET /user/:id` Integration suite, which previously had no manual test case
definitions.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is **not** friends with User1.
- [ ] User3 has been created and is friends with User1.
- [ ] User4 has been created and has blocked User2.
- [ ] A site moderator has been created.

#### Cases

- [ ] As a user, my password and multifactor secrets are never disclosed to anyone. (covered: integration)
    - As User1:
        - With browser developer tools open (Network tab), load your own profile page.
            - **Confirm no password or multifactor secret appears in any response.**
        - Load User2's profile page.
            - **Confirm no password or multifactor secret appears in any response.**
    - As a site moderator:
        - Load User1's profile page.
            - **Confirm no password or multifactor secret appears in any response.**

- [ ] As a user, another user's email is never disclosed to me. (covered: integration)
    - As User2:
        - Load User1's profile page.
            - **Confirm User1's email is not shown or present in the response.**
    - As User3 (User1's friend):
        - Load User1's profile page.
            - **Confirm User1's email is not shown or present in the response.**
    - As a site moderator:
        - Load User1's profile page.
            - **Confirm User1's email is not shown or present in the response.**

- [ ] As a user who has been blocked, I cannot view the blocker's profile. (covered: integration)
    - As User2 (blocked by User4):
        - Attempt to load User4's profile page.
            - **Confirm the profile is not found.**
    - As User4 (the blocker):
        - Load User2's profile page.
            - **Confirm the profile loads.**

## [Query User](documentation/testing/test-cases/User/query.md)

Cases covering searching for and browsing lists of users.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.

#### Cases

- [ ] As a user, I can search for people by name on the Find Users page.
    - As User1:
        - Go to the Find Users page.
        - Enter part of User2's name in the search control.
            - **Confirm the list filters down to matching users.**
            - **Confirm User2 is present in the results.**

## [UserRelationship](documentation/testing/test-cases/UserRelationship/create-update-delete.md)

Cases covering sending friend requests, accepting friend requests, and
rejecting friend requests.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 and User2 are not friends.

#### Cases

- [ ] As a user, I can send a friend request.
    - As User1:
        - Send User2 a friend request.
            - **Confirm request shows on "Friend Requests" view.**
            - **Confirm "Cancel Request" shows on User2's profile.**
    - As User2:
        - **Confirm friend request notification received.**
            - **Confirm request shows on "Friend Requests" view.**
            - **Confirm "Accept" or "Reject" show on User1's profile.**
    - As User1:
        - Cancel the request.
            - **Confirm request removed.**

- [ ] As a user, I can accept a friend request and later remove the friend.
    - As User1:
        - Send User2 a friend request.
    - As User2:
        - Accept the friend request.
            - **Confirm request accepted.**
        - Remove User1 as a friend.
            - **Confirm relationship removed.**

- [ ] As a user, I can reject a friend request.
    - As User1:
        - Send User2 a friend request.
    - As User2:
        - Reject the friend request.
            - **Confirm friend request is removed from profile.**
            - **Confirm friend request is removed from "Friend Requests" view.**

## [Authentication](documentation/testing/test-cases/Authentication/authentication.md)

Cases covering the authentication system, logging in, logging out, reset
password flow, etc.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been registered.
- [ ] User1 has Multifactor Authentication enabled, with an authenticator app
      enrolled and their recovery codes saved.
- [ ] An email client (mailinator) is available for User1's address.

#### Log in

- [ ] As a user, I can log in through the splash page.
    - As unauthenticated user:
        - Go to the root `/` page.
        - Enter User1's email and password into the login form.
            - **Confirm authentication by navigating, posting, viewing some posts.**
        - Log out.

- [ ] As a user, I can log in through the Login page.
    - As unauthenticated user:
        - Go to the `/login` page.
        - Enter User1's email and password.
            - **Confirm authentication by navigating, posting, viewing some posts.**
        - Log out.

- [ ] As a user, I can log out. (covered: integration)
    - As User1:
        - Make a draft post, but don't post it.
        - Select UserMenu -> Logout
            - **Confirm that you are logged out and no longer authenticated.**
        - Log in.
            - **Confirm draft post has been cleared.**

- [ ] As a user, actions in a stale tab are rejected after I have logged out and back in.
    - As User1:
        - Log in and open the app in two tabs (Tab A and Tab B).
        - In Tab A, log out and then log back in.
        - In Tab B (still showing the old session), attempt a state-changing action (e.g. post or edit profile).
            - **Confirm the action is rejected rather than silently succeeding.**

#### Reset Password

- [ ] As a user, I can request a password reset.
    - As User1:
        - Log out and click "Forgot password?"
        - Enter User1's email.
            - **Confirm reset email arrives.**
        - Click reset link.
            - **Confirm presented with Reset Password form.**
        - Enter a new password.
            - **Confirm success message shows and redirect to login form.**
            - **Confirm email notification of password change received.**
        - Log in with new password.
            - **Confirm success.**

- [ ] As a user who just reset password, I shouldn't be able to log in with my old password.
    - As User1:
        - Log out.
        - Attempt to log in with old password.
            - **Confirm failure.**
        - Attempt to log in with the new password.
            - **Confirm success.**

- [ ] As a user, requesting a reset for an unknown email doesn't reveal whether an account exists.
    - As unauthenticated user:
        - Click "Forgot password?" and enter an email not associated with any account.
            - **Confirm the same success/confirmation message is shown as for a known email.**
            - **Confirm no reset email is received at that address.**

#### Multifactor Authentication

- [ ] As a user with MFA enabled, I should be required to enter a TOPT token when logging in. (covered: integration)
    - As User1:
        - Log out.
        - Log in with username and password.
            - **Confirm presented with MFA screen.**
        - Enter current MFA token.
            - **Confirm log in success.**

- [ ] As a user with MFA enabled, I should be able to use one of my recovery codes in place of a TOPT token.
    - As User1:
        - Log out.
        - Log in with username and password.
            - **Confirm presented with an MFA screen.**
        - Switch to recovery code view.
        - Enter an invalid recovery code.
            - **Confirm error.**
        - Enter recovery code.
            - **Confirm log in success.**
            - **Confirm email notification of recovery code usage recieved.**

- [ ] As a user who has entered my password but not my MFA token, I cannot access authenticated content. (covered: integration)
    - As User1:
        - Log out, then log in with email and password so the MFA screen is shown.
        - Without entering a token, attempt to navigate directly to an authenticated page (e.g. the home feed or a group URL).
            - **Confirm authenticated content is not shown and I remain on the MFA screen.**
        - Attempt an authenticated action (e.g. loading my feed) via the app.
            - **Confirm the action is not permitted while MFA is pending.**

## [Create Post](documentation/testing/test-cases/Post/create.md)

Cases covering making posts in all their forms and with all their attachments.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created and has friends who can be mentioned.
- [ ] Sample images and videos are available to upload.

#### Cases

- [ ] As a user, I should be able to make a post.
    - As User1:
        - Go to the Feed page.
        - Click on the "Create post" form at the top of the feed.
        - Enter text into the text field.
        - Click "post"
            - **Confirm post is created and navigated back to feed.**

- [ ] As a user, I should get a preview generated for the first link added in the post body.
    - As User1:
        - Go to the Feed page.
        - Click on the "Create post" form at the top of the feed.
        - Enter text into the text field.
        - Enter a link into the text field.
            - NOTE: Not all links generate previews.  Many sites block our
              attempts to scrape, so you might have to try a few different
              sites to get one to generate.  (theguardian.com is pretty reliable)
            - **Confirm a preview is generated from the link.**
            - **Confirm "Add Image" and "Add Video" are disabled after link preview generates.**
        - Click the "X" in the upper right of the preview to remove it.
            - **Confirm preview removes.**
        - Add a new link to the post.
            - **Confirm preview generates for the new link.**
        - Click "post"
            - **Confirm post is created and preview renders.**
            - **Confirm clicking the preview takes the user to the link.**

- [ ] As a user, I should be able to make a post and attach one or more images.
    - As User1:
        - Go to the Feed page.
        - Click on the "Create post" form at the top of the fed.
        - Click "Add Image".
        - Select an image and click "ok".
            - **Confirm image is uploaded to post and processed before being shown.**
        - Click "Add Image".
        - Select two images and click "ok".
            - **Confirm images are both uploaded to the post and processed before being shown.**
        - Click "post".
            - **Confirm post shows on feed with a gallery with all three images.**

- [ ] As a user, I should be able to attach a video to a post.
    - As User1:
        - Go to the Feed page.
        - Click on the "Create post" form at the top of the feed.
        - Click "Add Video".
        - Select a video and click "ok".
            - **Confirm video is attached to the post, processed, and then displayed in a player.**
        - Play the video.
            - **Confirm the video plays.**
        - Click "post".
            - **Confirm post shows on feed and the video renders and plays.**

- [ ] As a user, I should be able to mention my friends in a post.
    - As User1:
        - Go to the Feed page.
        - Click on the "Create post" form at the top of the feed.
        - Type some text in the text box.
        - Type '@' to start a mention and start typing a friends name.
            - **Confirm the friend suggestion list shows appropriate suggestions.**
        - Select a suggestion and hit 'enter'.
            - **Confirm the suggestion is completed.**
        - Type '@' to start a mention and start typing a friend's username.
            - **Confirm the suggestion list shows appropriate suggestions.**
        - Finish typing the friend's username without making a selection.
            - **Confirm suggestion list closes on completion.**
        - Click "post".
            - **Confirm the post is created with the mentions rendered as links.**

## [Update Post](documentation/testing/test-cases/Post/update.md)

Test cases related to editing posts.

Editing posts made to a group is covered separately in
[Update GroupPost](documentation/testing/test-cases/GroupPost/update.md).

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] Sample images are available to upload.

#### Cases

- [ ] As a user, I can edit the text of my post.
    - As User1:
        - Create a post with text and an image.
        - Edit the post and change the text.  Save the edit.
            - **Confirm post updated appropriately.**

## [Delete Post](documentation/testing/test-cases/Post/delete.md)

Test cases related to deleting posts.

Deleting posts made to a group is covered separately in
[Delete GroupPost](documentation/testing/test-cases/GroupPost/delete.md).

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] Sample images are available to upload.

#### Cases

- [ ] As a user, I can delete a private post with an image.
    - As User1:
        - Create a private post with an image.
    - As User2:
        - Comment and react to the post.
    - As User1:
        - Delete the post.
        - Attempt to view the post.
            - **Confirm it's gone.**
    - As User2:
        - Attempt to view the post.
            - **Confirm it's gone.**

## [Create PostReaction](documentation/testing/test-cases/PostReaction/create.md)

Cases covering reacting to Posts.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least one post.

#### Cases

- [ ] As a user, I can like a post.
    - As User1:
        - Like one of User2's Posts.
            - **Confirm like highlighted and "likes" is incremented by 1.**
        - Click on the reactions.
            - **Confirm User1 is shown as liking.**
        - Sort the feed by "Most Activity".
            - **Confirm post increases rank.**

## [Update PostReaction](documentation/testing/test-cases/PostReaction/update.md)

Cases covering updating reactions to Posts.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least one post.
- [ ] User1 has liked one of User2's posts.

#### Cases

- [ ] As a user, I can change a like to a dislike.
    - As User1:
        - Dislike the User2 Post previously liked.
            - **Confirm dislike highlighted and like not highlighted.**
            - **Confirm "dislikes" is incremented by 1 and "likes" is decremented by 1.**
        - Click on the reactions.
            - **Confirm User1 is shown as disliking.**
        - Sort the feed by "Most Activity".
            - **Confirm post rank stays the same.**

## [Delete PostReaction](documentation/testing/test-cases/PostReaction/delete.md)

Cases covering removing reactions from Posts.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least one post.
- [ ] User1 has liked one of User2's posts.

#### Cases

- [ ] As a user, I can unlike a post.
    - As User1:
        - Unlike one of User2's Posts.
            - **Confirm like unhighlighted and "likes" is decremented by 1.**
        - Click on the reactions.
            - **Confirm User1 is not shown as liking.**
        - Sort the feed by "Most Activity".
            - **Confirm post decreases rank.**


## [Read PostComment](documentation/testing/test-cases/PostComment/read.md)

Cases covering who can and cannot see post comments.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.

#### Cases

- [ ] As a user, comments on public posts are always viewable.
    - As User1:
        - Create a public post.
    - As User2:
        - Comment on User1's post.
    - As User3:
        - Attempt to view User2's comment by direct link.
            - **Confirm visible.**

- [ ] As a user, comments on private posts are only visible to the post author's friends.
    - As User1:
        - Create a private post.
    - As User2:
        - Comment on User1's post.
    - As User3:
        - Attempt to view User2's comment by direct link.
            - **Confirm not visible.**

## [Create PostComment](documentation/testing/test-cases/PostComment/create.md)

Cases covering making comments on posts.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created and has created a public post.
- [ ] User2 has been created.

#### Cases

- [ ] As a user, I can comment on a post I can see.
    - As User2:
        - Comment "First." on User1's post.
            - **Confirm comment appears on User1's post.**

- [ ] As a user, comments appear in the order they are made.
    - As User1:
        - Comment "Second." on User1's post.
            - **Confirm comment appears on User1's post.**
    - As User2:
        - Comment "Third." on User1's post after User1.
            - **Confirm comment appears on User1's post.**
            - **Confirm comments appear in the correct order: User2 "First.", User1 "Second.", User2 "Third."**

## [Update PostComment](documentation/testing/test-cases/PostComment/update.md)

Cases covering editing comments on posts.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created and has created a public post.
- [ ] User2 has been created.

#### Cases

- [ ] As a user, I can edit my comments.
    - As User2:
        - Comment on User1's post.
        - Edit the comment.
        - Write edit text.
        - Post the edit.
            - **Confirm comment shows the edit.**

## [Delete PostComment](documentation/testing/test-cases/PostComment/delete.md)

Cases covering deleting comments on posts.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created and has created a public post.
- [ ] User2 has been created.

#### Cases

- [ ] As a user, I can delete my comments.
    - As User2:
        - Comment on User1's post.
        - Delete the comment.
            - **Confirm the comment is removed.**

- [ ] A user **cannot** delete another user's comment.
    - As User2:
        - Comment on User1's post.
    - As User1:
        - Check the dots menu for User2's comment.
            - **Confirm "delete" is not shown.**

## [Create CommentReaction](documentation/testing/test-cases/CommentReaction/create.md)

Cases covering liking PostComments.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least one public post.
- [ ] User2's post has at least one comment that User1 hasn't liked.

#### Cases

- [ ] As a user, I can like a comment.
    - As User1:
        - Click the thumbs up to the left of "Reply" on the comment on User2's post.
            - **Confirm the thumbs up is filled in and highlighted.**
            - **Confirm a like count of 1, with a filled in blue thumbs up, is shown on the left side of the comment, in line with the thumbs up and "Reply" on the right.**
        - Click on the like count.
            - **Confirm a modal opens with User1 listed as liking the comment.**

## [Read CommentReaction](documentation/testing/test-cases/CommentReaction/read.md)

Cases covering who can see likes on PostComments.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least one public post with a comment.
- [ ] User3 has been created.
- [ ] User1 and User3 have both liked the comment on User2's post.

#### Cases

- [ ] As a user, I can't see likes from users I've blocked.
    - As User2:
        - Block User3.
        - View the comment on User2's post.
            - **Confirm the like count is 1.**
        - Click on the like count.
            - **Confirm only User1 is listed as liking the comment.**
        - Unblock User3.

## [Delete CommentReaction](documentation/testing/test-cases/CommentReaction/delete.md)

Cases covering removing likes from PostComments.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least one public post.
- [ ] User1 has liked a comment on User2's post.

#### Cases

- [ ] As a user, I can unlike a comment.
    - As User1:
        - Click the highlighted thumbs up on the comment User1 liked.
            - **Confirm the thumbs up is no longer filled in or highlighted.**
            - **Confirm the like count is decremented by 1, and is hidden if it reaches 0.**
