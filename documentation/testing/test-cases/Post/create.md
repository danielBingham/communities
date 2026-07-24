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

### Manual Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] Sample images and videos are available to upload in `.jpg`, `.png`,
      `.mp4`, `.mov`, `.avi` and `.webp`, including a corrupted copy of each.
- [ ] A youtube video URL is available in both its full (`/watch?vid=`) and
      shortened (`youtu.be`) forms.

#### Cases

- [ ] As a user, I should be able to reorder the images I attach.
    - As User1:
        - Go to the Feed page.
        - Click on the "Create post" form at the top of the feed.
        - Click "Add Image".
        - Select five images and click "ok".
            - **Confirm images are uploaded to post and processed before being shown.**
        - Click and drag an image in the middle of the gallery.  Drag it to the top of the gallery and release.
            - **Confirm image is repositioned as the first image.**
        - Click the second image and drag it down to the fourth spot.
            - **Confirm image is repositioned as the fourth image.**
        - Click "post".
            - **Confirm post shows on feed with a gallery in the correct order.**

- [ ] As a user, I should be able to post long strings without breaking the app.
    - As User1:
        - Create a post with a long (500+ characters) unbroken string.
            - **Confirm app layout is not broken.**

#### Post Drafts

- [ ] As a user, I can draft a post and it will be saved across reloads until I post it.
    - As User1:
        - Create a draft post.
            - Write some text.
            - Attach some media.
        - Navigate away from the home feed and back to feed.
            - **Confirm draft remains.**
        - Close the Communities browser window. Reopen and reload.
            - **Confirm draft remains.**
        - Post the draft.
            - **Confirm draft posts correctly.**

- [ ] As a user, my drafts are cleared out when I log out.
    - As User1:
        - Create a draft post with some text and some media.
        - Log out.
        - Log back in.
            - **Confirm draft is gone.**

- [ ] As a user, I can draft a post with a link and it will be saved across reloads.
    - As User1:
        - Write a post draft with a link.
        - Navigate away from the home feed and back to feed.
            - **Confirm draft remains.**
        - Close the Communities browser window. Reopen and reload.
            - **Confirm draft remains.**
        - Post the draft.
            - **Confirm draft posts correctly.**

- [ ] As a user, my link drafts are cleared out when I log out.
    - As User1:
        - Write a post draft with a link.
        - Log out.
        - Log back in.
            - **Confirm draft is gone.**

#### Youtube Videos

- [ ] As a user, I can post a youtube video using the full link.
    - As User1:
        - Create a post with a youtube video for a link, using the full link (`/watch?vid=`).
            - **Confirm embed loads.**
        - Post the post.
            - **Confirm the embed will play.**

- [ ] As a user, I can post a youtube video using the shortened link.
    - As User1:
        - Create a post with a youtube video for a link using the shortened link (`youtu.be`).
            - **Confirm the embed loads.**
        - Post the post.
            - **Confirm the embed will play.**

#### Links

- [ ] As a user, links in the post body are highlighted.
    - As User1:
        - Make a post with a link in the body.
            - **Confirm the link is highlighted.**
        - Make a post with an incomplete link (`www.refseek.com`, `refseek.com`).
            - **Confirm the link is highlighted.**

- [ ] As a user, a long link doesn't break the mobile layout.
    - As User1:
        - Make a post with a link with a long string in the body.
            - **Confirm it doesn't expand the view on mobile.**

#### Images

- [ ] As a user, I can post the supported image formats.
    - As User1:
        - Make an image post using a `.jpg`.
            - **Confirm the post is created and the image renders.**
        - Make an image post using a `.png`.
            - **Confirm the post is created and the image renders.**

- [ ] As a user, corrupted images are rejected.
    - As User1:
        - Attempt to make a post with a corrupted `.png`.
            - **Confirm failure.**
        - Attempt to make a post with a corrupted `.jpg`.
            - **Confirm failure.**

#### Videos

- [ ] As a user, I can post the supported video formats.
    - As User1:
        - Make a video post using a `.mp4`.
            - **Confirm the post is created and the video plays.**
        - Make a video post using a `.mov`.
            - **Confirm the post is created and the video plays.**
        - Make a video post using a `.avi`.
            - **Confirm the post is created and the video plays.**
        - Make a video post using a `.webp`.
            - **Confirm the post is created and the video plays.**

- [ ] As a user, corrupted videos are rejected.
    - As User1:
        - Make a video post using a corrupted `.mp4`.
            - **Confirm failure.**
        - Make a video post using a corrupted `.mov`.
            - **Confirm failure.**
        - Make a video post using a corrupted `.avi`.
            - **Confirm failure.**
        - Make a video post using a corrupted `.webp`.
            - **Confirm failure.**

