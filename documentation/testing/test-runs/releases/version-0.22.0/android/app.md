# Android App - Manual Regression

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

### Manual Regression

#### Pre-requisites

- [ ] A user with the username `john-doe` has been registered -- the state
      left by the Smoke Test above.
- [ ] An email client (mailinator) is available for the addresses under test.

#### Cases

- [-] As a new user, I cannot register with a username that is already taken.
    - As unauthenticated user:
        - Go to the registration form and begin registering Jane Doe
          (communities-jane-doe@mailinator.com).
        - Attempt to register with the username `john-doe`.
            - **Confirm validation error.**
        - Change the username to `jane-doe` and submit.
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

### Manual Regression

#### Pre-requisites

- [ ] User1 has been registered.
- [ ] User2 has been registered and has made a public post.
- [ ] An email client (mailinator) is available for the invited addresses.
- [ ] A second browser session is available.

#### Cases

- [-] As a user, an invitation cannot be accepted from the inviting user's own session.
    - As User2:
        - Invite Jenny Smith (communities-jenny-smith@mailinator.com).
            - **Confirm invitation is visible on the "Friend Requests" page.**
        - From the same browser session, attempt to accept the invite.
            - **Confirm an error is shown.**
    - As User1:
        - Go to the "Friend Requests" page.
            - **Confirm the invitation is *not* visible.**
    - As Jenny Smith:
        - From a different browser session, accept the invite and register with
          username `jenny-smith`.
            - **Confirm registration succeeds.**
        - Confirm the email address.
        - Accept the Terms of Service.
        - Skip "Pay What you Can".
        - Turn off all email notifications.
        - Accept the friend request and view User2's profile page.
            - **Confirm User2's profile is visible.**

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

### Manual Regression

#### Pre-requisites

- [ ] An email client (mailinator) is available for the addresses under test.

All of the email confirmation cases require access to an email inbox, so none
of them can be covered by the Integration suite.

#### Success cases

- [-] As a user, I can request a new confirmation email from the email confirmation form.
    - As a new user:
        - Register a new user.
        - Click "Resend" on the email confirmation screen.
            - **Confirm a new confirmation email is recieved.**
        - Click the confirmation link in the new email.
            - **Confirm email verification success.**

- [-] As a user, I can logout from the email confirmation form.
    - As a new user:
        - Register a new user.
        - Click "Logout" on the email confirmation screen.
            - **Confirm logged out.**

- [-] As a user, I can confirm my email by following the link in the email when I am logged out.
    - As a new user:
        - Register a new user.
            - **Confirm email confirmnation recieved.**
        - Log out from the email confirmation screen.
        - Follow confirmation link in the confirmation email.
            - **Confirm email confirmation form shows success message.**
            - **Confirm redirected to login page.**

- [-] As a user, I can confirm my email by copying and pasting the token from the email.
    - As a new user:
        - Register a new user.
            - **Confirm email confirmnation recieved.**
        - Copy the token from the confirmation email.
        - Paste the token into the text box on the email confirmation screen.
        - Click "Confirm".
            - **Confirm email confirmation form shows success message.**
            - **Confirm redirected to login page.**

#### Error cases

- [-] As a user, I am shown an error when I follow a link with an invalid token.
    - As a new, unconfirmed user:
        - Follow a confirmation link with a corrupted token.
            - **Confirm an error is shown and the account stays unconfirmed.**

- [-] As a user, I am shown an error when I manually enter an invalid token.
    - As a new, unconfirmed user:
        - Enter a token that does not match the one emailed and click "Confirm".
            - **Confirm an error is shown and the account stays unconfirmed.**

- [-] As a user, I am shown an error when I request a new confirmation while already confirmed.
    - As a newly confirmed user:
        - Return to the email confirmation screen and click "Resend".
            - **Confirm an error is shown and no new email is sent.**

- [-] As a user, I am simply forwarded to TOS when I attempt to re-confirm after already confirming.
    - As a newly confirmed user:
        - Follow the confirmation link a second time.
            - **Confirm no error is shown and the TOS page loads.**

## [Update User: Profile](documentation/testing/test-cases/User/update/profile.md)

Cases covering the user updating their profile.

### Smoke Test

#### Pre-requisites

- [ ] User1 has registered.
- [ ] Sample images are available to upload.

#### Cases

- [x] As a user, I can upload a profile image.
    - As User1:
        - Select "Edit Profile" from the User Menu.
        - Click Upload Image and choose a profile image. Submit.
            - **Confirm image successfully uploaded.**

- [-] As a user, I can edit my "Name".
    - As User1:
        - Select "Edit Profile" from the User Menu.
        - Make a change to the "Name" field.
        - Submit the form.
            - **Confirm name updated.**

### Manual Regression

#### Pre-requisites

- [ ] User1 has registered and has a profile image set.
- [ ] A sample image that does not have a 1:1 aspect ratio is available to upload.

#### Cases

- [x] As a user, I can crop an uploaded profile image.
    - As User1:
        - Select "Edit Profile" from the User Menu.
        - Click Upload Image and choose a profile image that does not have a 1:1 aspect ratio.
            - **Confirm image successfully uploaded.**
        - Drag the crop box to an appropriate crop.  Submit the profile form.
            - **Confirm the image is cropped to the chosen crop box.**

