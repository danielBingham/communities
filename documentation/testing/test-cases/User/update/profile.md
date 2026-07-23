## [Update User: Profile](documentation/testing/test-cases/User/update/profile.md)

Cases covering the user updating their profile.

### Pre-requisites

- [ ] User1 has registered.

### Smoke Test

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

### Manual Regression

- [ ] As a user, I can crop an uploaded profile image.
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

- [ ] As a user, the update form doesn't commit updates until submitted.
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

### Full Regression

The user update endpoint is not yet covered by the Integration suite.  All
profile update cases are defined in the Smoke Test and Manual Regression
sections above.
