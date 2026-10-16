## [Create PostComment](documentation/testing/test-cases/PostComment/create.md)

Cases covering making comments on posts.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created and has created a public post.
- [ ] User2 has been created.

#### Cases

- [ ] As a user, I can comment on a post I can see.
    - As User2:
        - Comment "First." on User1's post.
            - **Confirm comment appears on User1's post.**

- [ ] As a user, comments appear in the order they are made.
    - As User1:
        - Comment "Second." on User1's post.
            - **Confirm comment appears on User1's post.**
    - As User2:
        - Comment "Third." on User1's post after User1.
            - **Confirm comment appears on User1's post.**
            - **Confirm comments appear in the correct order: User2 "First.", User1 "Second.", User2 "Third."**

### Manual Regression

#### Pre-requisites

- [ ] User1 has been created and has created a public post.
- [ ] User2 has been created and has friends who can be mentioned.

#### Mentions

- [ ] As a user, I can mention other users in comments.
    - As User2:
        - Comment on User1's post and begin a mention by typing '@' and the beginning of User1's name.
            - **Confirm mention suggestions menu is limited to User2's friends and User1.**
            - **Confirm list is filtered by User1's name.**
        - Continue typing User1's name.
            - **Confirm the list continues to be filtered.**
        - Use the down arrow key to walk down the list.
            - **Confirm the selection moves down.**
        - Use the up arrow key to walk up the list.
            - **Confirm the selection moves up.**
        - Select User1 and hit the "Enter" key.
            - **Confirm mention completes with User1's username.**
        - Post the comment.
    - As User1:
        - **Confirm mention notification received.**
        - Click on the notification.
            - **Confirm comment highlighted.**

- [ ] As a user, I'm notified of mentions and subscribed comments even when someone else involved has blocked the commenter.
    - Users who can't see a comment (because they've blocked, or been blocked by, its author) are skipped, and the users after them must still be notified.  Doing these steps in order makes it likely User3 is checked first.
    - As User3:
        - Comment on User1's post, which subscribes User3 to it.
    - As User4:
        - Comment on User1's post, which subscribes User4 to it.
    - As User3:
        - Block User2.
    - As User2:
        - Comment "@User3 @User1 Hello." on User1's post, using User3's and User1's usernames.
    - As User1:
        - **Confirm mention notification received.**
    - As User3:
        - **Confirm no notification received.**
    - As User4:
        - **Confirm comment notification received for User2's comment.**

#### Replies

- [ ] As a user, I can reply to another user's comment.
    - As User1:
        - Comment "Reply to me." on User1's post.
    - As User2:
        - Comment "Me first." on User1's post.
            - **Confirm a "Reply" link appears in the bottom left corner of User1's comment.**
            - **Confirm no "Reply" link appears on User2's own comment.**
        - Click "Reply" on User1's comment.
            - **Confirm a new comment form opens at the end of the comment thread.**
            - **Confirm it starts with a mention of User1's username followed by a space.**
            - **Confirm the cursor is placed after the mention.**
        - Finish the reply with "Replying." and post it.
            - **Confirm the comment appears at the end of the thread, with a mention of User1 followed by "Replying."**
    - As User1:
        - **Confirm mention notification received.**

- [ ] As a user, replying doesn't discard a comment I'm already writing.
    - As User2:
        - Start a comment and write "Draft in progress." without posting it.
        - Click "Reply" on User1's comment.
            - **Confirm the draft becomes "Draft in progress. " followed by a mention of User1.**
        - Click "Reply" on User1's comment again.
            - **Confirm User1 is not mentioned a second time.**
            - **Confirm a "You're already replying." warning appears for a few seconds, then disappears.**
        - Click "Reply" on User1's comment again, twice in quick succession.
            - **Confirm only one warning is shown, and it disappears a few seconds after the last click.**
        - Cancel the draft.

- [ ] As a user, replying in a long thread brings the comment form into view.
    - As User2, on a post with enough comments that the thread is taller than the screen:
        - Scroll to the top of the thread and click "Reply" on one of the first comments.
            - **Confirm the page scrolls so the comment form, including its buttons, is visible and focused.**
    - Repeat on iOS and Android.
        - **Confirm the keyboard opens with the comment form visible above it.**

- [ ] As a user, the "Reply" link only appears where I can reply.
    - As User2:
        - Flag User1's comment.
    - As an Administrator:
        - Open the Site moderation queue.
            - **Confirm no "Reply" link appears on User1's comment in the queue.**
        - Click "View Context" on User1's comment.
            - **Confirm the "Reply" link appears on User1's comment in the post's comment thread.**
        - Remove User1's comment.
    - As User2:
        - View User1's post.
            - **Confirm no "Reply" link appears on the removed comment.**

#### Drafts

- [ ] As a user, my comment drafts are saved as long as I am logged in.
    - As User2:
        - Write a comment draft.
        - Navigate away from the home feed and back to feed.
            - **Confirm draft remains.**
        - Close the Communities browser window. Reopen and reload.
            - **Confirm draft remains.**
        - Post the draft.
            - **Confirm comment posts correctly.**

- [ ] As a user, my comment drafts keep being saved after I've posted a comment.
    - As User2:
        - Post a comment on User1's post.
        - Without reloading, start another comment on the same post and write a draft.
        - Reload the page.
            - **Confirm the second draft remains.**
        - Post the draft.
            - **Confirm comment posts correctly and the draft is gone.**

- [ ] As a user, my comment drafts keep being saved after a comment fails to post.
    - As User2:
        - Write a comment draft.
        - Turn off your network connection and try to post the draft.
            - **Confirm an error is shown and the draft remains in the form.**
        - Edit the draft.
        - Turn your network connection back on and reload the page.
            - **Confirm the edited draft remains.**

- [ ] As a user, my comment drafts are deleted when I log out.
    - As User2:
        - Write a comment draft.
        - Log out.
        - Log back in.
            - **Confirm draft is gone.**

- [ ] As a user, I can cancel a comment draft, which deletes it.
    - As User2:
        - Write a comment draft.
        - Cancel the draft.
            - **Confirm draft is gone.**
        - Reload the page.
            - **Confirm draft is still gone.**
        - Navigate away and back.
            - **Confirm draft is still gone.**

### Full Regression

#### Pre-requisites

None.

The post comment endpoints are not yet covered by the Integration suite.  All
comment creation cases are defined in the Smoke Test and Manual Regression
sections above.