- [ ] As a user, I can remove an uploaded profile image.
    - As User1:
        - Select "Edit Profile" from the User Menu.
        - Click "Remove Image" under your profile image.
            - **Confirm image removed from the form.**
        - Submit the form.
            - **Confirm image removed.**

- [ ] As a user, I can edit "About You".
    - As User1:
        - Select "Edit Profile" from the User Menu.
        - Make a change to the "About You" field.
        - Submit the form and navigate to your profile page.
            - **Confirm About You updated.**

- [x] As a user, the update form doesn't commit updates until submitted.
    - As User1:
        - Select "Edit Profile" from the User Menu.
        - Change your profile picture.
        - Make a change to the "Name" field.
        - Make a change to the "About You" field.
        - In a separate tab, navigate to your profile page.
            - **Confirm changes do not show.**
        - Submit the form.
        - Refresh your separate tab.
            - **Confirm the changes do show.**

## [Update User: Preferences](documentation/testing/test-cases/User/update/preferences.md)

Cases covering the user updating their feed and display preferences.

### Smoke Test

#### Pre-requisites

None.

No preference cases are critical enough for the Smoke Test.  All cases are
defined in the Manual Regression section below.

### Manual Regression

#### Pre-requisites

- [ ] User1 has registered and has friends.
- [ ] A site admin has been created and can create Info and Announcement posts.

#### Info Posts

- [x] As a user, I should not receive Info posts in my feed when they are turned off.
    - As User1:
        - Go to your feed.
            - **Confirm info posts are present in your feed.**
            - NOTE: If they are not, log into an admin user and create some info posts.
        - Navigate to User Menu -> Preferences.
        - Toggle Info posts to "off".
        - Return to your feed.
            - **Confirm info posts *are not* shown.**

- [x] As a user, I should receive Info posts in my feed when they are turned on.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Toggle Info posts to "on".
        - Return to your feed.
            - **Confirm info posts *are* shown.**

#### Announcement Posts

- [x] As a user, I can turn Announcement posts off.
    - As User1:
        - Go to your feed.
            - **Confirm announcement posts are present in your feed.**
            - NOTE: If they are not, log into an admin user and create some announcement posts.
        - Navigate to User Menu -> Preferences.
        - Toggle Announcement posts to "off".
        - Return to your feed.
            - **Confirm announcement posts *are not* shown.**

- [x] As a user, I can turn Announcement posts back on.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Toggle Announcement posts to "on".
        - Return to your feed.
            - **Confirm Announcement posts *are* shown.**

## [Update User: Privacy](documentation/testing/test-cases/User/update/privacy.md)

Cases covering the user updating their feed and display preferences.

### Smoke Test

#### Pre-requisites

- [ ] User1 has registered.
- [ ] User2 has registered and is friends with User1.
- [ ] User3 has registered and is friends with User2 and *not* friends with User1.
- [ ] User4 has registered is *not* friends with User1, User2, or User3.

## Cases

- [ ] As a user, I can turn "Who can see your friends?" to "Just Me" to hide my friends list.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Toggle "Who can see your friends?" to "Just You".
    - As User2:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is NOT shown.**
    - As User3:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is NOT shown.**
    - As User4:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is NOT shown.**

- [ ] As a user, I can turn "Who can see your mutual friends?" to "Just me" to hide my mutual friends.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Toggle "Who can see your mutual friends?" to "Just Me".
    - As User3:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are NOT shown.**

### Manual Regression

#### Pre-requisites

- [ ] User1 has registered.
- [ ] User2 has registered and is friends with User1.
- [ ] User3 has registered and is friends with User2 and *not* friends with User1.

#### Cases

- [ ] As a user, I can turn "Who can see your mutual friends?" to "Friends" to show mutual friends to my friends.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Toggle "Who can see your mutual friends?" to "Friends".
    - As User3:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are NOT shown.**

- [ ] As a user, I can turn "Who can see your mutual friends?" to "Friends of Friends" to show my mutual friends to friends of my friends.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Toggle "Who can see your mutual friends?" to "Friends".
    - As User3:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are shown.**

- [ ] As a user, I can turn "Who can see your mutual friends?" to "Anyone" to show my mutual friends.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Toggle "Who can see your mutual friends?" to "Friends".
    - As User3:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are shown.**

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

### Manual Regression

#### Pre-requisites

- [ ] User1 has been registered.
- [ ] An authenticator app is available to enrol.

#### Cases

All of the MFA setup cases require an authenticator app (or a generated TOPT
secret) and so cannot be covered by the Integration suite.

- [ ] As a user, I can set up MFA by manually entering the secret instead of scanning the QR code.
    - As User1:
        - Start MFA setup from the Security settings.
        - Copy the displayed secret (or use the copy button) and enter it manually into an authenticator app.
            - **Confirm the app generates codes for Communities with User1's email.**
        - Enter a valid code to confirm setup.
            - **Confirm setup succeeds and recovery codes are presented.**

- [ ] As a user, I can cancel MFA setup before confirming and remain without MFA.
    - As User1:
        - Start MFA setup and reach the QR/secret screen.
        - Click "Cancel Setup".
            - **Confirm MFA is left disabled.**
        - Log out and log back in.
            - **Confirm no MFA screen is shown.**

