## [Update User: Profile](documentation/testing/test-cases/User/update/profile.md)

Cases covering the user updating their profile.

### Pre-requisites

- [ ] User1 has registered.

### Cases

- [ ] User can upload a profile image.
    1. As User1:
        1. Select "Edit Profile" from the User Menu.
        2. Click Upload Image and choose a profile image. Submit.
        3. Confirm image successfully uploaded.

- [ ] User can crop an uploaded profile image.
    1. As User1:
        1. Select "Edit Profile" from the User Menu.
        2. Click Upload Image and choose a profile image that does not have a 1:1 aspect ratio. 
        3. Confirm image successfully uploaded.
        4. Drag the crop box to an appropriate crop.  Submit the profile form. 
        5. Confirm the image is cropped to the chose crop box.

- [ ] User can remove an uploaded profile image.
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

