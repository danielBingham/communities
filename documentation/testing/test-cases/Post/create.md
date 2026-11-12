## [Create Post](documentation/testing/test-cases/Post/create.md)

Cases covering making posts in all their forms and with all their attachments.

The cases' links go to two posts on the Communities News page, which
reliably generate previews:

- `https://communities.social/about/news/9-29-2026-protocols-arent-the-answer`
- `https://communities.social/about/news/9-30-2026-social-solutions-for-enshittification`

The sample media are in `web-application/test/lib/fixtures/assets`.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created and has friends who can be mentioned.
- [ ] Sample images and videos are available to upload.

#### Cases

- [ ] As a user, I should be able to make a post. (covered: e2e)
    - As User1:
        - Go to the Feed page.
        - Click on the "Create post" form at the top of the feed.
        - Enter text into the text field.
        - Click "post"
            - **Confirm post is created and navigated back to feed.**

- [ ] As a user, I should get a preview generated for the first link added in the post body. (covered: e2e)
    - As User1:
        - Go to the Feed page.
        - Click on the "Create post" form at the top of the feed.
        - Enter text into the text field.
        - Enter a link into the text field.
            - **Confirm a preview is generated from the link.**
            - **Confirm "Add Image" and "Add Video" are no longer offered after the link preview generates.**
        - Click the "X" in the upper right of the preview to remove it.
            - **Confirm preview removes.**
            - **Confirm "Add Image" and "Add Video" are offered again.**
        - Add a new link to the post.
            - **Confirm preview generates for the new link.**
        - Click "post"
            - **Confirm post is created and preview renders.**
            - **Confirm clicking the preview opens the link in a new tab.**

- [ ] As a user, I should be able to make a post and attach one or more images. (covered: e2e)
    - As User1:
        - Go to the Feed page.
        - Click on the "Create post" form at the top of the feed.
        - Click "Add Image".
        - Select an image and click "ok".
            - **Confirm image is uploaded to post and processed before being shown.**
        - Click "Add Image".
        - Select two images and click "ok".
            - **Confirm images are both uploaded to the post and processed before being shown.**
        - Click "post".
            - **Confirm post shows on feed with a gallery with all three images, in the order they were added.**

- [ ] As a user, I should be able to attach a video to a post. (covered: e2e)
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

- [ ] As a user, I should be able to mention my friends in a post. (covered: e2e)
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

### Full Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is **not** friends with User1.
- [ ] A site admin has been created.
- [ ] Sample images and videos are available to upload in `.jpg`, `.png`,
      `.mp4` and `.mov`, along with a corrupted copy of each, and a file of a
      type we don't support (`.webp` or `.gif` for images, `.webm` or `.avi`
      for videos).
- [ ] Sample links are available to attach.
- [ ] A youtube video URL is available in both its full (`/watch?vid=`) and
      shortened (`youtu.be`) forms.

#### Cases

- [ ] As a user, I should be able to reorder the images I attach. (covered: e2e)
    - As User1:
        - Go to the Feed page.
        - Click on the "Create post" form at the top of the feed.
        - Click "Add Image".
        - Select three images and click "ok".
            - **Confirm images are uploaded to post and processed before being shown.**
        - Click and drag the last image to the top of the gallery and release.
            - **Confirm image is repositioned as the first image.**
        - Click the second image and drag it down to the last spot.
            - **Confirm image is repositioned as the last image.**
        - Click "post".
            - **Confirm post shows on feed with a gallery in the correct order.**

- [ ] As a user, I should be able to post long strings without breaking the app. (covered: e2e)
    - As User1:
        - Create a post with a long (500+ characters) unbroken string.
            - **Confirm app layout is not broken.**

- [ ] As a user, I'm asked before a post I've started is discarded. (covered: e2e)
    - As User1:
        - Open the post form and click "Cancel" without writing anything.
            - **Confirm the form closes without asking.**
        - Open the post form, write some text and attach an image.
        - Click "Cancel".
            - **Confirm you're asked whether to discard the post.**
        - Click "Keep Editing".
            - **Confirm the form still has the text and the image.**
        - Click "Cancel", then "Discard Post".
            - **Confirm the form closes, and opening it again shows an empty form.**

#### Post Drafts

- [ ] As a user, I can draft a post and it will be saved across reloads until I post it. (covered: e2e)
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

- [ ] As a user, my drafts are cleared out when I log out. (covered: e2e)
    - As User1:
        - Create a draft post with some text and some media.
        - Log out.
        - Log back in.
            - **Confirm draft is gone.**

- [ ] As a user, I can draft a post with a link and it will be saved across reloads. (covered: e2e)
    - As User1:
        - Write a post draft with a link.
        - Navigate away from the home feed and back to feed.
            - **Confirm draft remains.**
        - Close the Communities browser window. Reopen and reload.
            - **Confirm draft remains.**
        - Post the draft.
            - **Confirm draft posts correctly.**