- [ ] As a user, if I refresh the page mid-setup I can safely restart setup.
    - As User1:
        - Start MFA setup and reach the QR/secret screen.
        - Refresh the browser.
            - **Confirm setup has reset (no stale secret) and MFA is disabled.**
        - Start setup again.
            - **Confirm a new QR/secret is generated and setup can be completed.**

- [ ] As a user, my MFA secret is only shown once, during setup.
    - As User1:
        - Complete MFA setup.
        - Navigate away and return to the MFA settings screen.
            - **Confirm the secret and QR code are not shown again.**
            - **Confirm only the enabled state and a disable option are shown.**

- [ ] As a user, my recovery codes are only shown once, during setup.
    - As User1:
        - Complete MFA setup so recovery codes are displayed.
        - Click "Complete Setup".
        - Navigate away and return to the MFA settings screen.
            - **Confirm the recovery codes are not shown again.**

- [ ] As a user, my recovery codes are not shown again if I refresh the recovery-codes screen.
    - As User1:
        - Complete MFA setup so recovery codes are displayed.
        - Refresh the browser while the codes are shown.
            - **Confirm the codes are not shown again and I am not left mid-setup.**

- [ ] As a user, disabling and re-enabling MFA invalidates my old authenticator entry and old recovery codes.
    - As User1:
        - With MFA enabled, disable MFA.
        - Re-enable MFA and complete setup with a newly scanned secret.
        - Log out and attempt to log in using a code from the *old* authenticator entry.
            - **Confirm the old code is rejected.**
        - Attempt to log in using one of the *old* recovery codes.
            - **Confirm the old recovery code is rejected.**
        - Log in using the new authenticator entry.
            - **Confirm success.**

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

### Manual Regression

#### Pre-requisites

- [ ] User1 has registered and has Multifactor Authentication enabled.
- [ ] User2 has registered.
- [ ] An email client (mailinator) is available for the addresses under test.

#### Change Email

- [ ] As a user with MFA enabled, confirming a changed email while logged out does not bypass MFA.
    - As User1 (with MFA enabled):
        - While logged in, change the email address, then log out.
        - Follow the confirmation link sent to the new address while logged out.
            - **Confirm the email is confirmed but I am NOT logged in, and I am redirected to the login page.**
        - Log in with email and password.
            - **Confirm the MFA screen is shown and a valid TOPT token is required.**

- [ ] As a user, an email confirmation link can only be used once.
    - As a new user:
        - Register and receive the confirmation email.
        - Follow the confirmation link.
            - **Confirm confirmation succeeds.**
        - Follow the same confirmation link again.
            - **Confirm the link is now rejected with an invalid-token error.**

- [ ] As a user, an expired email confirmation link is rejected.
    - As a new user:
        - Register but do not confirm.
        - Wait longer than 1 day, then follow the confirmation link.
            - **Confirm the link is rejected with an invalid/expired-token error.**
        - Request a new confirmation email and follow the fresh link.
            - **Confirm the fresh link works.**

- [ ] As a user, I cannot use an email confirmation token that belongs to a different account.
    - As User1:
        - Change email to generate email confirmation link.
    - As User2:
        - Change email to generate email confirmation link.
    - As User1:
        - Attempt to use User2's confirmation link.
            - **Confirm error and User2 not confirmed.**
        - Confirm email with User1's confirmation link.
            - **Confirm success.**
        - Attempt to use User2's confirmation link.
            - **Confirm error and User2 not confirmed.**

#### Change Password

- [ ] As a user with MFA enabled, changing my password does not bypass MFA on my next login.
    - As User1:
        - Change the password while logged in.
        - Log out and log in with the new password.
            - **Confirm the MFA screen is shown and a valid TOPT token is required.**

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

### Manual Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created and is friends with User1.

#### Cases

- [ ] As a user, I can search for people by name on the Your Friends page.
    - As User1:
        - Go to the Your Friends page.
        - Enter part of User3's name in the search control.
            - **Confirm the list filters down to matching friends.**
            - **Confirm User3 is present in the results.**

- [ ] As a user, I can search for people by name on the Pending -> Requests page.
    - As User1:
        - Send a friend request to User2.
        - Go to the Pending -> Requests page.
        - Enter part of User2's name in the search control.
            - **Confirm the list filters down to matching pending requests.**

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

### Manual Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 and User2 are not friends.
- [ ] Two browser sessions are available, one logged in as each user.

#### Cases

- [ ] As a user, it doesn't matter which of us removes the friendship.
    - As User1:
        - Send User2 a friend request.
    - As User2:
        - Accept the friend request.
            - **Confirm request accepted.**
    - As User1:
        - Remove User2 as a friend.
            - **Confirm relationship removed.**

- [ ] As a user, I can cancel a friend request I sent.
    - As User1:
        - Send User2 a friend request.
    - As User2:
        - **Confirm friend request visible.**
    - As User1:
        - Cancel the friend request.
            - **Confirm removed.**
    - As User2:
        - **Confirm removed.**

- [ ] As two users, we can simultaneously remove each other without error.
    - As User1:
        - Send User2 a friend request.
    - As User2:
        - Accept the request.
    - As User1 and User2 together:
        - With two browser windows open, one as User1 and one as User2,
          simultaneously remove each other as friends.
            - **Confirm no error occurs and the relationship is removed for both.**

