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

### Manual Regression

#### Pre-requisites

- [ ] User1 has been created and has a profile image set.
- [ ] A group has been created with User1 as an admin and a group image set.

#### Group Profile

- [ ] As a user, I can remove a group's profile image.
    - As User1:
        - Edit the group profile and click "Remove Image".
            - **Confirm the image is removed from the form.**
        - Submit the form.
            - **Confirm the group falls back to the default image everywhere it is shown.**

#### User Profile

- [ ] As a user, I can remove my profile image.
    - As User1:
        - Select "Edit Profile" from the User Menu and click "Remove Image".
            - **Confirm the image is removed from the form.**
        - Submit the form.
            - **Confirm you fall back to the default avatar everywhere you are shown.**

### Full Regression

#### Pre-requisites

None.

The file endpoints are not yet covered by the Integration suite.  All file
deletion cases are defined in the Smoke Test and Manual Regression sections
above.
