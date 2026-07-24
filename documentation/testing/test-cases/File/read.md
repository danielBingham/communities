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

### Manual Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] A group has been created with User1 as a member.
- [ ] A user who has never set a profile image has been created.
- [ ] Sample images are available to upload, along with a video large enough
      to take a noticeable time to process.

#### Post

- [ ] As a user, a post gallery renders in the order the files were attached.
    - As User1:
        - Create a post with five images in a chosen order.
    - As User2:
        - View User1's post.
            - **Confirm the gallery renders in the same order.**

- [ ] As a user, a file that is still processing shows a placeholder rather than a broken image.
    - As User1:
        - Attach a large video to a post and post it immediately.
            - **Confirm a processing placeholder is shown until processing completes.**
            - **Confirm the video renders once processing completes.**

#### Group Profile

- [ ] As a user, I can see a group's profile image wherever the group is shown.
    - As User1:
        - Set a profile image on the group.
        - Visit the group page, the Find Group list, and a post made to the group.
            - **Confirm the group's profile image renders in all three places.**

#### User Profile

- [ ] As a user, I can see another user's profile image wherever they are shown.
    - As User1:
        - Set a profile image.
    - As User2:
        - Visit User1's profile page, the Find Users list, and one of User1's posts.
            - **Confirm User1's profile image renders in all three places.**

- [ ] As a user, a user with no profile image shows the default avatar.
    - As User2:
        - Visit the profile page of a user who has never set a profile image.
            - **Confirm the default avatar renders rather than a broken image.**

### Full Regression

#### Pre-requisites

None.

The file endpoints are not yet covered by the Integration suite.  All file
read cases are defined in the Smoke Test and Manual Regression sections above.
