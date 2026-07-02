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
