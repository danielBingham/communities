## [Create PostComment](documentation/testing/test-cases/PostComment/create.md)

Cases covering making comments on posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 has created a public post.

### Smoke Test

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

The post comment endpoints are not yet covered by the Integration suite.  All
comment creation cases are defined in the Smoke Test and Manual Regression
sections above.