- [ ] As a user, my link drafts are cleared out when I log out. (covered: e2e)
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

- [ ] As a user, links in the post body are highlighted. (covered: e2e)
    - As User1:
        - Make a post with a link in the body.
            - **Confirm the link is highlighted.**
        - Make a post with an incomplete link, without its `https://`.
            - **Confirm the link is highlighted.**

- [ ] As a user, a long link doesn't break the mobile layout. (covered: e2e)
    - As User1:
        - Make a post with a link with a long string in the body.
            - **Confirm it doesn't expand the view on mobile.**

#### Images

- [ ] As a user, I can post the supported image formats. (covered: e2e)
    - As User1:
        - Make an image post using a `.jpg`.
            - **Confirm the post is created and the image renders.**
        - Make an image post using a `.png`.
            - **Confirm the post is created and the image renders.**

- [ ] As a user, corrupted images are rejected. (covered: e2e)
    - As User1:
        - Attempt to make a post with a corrupted `.png`.
            - **Confirm failure.**
        - Attempt to make a post with a corrupted `.jpg`.
            - **Confirm failure.**

- [ ] As a user, images of a type we don't support are refused. (covered: e2e)
    - As User1:
        - Click "Add Image" and select an image that isn't a `.jpg` or a `.png`.
            - **Confirm an error names the file and the supported types, and it isn't attached.**

- [ ] As a user, I can remove an image I've attached before I post. (covered: e2e)
    - As User1:
        - Open the post form and attach two images.
        - Click the "X" on one of them.
            - **Confirm it's removed and the other stays.**
        - Click "post".
            - **Confirm the post shows only the image that stayed.**

#### Videos

- [ ] As a user, I can post the supported video formats. (covered: e2e)
    - As User1:
        - Make a video post using a `.mp4`.
            - **Confirm the post is created and the video plays.**
        - Make a video post using a `.mov`.
            - **Confirm the post is created and the video plays.**

- [ ] As a user, corrupted videos are rejected. (covered: e2e)
    - As User1:
        - Make a video post using a corrupted `.mp4`.
            - **Confirm failure.**
        - Make a video post using a corrupted `.mov`.
            - **Confirm failure.**

- [ ] As a user, videos of a type we don't support are refused. (covered: e2e)
    - As User1:
        - Click "Add Video" and select a video that isn't a `.mp4` or a `.mov`.
            - **Confirm an error names the file and the supported types, and it isn't attached.**

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

- [ ] As a user, I can make a post public from the post form. (covered: e2e)
    - As User1:
        - Open the post form.
            - **Confirm the post is for "Friends" unless you choose otherwise.**
        - Choose "Public" from the visibility menu, write some text and click "post".
            - **Confirm the post shows as "Public".**
    - As User3:
        - Go to User1's profile.
            - **Confirm the post shows.**

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

- [ ] As a user, mentioning someone in a post notifies them. (covered: e2e)
    - As User1:
        - Make a post mentioning User2.
    - As User2:
        - **Confirm notification received.**

#### Announcements

- [ ] As a site admin, I can make announcement and info posts, which every user sees. (covered: e2e)
    - As User1:
        - Open the post form.
            - **Confirm there's no choice of post type.**
    - As the site admin:
        - Open the post form and choose "Announcement" from the post type menu.
            - **Confirm the post is "Public", with no other choice.**
        - Write some text and click "post".
            - **Confirm the post shows as an announcement.**
        - Do the same with "Info".
            - **Confirm the post shows as info.**
    - As User1, who isn't the site admin's friend:
        - Go to the Feed page.
            - **Confirm both posts show.**

#### Validation

- [ ] As a user, the post form stops at 10,000 characters. (covered: e2e)
    - As User1:
        - Paste more than 10,000 characters into the post form.
            - **Confirm an error says posts are limited to 10,000 characters, and the text isn't taken.**
        - Paste exactly 10,000 characters.
            - **Confirm the text is taken, and the error goes.**

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

- [ ] As a user, I can share a public post. (covered: e2e, integration)
    - As User2:
        - Make a public post.
    - As User1:
        - Click "Share" on User2's public post.
            - **Confirm the post form opens with User2's post attached, and without "Add Image" or "Add Video".**
        - Write some text and click "post".
            - **Confirm the share is created, with your text and User2's post inside it.**

- [ ] As a user, I cannot share a private post. (covered: e2e, integration)
    - As User2:
        - Make a private post.
    - As User1:
        - Find User2's private post.
            - **Confirm it offers no "Share".**
        - Attempt to share User2's private post.
            - **Confirm the request is refused.**

- [ ] As a user, I cannot share a post that doesn't exist. (covered: integration)
    - As User1:
        - Attempt to share a post id that does not exist.
            - **Confirm the request is refused.**
