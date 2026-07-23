## [Update File](documentation/testing/test-cases/File/update.md)

Cases covering updating files.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] A group has been created with User1 as admin.

### Smoke Test

No file update cases are critical enough for the Smoke Test.  All cases are
defined in the Manual Regression section below.

### Manual Regression

#### Post

- [ ] As a user, I can reorder files on a post.
    - As User1:
        - Create a post with several images.
        - Drag the images into a different order.
            - **Confirm the images reposition as dragged.**
        - Post the post.
            - **Confirm the gallery renders in the new order.**

- [ ] As a user, I can add new files to a post.
    - As User1:
        - Create a post with an image.
        - Edit the post and add a second image.
        - Save the edit.
            - **Confirm both images render on the post.**

#### Group Profile

- [ ] As a user, I can replace a group's profile image.
    - As User1:
        - Edit the group profile and upload a new image over the existing one.
        - Submit the form.
            - **Confirm the new image replaces the old one everywhere the group is shown.**

#### User Profile

- [ ] As a user, I can replace my profile image.
    - As User1:
        - Select "Edit Profile" from the User Menu and upload a new image over the existing one.
        - Submit the form.
            - **Confirm the new image replaces the old one everywhere you are shown.**

### Full Regression

The file endpoints are not yet covered by the Integration suite.  All file
update cases are defined in the Manual Regression section above.
