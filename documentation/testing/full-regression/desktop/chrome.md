# Full Regression

For each heading, copy the `Cases` section of the linked file under the heading and execute the test cases within.

## [User Registration](documentation/testing/test-cases/User/create/registration.md)
## [User Invitation](documentation/testing/test-cases/User/create/invitation.md)
## [User Searching](documentation/testing/test-cases/User/query.md)

## [Friend Requests](documentation/testing/test-cases/UserRelationship/create-update-delete.md)

## [Authentication](documentation/testing/test-cases/Authentication/authentication.md)

## [Create Post](documentation/testing/test-cases/Post/create.md)
## [Update Post](documentation/testing/test-cases/Post/update.md)
## [Delete Post](documentation/testing/test-cases/Post/delete.md)

## [Create PostReaction](documentation/testing/test-cases/PostReaction/create.md)
## [Update PostReaction](documentation/testing/test-cases/PostReaction/update.md)
## [Delete PostReaction](documentation/testing/test-cases/PostReaction/delete.md)

## [Read PostComment](documentation/testing/test-cases/PostComment/read.md)
## [Create PostComment](documentation/testing/test-cases/PostComment/create.md)
## [Update PostComment](documentation/testing/test-cases/PostComment/delete.md)
## [Delete PostComment](documentation/testing/test-cases/PostComment/update.md)

## [Create PostSubscription](documentation/testing/test-cases/PostSubscription/create.md)
## [Delete PostSubscription](documentation/testing/test-cases/PostSubscription/delete.md)
 
### Profile Editing

- [ ] As Jane Doe, upload a profile image and submit form.
- [ ] As Jane Doe, remove profile image and submit form.
- [ ] As Jane Doe, edit name and bio and submit form.
- [ ] As Jane Doe, edit name and bio and don't submit form.
- [ ] As Jane Doe, change email.  Confirm email.
- [ ] As user2, change password. Log out and log back in with new password.

### Settings 

- [ ] As Jane Doe, turn off Post Comments.
    - [ ] As John Doe, comment on a Jane Doe post. Confirm no emails.
- [ ] As Jane Doe, turn off friend requests.

### Admin Moderation

- [ ] As John Doe, unfriend Admin.
- [ ] As Jane Doe, unfriend Admin.

- [ ] As John Doe, flag one of Jane Doe's posts.
    - [ ] As Admin, confirm the flagged post shows up on the Admin Moderation queue.
    - [ ] As Admin, approve the flagged post.
    - [ ] As John Doe, confirm the flagged post remains visible in the feed and can no longer be flagged.
- [ ] As John Doe, flag one of Jane Doe's comments.
    - [ ] As Admin, confirm the flagged comment shows up on the Admin Moderation queue.
    - [ ] As Admin, approve the flagged comment.
    - [ ] As John Doe, confirm the flagged comment remains visible in the feed and can no longer be flagged.
- [ ] As Jane Doe, flag one of John Doe's posts.
    - [ ] As Admin, confirm the flagged post shows up on the Admin Moderation queue.
    - [ ] As Admin, reject the flagged post with a reason.
    - [ ] As Jane Doe, confirm the rejected post shows the moderation message and reason.
- [ ] As Jane Doe, flag one of John Doe's comments.
    - [ ] As Admin, confirm the flagged comment shows up on the Admin Moderation queue.
    - [ ] As Admin, reject the flagged comment with a reason.
    - [ ] As Jane Doe, confirm the rejected comment shows the moderation message and reason.

### Groups

#### Test 'open' Groups

- [ ] As John Doe, create an "open" group named "Open Test Group"
    - [ ] As John Doe, create a post in "Open Test Group".

- [ ] As Jane Doe, attempt to view "Open Test Group", confirm posts and members are visible.
    - [ ] As Jane Doe, attempt to view a specific post in "Open Test Group" by loading the direct link.  Confirm visible.

- [ ] As John Doe, invite Jane Doe to "Open Test Group"
    - [ ] As Jane Doe, reject the invite.
    - [ ] As John Doe, invite Jane Doe to "Open Test Group"
    - [ ] As Jane Doe, accept the invite and join the group.
    - [ ] As Jane Doe, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As Jane Doe, post in the group.
    - [ ] As Jane Doe, comment on John Doe's post in the group.

- [ ] As John Doe, promote Jane Doe to "moderator".