- [ ] As two users, we can simultaneously add each other and the request is auto-approved.
    - As User1 and User2 together:
        - With two browser windows open, one as User1 and one as User2, send
          each other simultaneous friend requests.
            - **Confirm relationship confirmed.**

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

## [Create PostSubscription](documentation/testing/test-cases/PostSubscription/create.md)

Cases covering subscribing to posts.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.

#### Cases

- [ ] As a user, I am subscribed to the posts I create and notified of comments.
    - As User1:
        - Create a post.
            - **Confirm subscribed.**
    - As User2:
        - Comment on User1's post.
    - As User1:
        - **Confirm notified.**

- [ ] As a user, I am subscribed to the posts I comment on and notified of comments.
    - As User1:
        - Create a post.
    - As User2:
        - Comment on User1's post.
            - **Confirm subscribed.**
    - As User1:
        - Comment on your own post.
    - As User2:
        - **Confirm notified.**

## [Delete PostSubscription](documentation/testing/test-cases/PostSubscription/delete.md)

Cases covering unsubscribing from posts.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.

#### Cases

- [ ] As a user, I stop being notified when I unsubscribe from a post I created.
    - As User1:
        - Create a post.
        - Unsubscribe from the post.
    - As User2:
        - Comment on User1's post.
    - As User1:
        - **Confirm not notified.**

## [Create File](documentation/testing/test-cases/File/create.md)

Cases covering uploading files.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] Sample images and videos are available to upload.

#### Post

- [ ] As a user, I can upload images and videos to a post.
    - As User1:
        - Upload an image to a post.
            - **Confirm the image uploads and is processed before being shown.**
        - Upload several images to a post.
            - **Confirm all the images upload and are processed before being shown.**
        - Upload a video to a post.
            - **Confirm the video uploads and is processed before being shown.**
        - Upload several videos to a post.
            - **Confirm all the videos upload and are processed before being shown.**
        - Upload both videos and images to a post.
            - **Confirm all the items upload and are processed before being shown.**

#### User Profile

- [ ] As a user, I can upload an image to a user profile.
    - As User1:
        - Select "Edit Profile" from the User Menu and upload an image.
            - **Confirm the image uploads and is shown.**

## [Read File](documentation/testing/test-cases/File/read.md)

Cases covering viewing and downloading uploaded files, and who is permitted to
reach them.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] Sample images and videos are available to upload.

#### Post

- [ ] As a user, I can view the images and videos attached to a post I can see.
    - As User1:
        - Create a public post with an image and a video.
    - As User2:
        - View User1's post.
            - **Confirm the image renders.**
            - **Confirm the video renders and plays.**
        - Click the image to open it full size.
            - **Confirm the full size image loads.**

## [Delete File](documentation/testing/test-cases/File/delete.md)

Cases covering deleting files.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] Sample images and videos are available to upload.

#### Post

- [ ] As a user, I can remove media from a post.
    - As User1:
        - Create a post and attach an image.
        - Remove the image from the post.
            - **Confirm the image is removed.**
        - Attach a video to the post.
        - Remove the video from the post.
            - **Confirm the video is removed.**

## [Create SiteModeration](documentation/testing/test-cases/SiteModeration/create.md)

Test cases related to SiteModeration creation.  Who can flag posts and
comments for site moderation?

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is **not** friends with User1.
- [ ] A site moderator has been created.

#### Cases

- [ ] As a user, I can flag a public post for Site Moderators.
    - As User1:
        - Create a public post.
    - As User3:
        - Flag User1's public post for Site Moderators.
            - **Confirm the flag is accepted and a confirmation is shown.**
    - As a site moderator:
        - Open the site moderation queue.
            - **Confirm the flagged post is listed with its reason.**

- [ ] As a user, I can flag a private post I can see for Site Moderators.
    - As User1:
        - Create a private post.
    - As User2:
        - Flag User1's post for Site Moderators.
            - **Confirm the flag is accepted.**

- [ ] A user **cannot** flag a post they can't see.
    - As User1:
        - Create a private post.
    - As User3:
        - Attempt to find User1's post.
            - **Confirm the post cannot be seen and no flag control is offered.**

## [Update SiteModeration](documentation/testing/test-cases/SiteModeration/update.md)

Test cases related to SiteModeration updating.  Who can act on posts and
comments that have been flagged for site moderation?

### Smoke Test

#### Pre-requisites

- [ ] A Site admin user has been created.
- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] Several posts have been flagged for site moderation.

#### Cases

- [ ] As a SiteAdmin, I can reject a flagged post.
    - As the Site admin:
        - Open the site moderation queue and reject a flagged post.
            - **Confirm the post is removed from the platform.**
    - As User2:
        - Attempt to view the rejected post.
            - **Confirm it is shown as removed by moderators rather than silently missing.**

- [ ] As a SiteAdmin, I can approve a flagged post.
    - As the Site admin:
        - Open the site moderation queue and approve a flagged post.
            - **Confirm the post remains visible.**
            - **Confirm the post leaves the moderation queue.**

- [ ] A non-admin **cannot** act on the site moderation queue.
    - As User1:
        - Attempt to open the site moderation queue.
            - **Confirm it is not offered and cannot be reached by URL.**

