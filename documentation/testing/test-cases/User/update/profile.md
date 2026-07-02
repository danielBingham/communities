## [Update User: Profile](documentation/testing/test-cases/User/update/profile.md)

Cases covering the user updating their profile.

### Pre-requisites

- [ ] User1 has registered.

### Cases

- [ ] User can upload a profile image.
    - As User1:
        - Select "Edit Profile" from the User Menu.
        - Click Upload Image and choose a profile image. Submit.
        - Confirm image successfully uploaded.

- [ ] User can crop an uploaded profile image.
    - As User1:
        - Select "Edit Profile" from the User Menu.
        - Click Upload Image and choose a profile image that does not have a 1:1 aspect ratio. 
        - Confirm image successfully uploaded.
        - Drag the crop box to an appropriate crop.  Submit the profile form. 
        - Confirm the image is cropped to the chose crop box.

- [ ] User can remove an uploaded profile image.
    - As User1:
        - Select "Edit Profile" from the User Menu.
        - Click "Remove Image" under your profile image.  Confirm image removed.
        - Submit the form. Confirm image removed.

- [ ] User can edit "Name".
    - As User1:
        - Select "Edit Profile" from the User Menu.
        - Make a change to the "Name" field.
        - Submit the form.  Confirm name updated.

- [ ] User can edit "About You".
    - As User1:
        - Select "Edit Profile" from the User Menu.
        - Make a change to the "About You" field.
        - Submit the form.  Navigate to profile page and confirm About You updated.

- [ ] User update form doesn't commit updates until submitted.
    - As User1:
        - Select "Edit Profile" from the User Menu.
        - Change your profile picture.
        - Make a change to the "Name" field.
        - Make a change to the "About You" field.
        - In a separate tab, navigate to your profile page. Confirm changes do not show.
        - Submit the form.
        - Refresh your separate tab and confirm the changes do show.

- [ ] User can update email and is required to confirm new email.
    - As User1:
        - Select "Change Email" from the User Menu.
        - Enter a new email and your current password.
        - Submit. 
            - **Confirm you are limited to the "Confirm your email" screen.**
        - Open your email client (mailinator) to the new email. 
            - **Confirm email is present.**
        - Click "Resend Confirmation".
        - In your email client, confirm second email arrives.
        - Click the confirmation link in the email.
            - **Confirm email is updated and access to the platform restored.**
        - Log out.
        - Log in using the new email.
            - **Confirm login successful.**

- [ ] User can change password.
    - As User1:
        - Select "Change Password" from the User Menu.
        - Enter a new password. 
        - Enter a different password in the "Confirm Password" field.  Confirm validation error.
        - Enter the correct new password in the "Confirm Password" field.
        - Enter an incorrect old password in the "Old Password" field.
        - Submit the form.  Confirm submission fails.
        - Enter the correct old password in the "Old Password" field.
        - Submit the form. Confirm form submits successful and reports success.
        - Log out.
        - Attempt to log in using old password.  Confirm login fails.
        - Log in using the new password.  Confirm log in is successful.