- [ ] As Jane Doe, invite James Smith to "Open Test Group"
    - [ ] As James Smith, accept the email invite.
    - [ ] As James Smith, accept the group invite.
    - [ ] As James Smith, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As James Smith, post in the group.
    - [ ] As James Smith, leave the group.
        - [ ] Confirm James Smith's, post remains.
        - [ ] As Jane Doe, comment on James Smith's post.  Confirm James Smith still subscribed and notified.

- [ ] As John Doe, invite Maria Rodriguez to "Open Test Group" using an email
    - [ ] As Maria Rodriguez, accept the email invite.
    - [ ] As Maria Rodriguez, accept the group invite.
    - [ ] As Maria Rodriguez, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As Maria Rodriguez, make a post.
    - [ ] As John Doe, remove Maria Rodriguez from the group.
        - [ ] Confirm Maria Rodriguez's post remains.
        - [ ] As John Doe, comment on Maria Rodriguez's post.  Confirm Maria Rodriguez still subscribed and notified.
    - [ ] As Maria Rodriguez, delete account.

- [ ] As John Doe, flag Jane Doe's post in the group for Admin.
    - [ ] As Admin, confirm flagged post shows up in Admin Moderation queue.
    - [ ] As Admin, reject the flagged post with a reason.
    - [ ] As John Doe, confirm the rejected post shows the moderation message and reason.
- [ ] As John Doe, flag Jane Doe's comment on a post in the group.
    - [ ] As Admin, confirm the flagged comment shows up in the Admin Moderation Queue.
    - [ ] As Admin, reject the flagged comment.
    - [ ] As John Doe, confirm the rejected comment shows the moderation message and reason.

- [ ] As John Doe, promote Jane Doe to group "admin"

- [ ] As John Doe, modify the group's profile in Settings.
- [ ] As Jane Doe, modify the group's profile in Settings.
- [ ] As John Doe, delete the group.
    - [ ] Confirm all posts deleted.

#### Test 'private' Groups

- [ ] As John Doe, create a "private" group named "Private Test Group"
    - [ ] As John Doe, create a post in "Private Test Group".

- [ ] As Jane Doe, attempt to view "Private Test Group", confirm posts and members are *not* visible.
    - [ ] As Jane Doe, attempt to view a specific post in "Private Test Group" by loading the direct link.  Confirm 404.

- [ ] As John Doe, invite Jane Doe to "Private Test Group"
    - [ ] As Jane Doe, reject the invite.
    - [ ] As John Doe, invite Jane Doe to "Private Test Group".
    - [ ] As Jane Doe, accept the invite and join the group.
    - [ ] As Jane Doe, confirm posts and members are now visible.
        - [ ] As Jane Doe, attempt to view a specific post in "Private Test Group" by loading the direct link, confirm visible.
        - [ ] As Jane Doe, comment on the viewed post.
        - [ ] As Jane Doe, post in the group.

- As John Doe, promote Jane Doe to "moderator".

- [ ] As Jane Doe, invite James Smith to "Private Test Group"
    - [ ] As James Smith, accept the email invite.
    - [ ] As James Smith, accept the group invite.
    - [ ] As James Smith, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As James Smith, post in the group.
    - [ ] As James Smith, leave the group.
        - [ ] As James Smith, confirm post no longer visible.
        - [ ] As Jane Doe, confirm James Smith's, post remains.
        - [ ] As Jane Doe, comment on James Smith's post.  Confirm James Smith is *not* still subscribed and *not* notified.

- [ ] As John Doe, invite Maria Rodriguez to "Private Test Group" using an email
    - [ ] As Maria Rodriguez, accept the email invite.
    - [ ] As Maria Rodriguez, accept the group invite.
    - [ ] As Maria Rodriguez, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As Maria Rodriguez, make a post.
    - [ ] As John Doe, remove Maria Rodriguez from the group.
        - [ ] As John Doe, confirm Maria Rodriguez's post remains.
        - [ ] As John Doe, comment on Maria Rodriguez's post.  Confirm Maria Rodriguez is *not* still subscribed and is *not* notified.
        - [ ] As Maria Rodriguez, confirm Maria Rodriguez's post is no longer visible.
    - [ ] As Maria Rodriguez, delete account.