## [Create Group](documentation/testing/test-cases/Group/create.md)

Cases covering group creation.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created.
- [ ] Sample images are available to upload as group images.

#### Top level Groups

- [ ] As a user, I can create a Public group.
    - As User1:
        - Go to Groups -> Create.
        - Upload an image.
        - Crop the image.
        - Enter the name 'Public Group'.
            - **Confirm URL is autopopulated as 'public-group'.**
        - Enter some text in the About field.
        - Choose 'Public' for Visibility.
        - Leave Posting Permissions set to 'Members'.
        - Submit.
            - **Confirm the group is created.**
        - Create a new post in 'Public Group'.
    - As User2:
        - Visit 'Public Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is visible.**
            - **Confirm members are visible and User1 is listed as Admin.**
        - Click on User1's post permalink.
            - **Confirm visible on post view.**
        - React to User1's post.
            - **Confirm the reaction registers.**
        - Comment on User1's post.
            - **Confirm the comment posts.**

#### Subgroups

- [ ] As a user, I can create a Public subgroup of a Public group.
    - As User1:
        - Create a Public group called 'Public Group'.
        - Go to 'Public Group' -> Subgroups -> Create Subgroup.
        - Upload an image.
        - Crop the image.
        - Enter the name 'Public -> Public Group'.
            - **Confirm URL is autopopulated as 'public---public-group'.**
        - Enter some text in the About field.
        - Choose 'Public' for Visibility.
        - Leave Posting Permissions set to 'Members'.
        - Submit.
            - **Confirm the subgroup is created.**
        - Create a new post in 'Public -> Public Group'.
    - As User2, a non-member of both groups:
        - Visit 'Public -> Public Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is visible.**
            - **Confirm members are visible and User1 is listed as Admin.**
        - Click on User1's post permalink.
            - **Confirm visible on post view.**
        - React to and comment on User1's post.
            - **Confirm both register.**
    - As User1:
        - Invite User3 to 'Public Group'.
    - As User3:
        - Accept User1's invitation to join 'Public Group'.
        - Visit 'Public -> Public Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is visible.**
            - **Confirm members are visible and User1 is listed as Admin.**
        - Click on User1's post permalink.
            - **Confirm visible on post view.**
        - React to and comment on User1's post.
            - **Confirm both register.**

## [Read Group](documentation/testing/test-cases/Group/read.md)

Cases covering reading groups: who can see that a group exists and read its
description, and who can view its content.

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] A Private Group, Private Group, has been created.
- [ ] A Hidden Group, Hidden Group, has been created.

- [ ] Each group contains posts.
- [ ] User3 has been created and added as a member of each group.
- [ ] User7 has been created and is a non-member of all groups.
- [ ] User9 has been created and has been banned from Public Group.

#### Cases

- [ ] As a non-member, I can find and read a Public Group but a Hidden Group is invisible to me.
    - As User7:
        - Visit Public Group.
            - **Confirm the group page loads with its description.**
            - **Confirm the group's posts are visible.**
        - Visit Hidden Group.
            - **Confirm the group is not visible and a not found page renders.**

- [ ] As a non-member, I can read a Private Group's description but not its content.
    - As User7:
        - Visit Private Group.
            - **Confirm the group page loads with its description.**
            - **Confirm the group's posts are *not* visible.**

- [ ] As a member, I can read the content of every group I belong to.
    - As User3:
        - Visit Public Group, Private Group and Hidden Group in turn.
            - **Confirm each group page loads with its description.**
            - **Confirm each group's posts are visible.**

- [ ] As a banned member, a group I have been banned from is invisible to me.
    - As User9:
        - Visit Public Group.
            - **Confirm the group is not visible and a not found page renders.**

## [Query Group](documentation/testing/test-cases/Group/query.md)

Cases covering group querying: the Find Group list and the search control.

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] A Private Group, Private Group, has been created.
- [ ] A Hidden Group, Hidden Group, has been created.

- [ ] User3 has been created and added as a member of each group.
- [ ] User7 has been created and is a non-member of all groups.

#### Cases

- [ ] As a user, the Find Group list only includes groups I am allowed to see.
    - As User7, a non-member of all groups:
        - Go to the Find Group page.
            - **Confirm Public Group and Private Group are listed.**
            - **Confirm Hidden Group is *not* listed.**
    - As User3, a member of all groups:
        - Go to the Find Group page.
            - **Confirm Public Group, Private Group and Hidden Group are all listed.**

## [Update Group](documentation/testing/test-cases/Group/update.md)

Cases covering group updates.

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created with User1 as admin,
      User2 as moderator and User3 as member.
- [ ] User7 has been created and is a non-member of Public Group.
- [ ] Sample images are available to upload as group images.

#### Cases

- [ ] As a group admin, I can update a group's profile.
    - As User1:
        - Go to Public Group -> Settings.
        - Upload a new profile image and crop it.
            - **Confirm the image updates.**
        - Change the description.
            - **Confirm the description updates.**
        - Change the Posting Permissions.
            - **Confirm the Posting Permissions update.**
        - Reload the group page.
            - **Confirm all three changes persisted.**

- [ ] A group moderator **cannot** update the group. (covered: integration)
- [ ] A plain member **cannot** update the group. (covered: integration)
- [ ] A non-member **cannot** update the group. (covered: integration)

