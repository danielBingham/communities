## [Update Post](documentation/testing/test-cases/Post/update.md)

Test cases related to editing posts.

Editing posts made to a group is covered separately in
[Update GroupPost](documentation/testing/test-cases/GroupPost/update.md).

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is **not** friends with User1.
- [ ] A site moderator has been created.

### Smoke Test

- [ ] As a user, I can edit the text of my post.
    - As User1:
        - Create a post with text and an image.
        - Edit the post and change the text.  Save the edit.
            - **Confirm post updated appropriately.**

### Manual Regression

#### Post Editing

- [ ] As a user, I can edit a post with an image.
    - As User1:
        - Create a post with text and an image.
        - Edit the post and change the image.  Save the edit.
            - **Confirm the post updated appropriately.**
        - Edit the post and change the text. Cancel the edit.
            - **Confirm the post was not updated.**
        - Edit the post and change the image.  Cancel the edit.
            - **Confirm the post was not updated.**

- [ ] As a user, I can edit a post with a link.
    - As User1:
        - Create a post with text and a link.
        - Edit the post and change the text.  Save the edit.
            - **Confirm post updated appropriately.**
        - Edit the post and change the link.  Save the edit.
            - **Confirm the post updated appropriately.**
        - Edit the post and change the text. Cancel the edit.
            - **Confirm the post was not updated.**
        - Edit the post and change the link.  Cancel the edit.
            - **Confirm the post was not updated.**

- [ ] As a user, edits to a post I made propagate to shares of that post.
    - As User1:
        - Create a public post with text and a link.
    - As User2:
        - Share User1's post.
    - As User1:
        - Edit the shared post, change the text and the link, and save the edit.
    - As User2:
        - View the share.
            - **Confirm the share updated appropriately.**

#### Post Edit Drafts

- [ ] As a user, my edit draft of a post with an image is saved across reloads.
    - As User1:
        - Edit a post with an image - change text and image.
        - Navigate away from the home feed and back to feed.
            - **Confirm draft remains.**
        - Close the Communities browser window. Reopen and reload.
            - **Confirm draft remains.**
        - Post the draft.
            - **Confirm draft posts correctly.**

- [ ] As a user, my edit draft of a post with an image is cleared when I log out.
    - As User1:
        - Edit a post with an image - change text and image.
        - Log out. Log back in.
            - **Confirm draft is gone.**

- [ ] As a user, my edit draft of a post with a link is saved across reloads.
    - As User1:
        - Edit a post with a link - change text and link.
        - Navigate away from the home feed and back to feed.
            - **Confirm draft remains.**
        - Close the Communities browser window. Reopen and reload.
            - **Confirm draft remains.**
        - Post the draft.
            - **Confirm draft posts correctly.**

- [ ] As a user, my edit draft of a post with a link is cleared when I log out.
    - As User1:
        - Edit a post with a link - change text and link.
        - Log out. Log back in.
            - **Confirm draft is gone.**

### Full Regression

#### Permissions

- [ ] As an unauthenticated visitor, I cannot update a post. (covered: integration)
    - As unauthenticated user:
        - Attempt to update any post.
            - **Confirm the request is refused.**

- [ ] As a user, updating a post that doesn't exist is not found. (covered: integration)
    - As User1:
        - Attempt to update a post id that does not exist.
            - **Confirm a not found result.**

- [ ] An author **can** update their own PUBLIC feed post. (covered: integration)
- [ ] An author **can** update their own PRIVATE feed post. (covered: integration)
- [ ] A stranger **cannot** update another user's PUBLIC feed post. (covered: integration)
- [ ] A stranger **cannot** update another user's PRIVATE feed post. (covered: integration)
- [ ] A confirmed friend **cannot** update another user's PRIVATE feed post. (covered: integration)
- [ ] A blocked user **cannot** update another user's PUBLIC feed post. (covered: integration)
- [ ] A site moderator **cannot** update another user's PRIVATE feed post. (covered: integration)

#### Immutable and server-only fields

- [ ] As a user, I cannot change immutable fields on my post. (covered: integration)
    - As User1:
        - Attempt to change the `userId` of your post.
            - **Confirm the request is refused.**
        - Attempt to change the `type` of your post.
            - **Confirm the request is refused.**
        - Attempt to set a `groupId` on a feed post.
            - **Confirm the request is refused.**
        - Attempt to change the `sharedPostId`.
            - **Confirm the request is refused.**

- [ ] As a user, I cannot set server-managed fields on my post. (covered: integration)
    - As User1:
        - Attempt to set `siteModerationId`.
            - **Confirm the request is refused.**
        - Attempt to set `groupModerationId`.
            - **Confirm the request is refused.**
        - Attempt to set `activity`.
            - **Confirm the request is refused.**
        - Attempt to set `createdDate`.
            - **Confirm the request is refused.**
        - Attempt to set `updatedDate`.
            - **Confirm the request is refused.**

#### Mutable field validation

- [ ] As a user, invalid content or visibility is rejected on update. (covered: integration)
    - As User1:
        - Attempt to update your post with null content.
            - **Confirm the request is refused.**
        - Attempt to update your post with content that is too long.
            - **Confirm the request is refused.**
        - Attempt to update your post with null visibility.
            - **Confirm the request is refused.**
        - Attempt to update your post with an invalid visibility.
            - **Confirm the request is refused.**

#### Valid updates

- [ ] As a user, I can update the content and visibility of my own feed post. (covered: integration)
    - As User1:
        - Update the content of your own feed post.
            - **Confirm the content is updated.**
        - Update the visibility of your own feed post.
            - **Confirm the visibility is updated.**