- [ ] As John Doe, flag Jane Doe's post in the group for Admin.
    - [ ] As Admin, confirm flagged post shows up in Admin Moderation queue.
    - [ ] As Admin, reject the flagged post with a reason.
    - [ ] As John Doe, confirm the rejected post shows the moderation message and reason.
- [ ] As John Doe, flag Jane Doe's comment on a post in the group.
    - [ ] As Admin, confirm the flagged comment shows up in the Admin Moderation Queue.
    - [ ] As Admin, reject the flagged comment.
    - [ ] As John Doe, confirm the rejected comment shows the moderation message and reason.

- [ ] As John Doe, promote Jane Doe to group "admin"

- [ ] As John Doe, modify the group's profile in Settings.
- [ ] As Jane Doe, modify the group's profile in Settings.
- [ ] As John Doe, delete the group.
    - [ ] Confirm all posts deleted.

#### Test 'hidden' Groups

- [ ] As John Doe, create a "hidden" group named "Hidden Test Group"
    - [ ] As John Doe, create a post in "Hidden Test Group".

- [ ] As Jane Doe, attempt to view "Hidden Test Group", confirm 404.
    - [ ] As user2, attempt to view a specific post in "Hidden Test Group" by loading the direct link, confirm 404.

- [ ] As John Doe, invite Jane Doe to "Hidden Test Group"
    - [ ] As Jane Doe, confirm "Hidden Test Group" is visible.
    - [ ] As Jane Doe, reject the invite.
    - [ ] As Jane Doe, confirm group is no longer visible.
    - [ ] As John Doe, invite Jane Doe to "Hidden Test Group".
    - [ ] As Jane Doe, accept the invite and join the group.
    - [ ] As Jane Doe, confirm posts and members are now visible.
        - [ ] As Jane Doe, attempt to view a specific post in "Hidden Test Group" by loading the direct link, confirm visible.
        - [ ] As Jane Doe, comment on the viewed post.
        - [ ] As Jane Doe, post in the group.

- [ ] As Jane Doe, invite James Smith to "Hidden Test Group" using an email
    - [ ] As James Smith, accept the email invite.
    - [ ] As James Smith, confirm group is visible.
    - [ ] As James Smith, accept the group invite.
    - [ ] As James Smith, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As James Smith, post in the group.
    - [ ] As James Smith, leave the group.
        - [ ] As James Smith, confirm group is no longer visible.
        - [ ] As James Smith, confirm post is no longer visible.
        - [ ] As Jane Doe, confirm James Smith's, post remains.
        - [ ] As Jane Doe, comment on James Smith's post.  Confirm James Smith is *not* still subscribed and *not* notified.

- [ ] As John Doe, invite Maria Rodriguez to "Hidden Test Group" using an email
    - [ ] As Maria Rodriguez, accept the email invite.
    - [ ] As Maria Rodriguez, confirm the group is visible.
    - [ ] As Maria Rodriguez, accept the group invite.
    - [ ] As Maria Rodriguez, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [ ] As Maria Rodriguez, make a post.
    - [ ] As John Doe, remove Maria Rodriguez from the group.
        - [ ] As John Doe, confirm Maria Rodriguez's post remains.
        - [ ] As John Doe, comment on Maria Rodriguez's post.  Confirm Maria Rodriguez is *not* still subscribed and is *not* notified.
        - [ ] As Maria Rodriguez, confirm Maria Rodriguez's post is no longer visible.
        - [ ] As Maria Rodriguez, confirm the group is no longer visible.
    - [ ] As Maria Rodriguez, delete account.
 
- [ ] As John Doe, flag Jane Doe's post in the group for Admin.
    - [ ] As Admin, confirm flagged post shows up in Admin Moderation queue.
    - [ ] As Admin, reject the flagged post with a reason.
    - [ ] As John Doe, confirm the rejected post shows the moderation message and reason.
- [ ] As John Doe, flag Jane Doe's comment on a post in the group.
    - [ ] As Admin, confirm the flagged comment shows up in the Admin Moderation Queue.
    - [ ] As Admin, reject the flagged comment.
    - [ ] As John Doe, confirm the rejected comment shows the moderation message and reason.

- [ ] As John Doe, promote Jane Doe to group "admin"

- [ ] As John Doe, modify the group's profile in Settings.
- [ ] As Jane Doe, modify the group's profile in Settings.
- [ ] As John Doe, delete the group.
    - [ ] Confirm all posts deleted.