## [Create GroupMember](documentation/testing/test-cases/GroupMember/create.md)

Cases covering GroupMember creation: joining a group, requesting membership,
and inviting others to join.

Accepting, rejecting and banning are status transitions and are covered in
[Update GroupMember](documentation/testing/test-cases/GroupMember/update.md).

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] A Private Group, Private Group, has been created.
- [ ] A Hidden Group, Hidden Group, has been created.

- [ ] Each group contains posts.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User7 has been created and is a non-member of all groups.
- [ ] User2 has a friend who is a non-member of all groups, available to invite.

#### Cases

- [ ] As a non-member, I can join a Public Group.
    - As User7:
        - Visit Public Group and click "Join".
            - **Confirm you become a confirmed member immediately.**
            - **Confirm the group's posts become visible.**

- [ ] As a non-member, I can request membership of a Private Group.
    - As User7:
        - Visit Private Group and click "Request Membership".
            - **Confirm the request is recorded as pending.**
            - **Confirm the group's posts remain *not* visible.**
    - As User2, a group moderator:
        - Open the group's pending requests.
            - **Confirm User7's request is listed.**

- [ ] As a group moderator, I can invite a friend to join.
    - As User2:
        - Visit Hidden Group -> Members -> Invite and invite a non-member friend.
            - **Confirm the invitation is recorded as pending.**
    - As the invited user:
        - **Confirm an invitation notification is received.**
        - Accept the invitation.
            - **Confirm you become a confirmed member.**

## [Query GroupMember](documentation/testing/test-cases/GroupMember/query.md)

Cases covering searching or browsing for GroupMembers.

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, and a Private Group, Private Group, have
      been created.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.
- [ ] User7 has been created and is a non-member of all groups.
- [ ] Each group has more members than fit on a single page, along with
      pending invitations, pending requests and banned users.

#### Cases

- [ ] As a member, I can browse the member lists of a group.
    - As User3:
        - Visit Public Group -> Members.
            - **Confirm the Members list loads.**
            - **Confirm the Administrators list loads.**
        - Page through a list longer than one page.
            - **Confirm paging works and no member appears twice.**

- [ ] As a group moderator, I can browse the pending and banned lists.
    - As User2:
        - Visit Private Group -> Members.
            - **Confirm the Invitations list loads.**
            - **Confirm the Requests list loads.**
            - **Confirm the Banned Users list loads.**

- [ ] As a non-member, I **cannot** browse the member lists of a Private Group. (covered: integration)

## [Read GroupMember](documentation/testing/test-cases/GroupMember/read.md)

Cases covering GroupMember reading.  Who can view the members of a group?

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] A Private Group, Private Group, has been created.
- [ ] A Hidden Group, Hidden Group, has been created.

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.
- [ ] User7 has been created and is a non-member of all groups.
- [ ] User9 has been created and has been banned from Public Group.

#### Cases

- [ ] As a non-member, I can see the members of a Public Group but not of a Private or Hidden Group.
    - As User7:
        - Visit Public Group and open the Members tab.
            - **Confirm the member list is visible.**
        - Visit Private Group and open the Members tab.
            - **Confirm the member list is *not* visible.**
        - Visit Hidden Group.
            - **Confirm the group is not visible at all.**

- [ ] As a member, I can see the members of every group I belong to.
    - As User3:
        - Visit Public Group, Private Group and Hidden Group in turn and open the Members tab.
            - **Confirm the member list is visible in each.**
            - **Confirm User1 is listed as Admin and User2 as Moderator.**

- [ ] A banned member **cannot** view the members of the group they were banned from. (covered: integration)

## [Update GroupMember](documentation/testing/test-cases/GroupMember/update.md)

Cases covering GroupMember updates: accepting invitations, approving and
rejecting requests, banning and un-banning, and changing roles.

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, and a Private Group, Private Group, have
      been created.
- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.
- [ ] User7 has been created and is a non-member of all groups.
- [ ] User8 has been created and has a pending invitation to Public Group.
- [ ] Public Group contains posts.

#### Cases

- [ ] As a group moderator, I can accept a membership request.
    - As User7:
        - Request membership of Private Group.
    - As User2:
        - Open Private Group -> Members -> Requests and accept User7's request.
            - **Confirm User7 becomes a confirmed member.**
    - As User7:
        - Visit Private Group.
            - **Confirm the group's posts are now visible.**

- [ ] As a group moderator, I can ban a member.
    - As User2:
        - Open Public Group -> Members and ban User3.
            - **Confirm User3's status changes to banned.**
    - As User3:
        - Visit Public Group.
            - **Confirm the group is no longer visible.**

- [ ] As a group admin, I can promote a member.
    - As User1:
        - Open Public Group -> Members and promote a member to 'moderator'.
            - **Confirm the role changes to moderator.**
        - Promote a member to 'admin'.
            - **Confirm the role changes to admin.**

- [ ] As an invited user, I can accept my invitation.
    - As User8:
        - Open the invitation to Public Group and accept it.
            - **Confirm you become a confirmed member.**

## [Delete GroupMember](documentation/testing/test-cases/GroupMember/delete.md)

Cases covering GroupMember deletion: leaving a group, declining or cancelling
a pending membership, and removing another member.

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created with User1 as its only
      admin, User2 as moderator and User3 as member.
