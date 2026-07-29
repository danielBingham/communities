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

### Manual Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] A group has been created with User1 as an admin.
- [ ] Sample images and videos are available to upload, including an image
      larger than 30 mb, a video larger than 700 mb, and an empty file.

#### Post

- [ ] As a user, I can upload up to 30 items to a post.
    - As User1:
        - Upload 30 items to a post.
            - **Confirm all 30 items upload.**
        - Attempt to upload a 31st item.
            - **Confirm a clear error message is shown.**

- [ ] As a user, I can reorder items I uploaded and have the order respected.
    - As User1:
        - Upload several items to a post and reorder them.
        - Post the post.
            - **Confirm the gallery renders in the chosen order.**

- [ ] As a user, I get a clear error message when a post upload fails.
    - As User1:
        - Trigger an upload error.
            - **Confirm a clear error message is shown.**
        - Attempt to upload an image larger than 30 mb.
            - **Confirm a clear error message is shown.**
        - Attempt to upload a video larger than 700 mb.
            - **Confirm a clear error message is shown.**
        - Attempt to upload an empty file.
            - **Confirm a clear error message is shown.**
        - Trigger a network error during upload.
            - **Confirm a clear error message is shown.**
        - Trigger a processing error during upload.
            - **Confirm a clear error message is shown.**

#### Group Profile

- [ ] As a user, I can upload an image to a group.
    - As User1:
        - Edit the group profile and upload an image.
            - **Confirm the image uploads and is shown.**
        - Crop the image you uploaded.
            - **Confirm the image is cropped to the chosen crop box.**

- [ ] As a user, I get a clear error message when a group profile upload fails.
    - As User1:
        - Trigger an upload error.
            - **Confirm a clear error message is shown.**
        - Attempt to upload an image larger than 30 mb.
            - **Confirm a clear error message is shown.**
        - Attempt to upload a video larger than 700 mb.
            - **Confirm a clear error message is shown.**
        - Attempt to upload an empty file.
            - **Confirm a clear error message is shown.**
        - Trigger a network error during upload.
            - **Confirm a clear error message is shown.**
        - Trigger a processing error during upload.
            - **Confirm a clear error message is shown.**

#### User Profile

- [ ] As a user, I can crop the profile image I uploaded.
    - As User1:
        - Select "Edit Profile" from the User Menu and upload an image.
        - Crop the image you uploaded.
            - **Confirm the image is cropped to the chosen crop box.**

- [ ] As a user, I get a clear error message when a user profile upload fails.
    - As User1:
        - Trigger an upload error.
            - **Confirm a clear error message is shown.**
        - Attempt to upload an image larger than 30 mb.
            - **Confirm a clear error message is shown.**
        - Attempt to upload a video larger than 700 mb.
            - **Confirm a clear error message is shown.**
        - Attempt to upload an empty file.
            - **Confirm a clear error message is shown.**
        - Trigger a network error during upload.
            - **Confirm a clear error message is shown.**
        - Trigger a processing error during upload.
            - **Confirm a clear error message is shown.**

### Full Regression

#### Pre-requisites

None.

The file endpoints are not yet covered by the Integration suite.  All file
upload cases are defined in the Smoke Test and Manual Regression sections
above.
