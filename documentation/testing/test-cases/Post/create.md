## [Create Post](documentation/testing/test-cases/Post/create.md)

Cases covering making posts in all their forms and with all their attachments.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.

### Smoke Test

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
        - Type '@' to start a mention and start typing a friend's name.

### Full Regression

#### Private Posts

- [ ] As User1, make a private post with just text.
- [ ] As User1, make a private post with just an image.
- [ ] As User1, make a private post with just a link.
- [ ] As User1, make a private post with just a video.
- [ ] As User1, make a private post with text and an image.
- [ ] As User1, make a private post with text and a link.
- [ ] As User1, make a private post with text and a video.

#### Public Posts

- [ ] As User1, make a public post with just text.
- [ ] As User1, make a public post with just an image.
- [ ] As User1, make a public post with just a link.
- [ ] As User1, make a public post with just a video.
- [ ] As User1, make a public post with text and an image.
- [ ] As User1, make a public post with text and a link.
- [ ] As User1, make a public post with text and a video.

- [ ] As User1, make a post mentioning User2.
    - [ ] As User2, confirm notification.

#### Links

- [ ] As User1, make a post with a link in the body. Confirm highlighted.
- [ ] As User1, make a post with a link with a long string in the body.  Confirm it doesn't expand the view on mobile.
- [ ] As User1, make a post with an incomplete link (www.refseek.com, refseek.com).  Confirm highlighted.

#### Images

- [ ] As User1, make an image post using a `.jpg`.
- [ ] As User1, make an image post using a `.png`.
- [ ] As User1, attempt to make a post with a corrupted `.png` - confirm failure.
- [ ] As User1, attempt to make a post with a corrupted `.jpg` - confirm failure.

##### Videos

- [ ] As User1, make a video post using a `.mp4`
- [ ] As User1, make a video post using a `.mov`
- [ ] As User1, make a video post using a `.avi`
- [ ] As User1, make a video post using a `.webp`

- [ ] As User1, make a video post using a corrupted `.mp4` - confirm failure.
- [ ] As User1, make a video post using a corrupted `.mov` - confirm failure.
- [ ] As User1, make a video post using a corrupted `.avi` - confirm failure.
- [ ] As User1, make a video post using a corrupted `.webp` - confirm failure.

#### Long String

- [ ] As User1, make a post with a 500 character unbroken string.
    - [ ] Confirm the mobile view is not expanded and the string is broken appropriately.

#### Post Drafts

- [ ] As User1, write a post draft with an image.
    - [ ] Navigate away from the home feed and back to feed.  Confirm draft remains.
    - [ ] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [ ] Post the draft. Confirm draft posts correctly.

- [ ] As User1, write a post draft with an image.
    - [ ] Log out. Log back in. Confirm draft is gone.

- [ ] As User1, write a post draft with a link.
    - [ ] Navigate away from the home feed and back to feed.  Confirm draft remains.
    - [ ] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [ ] Post the draft.  Confirm draft posts correctly.

- [ ] As User1, write a post draft with a link.
    - [ ] Log out. Log back in. Confirm draft is gone.

#### Youtube Videos

- [ ] As User1, create a post with a youtube video for a link, using the full link (`/watch?vid=`)
    - [ ] Confirm embed loads.
    - [ ] Post the post.  Confirm the embed will play.
- [ ] As User1, create a post with a youtube video for a link using the shorted link (`youtu.be`)
    - [ ] Confirm the embed loads.
    - [ ] Post the post. Confirm the embed will play.