- [ ] Public Group contains posts.

#### Cases

- [ ] As a member, I can leave a group.
    - As User3:
        - Visit Public Group and click "Leave Group".
            - **Confirm you are removed from the member list.**
            - **Confirm the group's posts no longer appear in your feed.**

- [ ] As a group moderator, I can remove a member.
    - As User2:
        - Open Public Group -> Members and remove a plain member.
            - **Confirm the member is removed from the list.**

- [ ] As the last group admin, I cannot leave the group. (covered: integration)
    - As User1, the only admin of a group:
        - Attempt to leave the group.
            - **Confirm the request is refused and you remain a member.**


## [Create GroupPost](documentation/testing/test-cases/GroupPost/create.md)

Cases covering GroupPost creation.  Who can post into a group, under each of
the group's Posting Permissions settings?

The composition of a post (text, images, video, links, mentions, drafts) is
covered in [Create Post](documentation/testing/test-cases/Post/create.md).

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] User1 has been created and added as an admin of Public Group.
- [ ] User2 has been created and added as a moderator of Public Group.
- [ ] User3 has been created and added as a member of Public Group.
- [ ] User7 has been created and is a non-member of Public Group.
- [ ] User9 has been created and has been banned from Public Group.
- [ ] Public Group's Posting Permissions can be switched between 'Anyone',
      'Members', 'Requires Approval' and 'Restricted' during testing.

#### Cases

- [ ] As a member, I can post into a group and the post appears to other members.
    - As User3:
        - Visit Public Group and create a post.
            - **Confirm the post is created and appears in the group.**
    - As User7, a non-member:
        - Visit Public Group.
            - **Confirm User3's post is visible.**

- [ ] As a group admin, Posting Permissions control who may post.
    - As User1:
        - Set Public Group's Posting Permissions to 'Members'.
    - As User7, a non-member:
        - Attempt to post into Public Group.
            - **Confirm posting is not offered and the request is refused.**
    - As User1:
        - Set Posting Permissions to 'Restricted'.
    - As User3, a plain member:
        - Attempt to post into Public Group.
            - **Confirm posting is not offered and the request is refused.**
    - As User2, a group moderator:
        - Post into Public Group.
            - **Confirm the post is created.**

- [ ] As a member of a group set to 'Requires Approval', my post is held pending.
    - As User1:
        - Set Public Group's Posting Permissions to 'Requires Approval'.
    - As User3:
        - Post into Public Group.
            - **Confirm the post is held pending approval rather than published.**
    - As User2:
        - Open the group's pending posts and approve it.
            - **Confirm the post is published.**

- [ ] A banned member **cannot** post into the group. (covered: integration)

## [Read GroupPost](documentation/testing/test-cases/GroupPost/read.md)

Cases covering GroupPost reading.  Who can view the posts in a group?

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] A Private Group, Private Group, has been created.
- [ ] A Hidden Group, Hidden Group, has been created.

- [ ] Each group contains posts.
- [ ] User3 has been created and added as a member of each group.
- [ ] User7 has been created and is a non-member of all groups.
- [ ] User9 has been created and has been banned from Public Group.

#### Cases

- [ ] As a non-member, I can read the posts of a Public Group only.
    - As User7:
        - Visit Public Group.
            - **Confirm the group's posts are visible.**
        - Visit Private Group.
            - **Confirm the group's posts are *not* visible.**
        - Visit Hidden Group.
            - **Confirm the group is not visible at all.**

- [ ] As a member, I can read the posts of every group I belong to.
    - As User3:
        - Visit Public Group, Private Group and Hidden Group in turn.
            - **Confirm the posts are visible in each.**
        - Open a post permalink from Private Group.
            - **Confirm the post view loads.**

- [ ] A banned member **cannot** view the posts of the group they were banned from. (covered: integration)

## [Update GroupPost](documentation/testing/test-cases/GroupPost/update.md)

Cases covering GroupPost updating.  Who can edit the posts in a group?

The composition of an edit (text, images, links, drafts) is covered in
[Update Post](documentation/testing/test-cases/Post/update.md).

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] User2 has been created and added as a moderator of Public Group.
- [ ] User3 has been created and added as a member of Public Group.
- [ ] User7 has been created and is a non-member of Public Group.

#### Cases

- [ ] As a post author, I can edit my own group post.
    - As User3:
        - Create a post in Public Group.
        - Edit the post and change the text.  Save the edit.
            - **Confirm the post updates.**
    - As User7:
        - View the post in Public Group.
            - **Confirm the edited text is shown.**

- [ ] A non-author **cannot** edit a group post. (covered: integration)
    - As User2, a group moderator:
        - Open User3's post in Public Group.
            - **Confirm no edit option is offered.**

## [Delete GroupPost](documentation/testing/test-cases/GroupPost/delete.md)

Cases covering GroupPost deletion.  Who can delete the posts in a group?

Removing a post as a moderation action is covered in
[Update GroupModeration](documentation/testing/test-cases/GroupModeration/update.md).

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] User2 has been created and added as a moderator of Public Group.
- [ ] User3 has been created and added as a member of Public Group.
- [ ] User7 has been created and is a non-member of Public Group.

#### Cases

