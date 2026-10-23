## [Read CommentReaction](documentation/testing/test-cases/CommentReaction/read.md)

Cases covering who can see likes on PostComments.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least one public post with a comment.
- [ ] User3 has been created.
- [ ] User1 and User3 have both liked the comment on User2's post.

#### Cases

- [ ] As a user, I can't see likes from users I've blocked.
    - As User2:
        - Block User3.
        - View the comment on User2's post.
            - **Confirm the like count is 1.**
        - Click on the like count.
            - **Confirm only User1 is listed as liking the comment.**
        - Unblock User3.

### Manual Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least one public post with a comment.
- [ ] User3 has been created.
- [ ] User4 has been created.
- [ ] User1 and User3 have both liked the comment on User2's post.
- [ ] A site moderator has been created.
- [ ] User2 has created an open group, with a post that has a comment by User4
      that User1 has liked.

#### Cases

- [ ] As a user, I can't see likes from users who have blocked me.
    - As User3:
        - Block User4.
    - As User4:
        - View the comment on User2's post.
            - **Confirm the like count is 1.**
        - Click on the like count.
            - **Confirm only User1 is listed as liking the comment.**

- [ ] As a user, blocks between other users don't hide likes from me.
    - As User1:
        - View the comment on User2's post.
            - **Confirm the like count is 2.**
    - As User3:
        - Unblock User4.

#### Moderation and admin views

Likes aren't shown on comments in the moderation queues or the admin user
view.  They can be seen through "View Context".

- [ ] As a site moderator, I don't see likes on flagged comments.
    - As User4:
        - Flag the comment on User2's public post for the site moderators.
    - As the site moderator:
        - Go to Admin > Moderation.
            - **Confirm the flagged comment is shown without a like count or thumbs up.**
        - Click "View Context".
            - **Confirm the comment's like count and thumbs up are shown.**

- [ ] As a site moderator, I don't see likes on a user's comments in the admin.
    - As the site moderator:
        - Go to Admin > Users, open the author of the comment on User2's public post, and click "Comments".
            - **Confirm the comment is shown without a like count or thumbs up.**

- [ ] As a group moderator, I don't see likes on comments flagged to the group.
    - As User3:
        - Join User2's group, and flag User4's comment on the group's post for the group's moderators.
    - As User2:
        - Go to the group's Moderation tab.
            - **Confirm the flagged comment is shown without a like count or thumbs up.**
        - Click "View Context".
            - **Confirm the comment's like count and thumbs up are shown.**

### Full Regression

#### Pre-requisites

None.

The Integration suite covers which likes are sent with comments, on both
`GET /post/:id` and `GET /post/:postId/comments`
(`web-application/test/integration/suites/CommentReactionController/relations.spec.js`),
including blocks in either direction.  All of the user interface cases are
defined in the Smoke Test and Manual Regression sections above.