### Full Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] Sample images, videos and links are available to attach.

#### Permissions

- [ ] As an unauthenticated visitor, I cannot create a post. (covered: integration)
    - As unauthenticated user:
        - Attempt to create a post.
            - **Confirm the request is refused.**

- [ ] As a user, I can create a feed post for myself. (covered: integration)
    - As User1:
        - Create a post on your own feed.
            - **Confirm the post is created.**

- [ ] As a user, I cannot post on behalf of another user. (covered: integration)
    - As User1:
        - Attempt to create a post attributed to User2.
            - **Confirm the request is refused.**

#### Private Posts

- [ ] As a user, I can make private posts in every form. (covered: integration)
    - As User1:
        - Make a private post with just text.
            - **Confirm the post is created and is private.**
        - Make a private post with just an image.
            - **Confirm the post is created and is private.**
        - Make a private post with just a link.
            - **Confirm the post is created and is private.**
        - Make a private post with just a video.
            - **Confirm the post is created and is private.**
        - Make a private post with text and an image.
            - **Confirm the post is created and is private.**
        - Make a private post with text and a link.
            - **Confirm the post is created and is private.**
        - Make a private post with text and a video.
            - **Confirm the post is created and is private.**

#### Public Posts

- [ ] As a user, I can make public posts in every form. (covered: integration)
    - As User1:
        - Make a public post with just text.
            - **Confirm the post is created and is public.**
        - Make a public post with just an image.
            - **Confirm the post is created and is public.**
        - Make a public post with just a link.
            - **Confirm the post is created and is public.**
        - Make a public post with just a video.
            - **Confirm the post is created and is public.**
        - Make a public post with text and an image.
            - **Confirm the post is created and is public.**
        - Make a public post with text and a link.
            - **Confirm the post is created and is public.**
        - Make a public post with text and a video.
            - **Confirm the post is created and is public.**

- [ ] As a user, mentioning someone in a post notifies them.
    - As User1:
        - Make a post mentioning User2.
    - As User2:
        - **Confirm notification received.**

#### Validation

- [ ] As a user, a post with a missing or invalid type is rejected. (covered: integration)
    - As User1:
        - Attempt to create a post with no type.
            - **Confirm the request is refused.**
        - Attempt to create a post with an invalid type.
            - **Confirm the request is refused.**

- [ ] As a user, a post with a missing or invalid visibility is rejected. (covered: integration)
    - As User1:
        - Attempt to create a post with no visibility.
            - **Confirm the request is refused.**
        - Attempt to create a post with an invalid visibility.
            - **Confirm the request is refused.**

- [ ] As a user, a post with a missing userId is rejected. (covered: integration)
    - As User1:
        - Attempt to create a post with no userId.
            - **Confirm the request is refused.**

- [ ] As a user, invalid content is rejected. (covered: integration)
    - As User1:
        - Attempt to create a post whose content is longer than the limit.
            - **Confirm the request is refused.**
        - Attempt to create a post with null content.
            - **Confirm the request is refused.**

- [ ] As a user, I cannot set server-managed fields on a new post. (covered: integration)
    - As User1:
        - Attempt to create a post that sets `siteModerationId`.
            - **Confirm the request is refused.**
        - Attempt to create a post that sets `groupModerationId`.
            - **Confirm the request is refused.**
        - Attempt to create a post that sets `activity`.
            - **Confirm the request is refused.**
        - Attempt to create a post that sets `createdDate`.
            - **Confirm the request is refused.**
        - Attempt to create a post that sets `updatedDate`.
            - **Confirm the request is refused.**

- [ ] As a user, a feed post carrying a groupId is rejected. (covered: integration)
    - As User1:
        - Attempt to create a feed post that carries a `groupId`.
            - **Confirm the request is refused.**

- [ ] As a non-admin, announcement and info posts are refused. (covered: integration)
    - As User1:
        - Attempt to create an announcement post.
            - **Confirm the request is refused.**
        - Attempt to create an info post.
            - **Confirm the request is refused.**

#### Shared Posts

- [ ] As a user, I can share a public post. (covered: integration)
    - As User2:
        - Make a public post.
    - As User1:
        - Share User2's public post.
            - **Confirm the share is created.**

- [ ] As a user, I cannot share a private post. (covered: integration)
    - As User2:
        - Make a private post.
    - As User1:
        - Attempt to share User2's private post.
            - **Confirm the request is refused.**

- [ ] As a user, I cannot share a post that doesn't exist. (covered: integration)
    - As User1:
        - Attempt to share a post id that does not exist.
            - **Confirm the request is refused.**