- [ ] As a post author, I can delete my own group post.
    - As User3:
        - Create a post in Public Group and have another member comment on it.
        - Delete the post.
            - **Confirm the post is removed from the group.**
    - As User7:
        - Attempt to open the post permalink.
            - **Confirm a not found page renders.**

- [ ] A non-author **cannot** delete a group post. (covered: integration)
    - As User2, a group moderator:
        - Open User3's post in Public Group.
            - **Confirm no delete option is offered.**

## [Create GroupModeration](documentation/testing/test-cases/GroupModeration/create.md)

Cases covering GroupModeration creation.  Who can flag the posts in a group for group moderators?

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, and a Private Group, Private Group, have
      been created.

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created, added as a member of each group, and has made
      posts in each.
- [ ] User7 has been created and is a non-member of all groups.

#### Cases

- [ ] As a user, I can flag a post for the group's moderators.
    - As User7:
        - Visit Public Group and flag one of User3's posts.
            - **Confirm the flag is accepted and a confirmation is shown.**
    - As User2, a group moderator:
        - Open Public Group -> Moderation.
            - **Confirm the flagged post is listed with its reason.**

- [ ] As a user, I cannot flag a post I cannot see.
    - As User7:
        - Visit Private Group.
            - **Confirm the group's posts are not visible and no flag control is offered.**

#### Top level Groups

##### Public Groups

- [ ] Non-members **can** flag posts.
- [ ] Members **can** flag posts.
- [ ] Group Moderators **can** flag posts.
- [ ] Group Admins **can** flag posts.

##### Private Groups

- [ ] Non-members **cannot** flag posts.
- [ ] Members **can** flag posts.
- [ ] Group Moderators **can** flag posts.
- [ ] Group Admins **can** flag posts.

##### Hidden Groups

- [ ] Non-members **cannot** flag posts.
- [ ] Members **can** flag posts.
- [ ] Group Moderators **can** flag posts.
- [ ] Group Admins **can** flag posts.

## [Read GroupModeration](documentation/testing/test-cases/GroupModeration/read.md)

Cases covering GroupModeration reading.  Who can see the moderation status of the posts in a group?

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] A Private Group, Private Group, has been created.
- [ ] A Hidden Group, Hidden Group, has been created.

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created, added as a member of each group, and has made
      posts in each.
- [ ] User7 has been created and is a non-member of all groups.
- [ ] At least one post in each group has been flagged and moderated.

#### Cases

- [ ] As a user, I can see when a post I can view has been moderated.
    - As User2, a group moderator:
        - Reject a flagged post in Public Group.
    - As User7:
        - Visit Public Group.
            - **Confirm the rejected post is shown as removed by moderators rather than silently missing.**

- [ ] As a post author, I can see the moderation status of my own post.
    - As User3:
        - Have a post in Public Group rejected by a moderator.
        - Visit the post.
            - **Confirm the moderation status and reason are shown to you.**

## [Update GroupModeration](documentation/testing/test-cases/GroupModeration/update.md)

Cases covering GroupModeration updating.  Who can moderate the posts in a group?

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
- [ ] A Private Group, Private Group, has been created.
- [ ] A Hidden Group, Hidden Group, has been created.

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created, added as a member of each group, and has made
      posts in each.
- [ ] User7 has been created and is a non-member of all groups.
- [ ] At least one post in each group has been flagged.

#### Cases

- [ ] As a group moderator, I can approve and reject flagged posts.
    - As User7:
        - Flag a post in Public Group.
    - As User2, a group moderator:
        - Open Public Group -> Moderation and reject the flagged post.
            - **Confirm the post is removed from the group.**
        - Flag and then approve a second post.
            - **Confirm the post remains visible in the group.**

- [ ] As a plain member, I cannot moderate posts.
    - As User3:
        - Visit Public Group.
            - **Confirm no Moderation section is offered.**
        - Open another member's post.
            - **Confirm no approve or reject controls are offered.**

#### Top level Groups

##### Public Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators **can** moderate posts.
- [ ] Group Admins **can** moderate posts.

##### Private Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators **can** moderate posts.
- [ ] Group Admins **can** moderate posts.

##### Hidden Groups

- [ ] Non-members **cannot** moderate posts.
- [ ] Members **cannot** moderate posts.
- [ ] Group Moderators **can** moderate posts.
- [ ] Group Admins **can** moderate posts.

## [Delete Group](documentation/testing/test-cases/Group/delete.md)

Cases covering group deletion.

### Smoke Test

#### Pre-requisites

- [ ] A Group has been created with User1 as admin, User2 as moderator,
      User3 as member, and User4 as non-member.

#### Cases

- [ ] As a group admin, I can delete a group and all of its content goes with it.
    - As User1:
        - Create a post in the Group and have User3 comment on and react to it.
        - Go to Group -> Settings -> Delete Group and confirm the deletion.
            - **Confirm the group is deleted.**
        - Attempt to visit the group.
            - **Confirm a not found page renders.**
    - As User3:
        - Attempt to visit the group and the post permalink.
            - **Confirm both are gone.**

- [ ] A group moderator **cannot** delete the group. (covered: integration)
- [ ] A plain member **cannot** delete the group. (covered: integration)
- [ ] A non-member **cannot** delete the group. (covered: integration)
