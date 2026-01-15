## [Create Post](documentation/testing/test-cases/Post/create.md)

Cases covering making posts in all their forms and with all their attachments.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.

### Cases

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
