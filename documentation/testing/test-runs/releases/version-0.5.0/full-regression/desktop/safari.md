# Full Regression

For each heading, copy the `Cases` section of the linked file under the heading and execute the test cases within.

## [User Registration](documentation/testing/test-cases/User/create/registration.md)

- [x] Register a new user named John Doe with username `john-doe` (communities-john-doe@mailinator.com)
    - [x] Attempt to register with too short a password.
        - [x] Confirm validation error.
    - [x] Attempt to register without checking Age Confirmation.
        - [x] Confirm validation error.
    - [x] Successfully register.
        - [x] Confirm email.
        - [x] Accept Terms of Service.
        - [x] Skip Pay What you Can.
    - [x] Turn off all email notifications.

- [x] Register a new user named Jane Doe (communities-jane-doe@mailinator.com)
    - [x] Attempt to register with the username `john-doe`
        - [x] Confirm validation error.
    - [x] Register with the username `jane-doe`
    - [x] Successfully register.
        - [x] Confirm email.
        - [x] Accept Terms of Service.
        - [x] Skip Pay What you Can.
    - [x] Turn off all email notifications.

## [User Invitation](documentation/testing/test-cases/User/create/invitation.md)

- [x] As User1 invite James Smith (communities-james-smith@mailinator.com).
    - [x] As User1, confirm invitation is visible on the "Friend Requests" page.
    - [x] As James Smith, Accept the invite and register James Smith with username `james-smith`
    - [x] Successfully register.
        - [x] Confirm email.
        - [x] Accept Terms of Service.
        - [x] Skip Pay What you Can.
    - [x] Turn off all email notifications.
    - [x] As James Smith, attempt to view User1's profile.  Confirm private post not visible.
    - [x] As James Smith, accept the friend request and view User1's profile page.

- [x] As User2, invite Jenny Smith (communities-jenny-smith@mailiantor.com).
    - [x] As User2, confirm invitation is visible on the "Friend Requests" page.
    - [x] As Jenny Smith, from the same browser session attempt to accept the invite.
        - [x] Expectation: Error.
    - [x] As User1, confirm the invitation is *not* visible on the "Friend Requests" page.
    - [x] From a different browser session accept the invite and register Jenny Smith with username `jenny-smith`.
    - [x] Successfully register.
        - [x] Confirm email.
        - [x] Accept Terms of Service.
        - [x] Skip Pay What you Can.
    - [x] Turn off all email notifications.
    - [x] As Jenny Smith, accept the friend request and view User1's profile page.

## [User Searching](documentation/testing/test-cases/User/query.md)

- [x] As User1, on the Find Friends page, search for User2, confirm list filtered.

## [Friend Requests](documentation/testing/test-cases/UserRelationship/create-update-delete.md)

- [x] Users can send friend requests.
    - [x] As User1, send User2 a friend request.
        - [x] As User1, confirm request shows on "Friend Requests" view.
        - [x] As User2, confirm friend request notification.
        - [x] As User2, confirm request shows on "Friend Requests" view.
        - [x] As User1, confirm "Cancel Request" shows on User2's profile.
        - [x] As User2, confirm "Accept" or "Reject" show on User1's profile.
    - [x] As User1, cancel the request.

- [x] Users can reject friend requests.
    - [x] As User1, send User2 a friend request.
    - [x] As User2, reject the friend request.
    - [x] As User2, confirm friend request is removed from profile.
    - [x] As User2, confirm friend request is removed from "Friend Requests" view.

- [x] Users can remove friends.
    - [x] As User1, send User2 a friend request.
    - [x] As User2, accept the friend request. Confirm request accepted.
    - [x] As User2, remove User1 as a friend. Confirm request removed.

- [x] It doesn't matter which user (requester or accepter) removes the request.
    - [x] As User1, send User2 a friend request.
    - [x] As User2, accept the friend request. Confirm request accepted.
    - [x] As User1, remove User2 as a friend. Confirm request removed.

- [x] Users can cancel friend requests they send.
    - [x] As User1, send User2 a friend request.
    - [x] As User2, confirm friend request visible.
    - [x] As User1, cancel the friend request. Confirm removed.
    - [x] As User2, confirm removed.

- [x] Users can simultaneously remove each other without error.
    - [x] As User1, send User2 a friend request.
    - [x] As User2, accept the request.
    - [x] With two browser windows open, one As User1 and one As User2,
         simultaneously remove each other as friends.

- [x] Users can simultaneously add each other as friends and the request will
     be auto-approved.
    - [x] With two browser windows open, one As User2 and one As User1, have User1
         and User2 send each other simultaneous friend requests.  Confirm relationship
         confirmed.

## [Authentication](documentation/testing/test-cases/Authentication/authentication.md)

- [x] As User1, log out.
- [x] As User1, attempt to log in with the wrong password. Confirm login fails.
- [x] As User1, log in with the right password.  Confirm login succeeds.

- [x] As User2, attempt to login with the wrong password.  Confirm login fails.
- [x] As User2, attempt to login with the right password. Confirm login succeeds.

### Reset Password

- [x] As User2, log out and request a password reset. Change User2's password.
- [x] As User2, log out and attempt to login with old password.  Confirm login fails.
- [x] As User2, attempt to login with new password.  Confirm login succeeds.

### Authentication Lockout 

- [x] As User3, attempt to log in with the wrong password 10 times.
    - [x] Confirm authentication timeout.
    - [ ] Wait 15 minutes.
    - [ ] Attempt to log in with the wrong password once.  Confirm login fails.
    - [ ] Attempt to log in with the correct password.  Confirm log in succeeds.

## [Create Post](documentation/testing/test-cases/Post/create.md)

### Private Posts

- [x] As User1, make a private post with just text.
- [x] As User1, make a private post with just an image.
- [x] As User1, make a private post with just a link.
- [x] As User1, make a private post with text and an image.
- [x] As User1, make a private post with text and a link.

### Public Posts

- [x] As User1, make a public post with just text.
- [x] As User1, make a public post with just an image.
- [x] As User1, make a public post with just a link.
- [x] As User1, make a public post with text and an image.
- [x] As User1, make a public post with text and a link.

- [x] As User1, make a post mentioning User2.
    - [x] As User2, confirm notification.

### Post Drafts

- [x] As User1, write a post draft with an image.
    - [x] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [x] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [x] Post the draft. Confirm draft posts correctly.

- [x] As User1, write a post draft with an image.
    - [x] Log out. Log back in. Confirm draft is gone.

- [x] As User1, write a post draft with a link.
    - [x] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [x] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [x] Post the draft.  Confirm draft posts correctly. 

- [x] As User1, write a post draft with a link.
    - [x] Log out. Log back in. Confirm draft is gone.

### Youtube Videos

- [x] As User1, create a post with a youtube video for a link, using the full link (`/watch?vid=`)
    - [x] Confirm embed loads.
    - [x] Post the post.  Confirm the embed will play.
- [x] As User1, create a post with a youtube video for a link using the shorted link (`youtu.be`)
    - [x] Confirm the embed loads.
    - [x] Post the post. Confirm the embed will play.

## [Update Post](documentation/testing/test-cases/Post/update.md)

### Post Editing

- [x] As User1, create a post with text and an image.
    - [x] Edit the post and change the text.  Save the edit.  Confirm post updated appropriately.
    - [x] Edit the post and change the image.  Save the edit and confirm the post updated appropriately.
    - [x] Edit the post and change the text. Cancel the edit and confirm the post was not updated.
    - [x] Edit the post and change the image.  Cancel the edit and confirm the post was not updated.

- [x] As User1, create a post with text an a link.
    - [x] Edit the post and change the text.  Save the edit.  Confirm post updated appropriately.
    - [x] Edit the post and change the link.  Save the edit and confirm the post updated appropriately.
    - [x] Edit the post and change the text. Cancel the edit and confirm the post was not updated.
    - [x] Edit the post and change the link.  Cancel the edit and confirm the post was not updated.

- [x] As User1, create a public post with text and a link.
    - [x] As User2, share User1's post.
    - [x] As User1, edit the shared post and change the text and the link.  Save the edit.
    - [x] As User2, confirm the share updated appropriately.

### Post Edit Drafts

- [x] As User1, edit post with an image - change text and image.
    - [x] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [x] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [x] Post the draft. Confirm draft posts correctly.

- [x] As User1, edit a post with an image - change text and image.
    - [x] Log out. Log back in. Confirm draft is gone.

- [x] As User1, edit a post with a link - change text and link.
    - [x] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [x] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [x] Post the draft.  Confirm draft posts correctly. 

- [x] As User1, edit a post with a link - change text and link.
    - [x] Log out. Log back in. Confirm draft is gone.

## [Delete Post](documentation/testing/test-cases/Post/delete.md)

- [x] As User1, create a private post with text and an image.
    - [x] As User1, delete the post.
    - [x] As User1, attempt to view the post. Confirm its gone.
    - [x] As User2, attempt to view the post. Confirm its gone.

- [x] As User1, create a private post with text and a link.
    - [x] As User1, delete the post.
    - [x] As User1, attempt to view the post. Confirm its gone.
    - [x] As User2, attempt to view the post. Confirm its gone.

- [x] As User1, create a public post with text and a link.
    - [x] As User2, share the post.
    - [x] As User1, delete the post.
    - [x] As User1, attempt to view the post.  Confirm its gone.
    - [x] As User2, view the share. Confirm original post is gone but share remains.

## [Create PostReaction](documentation/testing/test-cases/PostReaction/create.md)

- [x] As User1, like one of User2's Posts.
    - [x] Confirm like highlighted and "likes" is incremented by 1.
    - [x] Confirm clicking on the reactions shows User1 as liking.
    - [x] Confirm post increases rank when feed is sorted by "Most Activity"
    
- [x] As User1, dislike a second one of User2's Posts.
    - [x] Confirm dislike highlighted and "dislikes" is incremented by 1.
    - [x] Confirm clicking on the reactions shows User1 as disliking.
    - [x] Confirm post increases rank when feed is sorted by "Most Activity"
    
- [x] As User1, demote a third one of User2's Posts.
    - [x] Confirm "Are You Sure" modal shows.
    - [x] Select "Yes".
    - [x] Confirm demote is highlighted and "demotes" is incremented by 1.
    - [x] Confirm clicking on reactions show User1 as demoting.
    - [x] Confirm post decreases rank when feed is sorted by "Most Activity".

## [Update PostReaction](documentation/testing/test-cases/PostReaction/update.md)

- [x] As User1, dislike the User2 Post previously liked. 
    - [x] Confirm dislike highlighted and like not highlighted.
    - [x] Confirm "dislikes" is incremented by 1 and "likes" is decremented by 1.
    - [x] Confirm clicking on the reactions shows User1 as disliking.
    - [x] Confirm post rank when feed is sorted by "Most Activity" stays the same

- [x] As User1, demote the User2 Post previously disliked
    - [x] Confirm "Are You Sure" modal is shown.
    - [x] Select "yes".
    - [x] Confirm demote highlighted and dislike not highlighted.
    - [x] Confirm demotes is incremented by 1 and dislikes is decremented by 1.
    - [x] Confirm clicking on the reactions shows User1 as demoting.
    - [x] Confirm post decreases rank when feed is sorted by "Most Activity"

- [x] As User1, like the User2 Post previously demoted 
    - [x] Confirm like is highlighted and demote is not highlighted
    - [x] Confirm likes is incremented by 1 and demotes is decremented by 1.
    - [x] Confirm clicking on reactions show User1 as liking.
    - [x] Confirm post increases rank when feed is sorted by "Most Activity".

## [Delete PostReaction](documentation/testing/test-cases/PostReaction/delete.md)

- [x] As User1, unlike one of User2's Posts.
    - [x] Confirm like unhighlighted and "likes" is decremented by 1.
    - [x] Confirm clicking on the reactions doesn't show User1 as liking.
    - [x] Confirm post decreases rank when feed is sorted by "Most Activity"

- [x] As User1, remove a dislike from a second one of User2's Posts.
    - [x] Confirm dislike is not highlighted and "dislikes" is decremented by 1.
    - [x] Confirm clicking on the reactions does not show User1 as disliking.
    - [x] Confirm post decreases rank when feed is sorted by "Most Activity"

- [x] As User1, remove a demote from a third one of User2's Posts.
    - [x] Confirm demote is not highlighted and "demotes" is decremented by 1.
    - [x] Confirm clicking on reactions does not show User1 as demoting.
    - [x] Confirm post increaess rank when feed is sorted by "Most Activity".


## [Create PostComment](documentation/testing/test-cases/PostComment/create.md)

- [x] As User2 comment "First." on User1's post.
    - [x] Confirm comment appears on User1's post.

- [x] As User1 comment "Second." on User1's post.
    - [x] Confirm comment appears on User1's post.

- [x] As User2 comment "Third." on User1's post after User1.
    - [x] Confirm comment appears on User1's post.
    - [x] Confirm comments appear in correct order:
        - User2: "First." 
        - User1: "Second." 
        - User2: "Third." 

### Mentions

- [x] As User2 comment on User1's post and begin a mention by typing '@' and the beginning of User1's name.
    - [x] Confirm mention suggestions menu is limited to User2's friends and User1.
    - [x] Confirm list is filtered by User1's name. Continue typing it and confirm it continues to be filtered.
    - [x] Use the down arrow key to walk down the list.
    - [x] Use the up arrow key to walk up the list.
    - [x] Select User1 and hit the "Enter" key. Confirm mention completes with User1's username.
    - [x] Post comment.
    - [x] As User1, confirm mention notification received.
    - [x] As User1, click on the notification.  Confirm comment highlighted.

### Drafts

- [x] As User2, write a comment draft.
    - [x] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [x] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [x] Post the draft. Confirm comment posts correctly.

- [x] As User2, write a comment draft.
    - [x] Log out. Log back in. Confirm draft is gone.

- [x] As User2, write a comment draft.
    - [x] Cancel the draft.
    - [x] Confirm draft is gone.
    - [x] Reload the page.  Confirm draft is still gone.
    - [x] Navigate away and back. Confirm draft is still gone.

## [Read PostComment](documentation/testing/test-cases/PostComment/read.md)

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.

### Cases

- [x] As User1, create a public post.
    - [x] As User2, comment on User1's post.
    - [x] As User3, attempt to view User2's comment by direct link.  Confirm visible.

- [x] As User1, create a private post.
    - [x] As User2, comment on User1's post.
    - [x] As User3, attempt to view User2's comment by direct link.  Confirm not visible.

- [x] As User1, create public post.
    - [x] As User3, comment on User1's post.
    - [x] As User1, change visibility to private.
    - [x] As User2, comment on User1's post.
    - [x] As User3, confirm no comment notification is recieved.
    - [x] As User3, attempt to view User2's comment by direct link.  Confirm not visible.

#### Mentions

- [x] As User1 create a public post.
    - [x] As User2, comment on User1's post and mention User3.
    - [x] As User3, confirm mention notification. Click through notification and confirm comment is visible.

- [x] As User1 create a private post.
    - [x] As User2, comment on User1's post and mention User3.
    - [x] As User3, confirm no mention notification.
    - [x] As User3, attempt to visit direct link for comment. confirm not visible.

## [Update PostComment](documentation/testing/test-cases/PostComment/delete.md)

### Pre-requisites

- [x] User1 has been created.
- [x] User2 has been created and is friends with User1.
- [x] User3 has been created and is friends with User2.
- [x] User1 has created a public post.

### Cases

- [x] As User2, comment on User1's post.
    - [x] As User2, edit comment.
    - [x] As User2, write edit text.
    - [x] As User2, post the edit. Confirm comment shows the edit.

- [x] As User2, comment on User1's post.
    - [x] As User2, edit the comment.  Write some edit text.
    - [x] As User2, cancel the edit.  Confirm comment shows original text.

#### Mentions

- [x] As User2, comment on User1's post and mention User3.
    - [x] As User3, confirm mention notification.
    - [x] As User2, edit the comment.  Confirm User3 is not notified again.


- [x] As User2, comment on User1's post. NOTE: This case covers a current bug.
    - [x] As User2, edit the comment and add a mention of User3.
    - [x] As User3, confirm notification.

#### Drafts

- [x] As User2, comment on User1's post.
    - [x] As User2, edit the comment.  Write some new text.
    - [x] Reload the browser, confirm new text remains.
    - [x] Navigate away from the page and back, confirm new text remains.
    - [x] As User1, view the comment.  Confirm new text is absent.
    - [x] As User2, post the comment.  Confirm edit shows up properly.

- [x] As User2, comment on User1's post.
    - [x] As User2, edit the comment.  Write some new text.
    - [x] As User2, log out and log back in.  Confirm text is gone.

- [x] As User2, comment on User1's post.
    - [x] As User2, edit the comment. Write some new text.
    - [x] As User2, reload the browser.  Confirm text remains.
    - [x] As User2, cancel the edit.  Confirm previous text is restored.

## [Delete PostComment](documentation/testing/test-cases/PostComment/update.md)

### Pre-requisites

- [x] User1 has been created.
- [x] User2 has been created.
- [x] User1 has created a public post.

### Cases

- [x] As User2, comment on User1's post.
    - [x] As User2, delete the comment.
    - [x] Confirm the comment is removed.

- [x] As User2, comment on User1's post.
    - [x] As User1, check the dots menu for User2's comment.
        - [x] Confirm "delete" is not shown.

- [x] As User2, comment on User1's post, mentioning User1.
    - [x] As User2, delete the comment.
    - [x] As User1, click on the mention notification. Confirm is shows the post, but comment is gone.

## [Create PostSubscription](documentation/testing/test-cases/PostSubscription/create.md)

### Pre-requisites

- [x] User1 has been created.
- [x] User2 has been created and is friends with User1.
- [x] User3 has been created and is friends with User2, but not User1.

### Cases

- [x] When a user creates a post they should be subscribed to the post and notified of comments.
    - [x] As User1, create a post.
    - [x] As User1, confirm subscribed.
    - [x] As User2, comment on User1's post.
    - [x] As User1, confirm notified.

- [x] When a user comments on a post, they should be subscribed to the post and notified of comments.
    - [x] As User1, create a post.
    - [x] As User2, comment on User1's post.
    - [x] As User2, confirm subscribed.
    - [x] As User1, comment on User1's post.
    - [x] As User2, confirm notified.

- [x] When a user subscribes to a post, they should be notified of comments.
    - [x] As User1, create a public post.
    - [x] As User3, subscribe to User1's post.
    - [x] As User2, comment on User1's post.
    - [x] As User3, confirm notification.

- [x] When a user loses the ability to view a subscribed post they should no longer be notified of comments.
    - [x] As User1, create a public post.
    - [x] As User3, subscribe to User1's post.
    - [x] As User1, change visibility of post to private.
    - [x] As User2, comment on User1's post.
    - [x] As User3, confirm no notification.

## [Delete PostSubscription](documentation/testing/test-cases/PostSubscription/delete.md)

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is friends with User2, but not User1.

### Cases

- [x] When a user unsubscribes from a post they created, they should no longer be notified of comments. 
    - [x] As User1, create a post.
    - [x] As User1, unsubscribe from post. 
    - [x] As User2, comment on User1's post.
    - [x] As User1, confirm not notified.

- [x] When a user unsubscribes from a post they commented on, they should no longer be notified of comments. 
    - [x] As User1, create a post.
    - [x] As User2, comment on User1's post.
    - [x] As User2, unsubscribe from User1's post. 
    - [x] As User1, comment on User1's post.
    - [x] As User2, confirm not notified.

- [x] When a user unsubscribes from a post they subscribed to, they should not longer be notified of comments. 
    - [x] As User1, create a public post.
    - [x] As User3, subscribe to User1's post.
    - [x] As User2, comment on User1's post.
    - [x] As User3, confirm notification.
    - [x] As User3, unsubscribe from User1's post.
    - [x] As User2 comment on User1's post.
    - [x] As User3, confirm no notification.
 
### Profile Editing

- [x] As Jane Doe, upload a profile image and submit form.
- [x] As Jane Doe, remove profile image and submit form.
- [x] As Jane Doe, edit name and bio and submit form.
- [x] As Jane Doe, edit name and bio and don't submit form.
- [x] As Jane Doe, change email.  Confirm email.
- [x] As user2, change password. Log out and log back in with new password.

### Settings 

- [x] As Jane Doe, turn off Post Comments.
    - [x] As John Doe, comment on a Jane Doe post. Confirm no emails.
- [x] As Jane Doe, turn off friend requests.

### Admin Moderation

- [x] As John Doe, unfriend Admin.
- [x] As Jane Doe, unfriend Admin.

- [x] As John Doe, flag one of Jane Doe's posts.
    - [x] As Admin, confirm the flagged post shows up on the Admin Moderation queue.
    - [x] As Admin, approve the flagged post.
    - [x] As John Doe, confirm the flagged post remains visible in the feed and can no longer be flagged.
- [x] As John Doe, flag one of Jane Doe's comments.
    - [x] As Admin, confirm the flagged comment shows up on the Admin Moderation queue.
    - [x] As Admin, approve the flagged comment.
    - [x] As John Doe, confirm the flagged comment remains visible in the feed and can no longer be flagged.
- [x] As Jane Doe, flag one of John Doe's posts.
    - [x] As Admin, confirm the flagged post shows up on the Admin Moderation queue.
    - [x] As Admin, reject the flagged post with a reason.
    - [x] As Jane Doe, confirm the rejected post shows the moderation message and reason.
- [x] As Jane Doe, flag one of John Doe's comments.
    - [x] As Admin, confirm the flagged comment shows up on the Admin Moderation queue.
    - [x] As Admin, reject the flagged comment with a reason.
    - [x] As Jane Doe, confirm the rejected comment shows the moderation message and reason.

### Groups

#### Test 'open' Groups

- [x] As John Doe, create an "open" group named "Open Test Group"
    - [x] As John Doe, create a post in "Open Test Group".

- [x] As Jane Doe, attempt to view "Open Test Group", confirm posts and members are visible.
    - [x] As Jane Doe, attempt to view a specific post in "Open Test Group" by loading the direct link.  Confirm visible.

- [x] As John Doe, invite Jane Doe to "Open Test Group"
    - [x] As Jane Doe, reject the invite.
    - [x] As John Doe, invite Jane Doe to "Open Test Group"
    - [x] As Jane Doe, accept the invite and join the group.
    - [x] As Jane Doe, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As Jane Doe, post in the group.
    - [x] As Jane Doe, comment on John Doe's post in the group.

- [x] As John Doe, promote Jane Doe to "moderator".

- [x] As Jane Doe, invite James Smith to "Open Test Group"
    - [x] As James Smith, accept the group invite.
    - [x] As James Smith, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As James Smith, post in the group.
    - [x] As James Smith, leave the group.
        - [x] Confirm James Smith's, post remains.
        - [x] As Jane Doe, comment on James Smith's post.  Confirm James Smith still subscribed and notified.

- [x] As John Doe, invite Maria Rodriguez to "Open Test Group" using an email
    - [x] As Maria Rodriguez, accept the email invite.
    - [x] As Maria Rodriguez, accept the group invite.
    - [x] As Maria Rodriguez, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As Maria Rodriguez, make a post.
    - [x] As John Doe, remove Maria Rodriguez from the group.
        - [x] Confirm Maria Rodriguez's post remains.
        - [x] As John Doe, comment on Maria Rodriguez's post.  Confirm Maria Rodriguez still subscribed and notified.
    - [x] As Maria Rodriguez, delete account.

- [x] As John Doe, flag Jane Doe's post in the group for Admin.
    - [x] As Admin, confirm flagged post shows up in Admin Moderation queue.
    - [x] As Admin, reject the flagged post with a reason.
    - [x] As John Doe, confirm the rejected post shows the moderation message and reason.
- [x] As John Doe, flag Jane Doe's comment on a post in the group.
    - [x] As Admin, confirm the flagged comment shows up in the Admin Moderation Queue.
    - [x] As Admin, reject the flagged comment.
    - [x] As John Doe, confirm the rejected comment shows the moderation message and reason.

- [x] As John Doe, promote Jane Doe to group "admin"

- [x] As John Doe, modify the group's profile in Settings.
- [x] As Jane Doe, modify the group's profile in Settings.
- [x] As John Doe, delete the group.
    - [x] Confirm all posts deleted.

#### Test 'private' Groups

- [x] As John Doe, create a "private" group named "Private Test Group"
    - [x] As John Doe, create a post in "Private Test Group".

- [x] As Jane Doe, attempt to view "Private Test Group", confirm posts and members are *not* visible.
    - [x] As Jane Doe, attempt to view a specific post in "Private Test Group" by loading the direct link.  Confirm 404.

- [x] As Jane Doe, request an invite to "Private Test Group"
    - [x] As John Doe, request the invite.
    - [x] As Jane Doe, rquest an invite to "Private Test Group".
    - [x] As John Doe, accept the request and join the group.
    - [x] As Jane Doe, confirm posts and members are now visible.
        - [x] As Jane Doe, attempt to view a specific post in "Private Test Group" by loading the direct link, confirm visible.
        - [x] As Jane Doe, comment on the viewed post.
        - [x] As Jane Doe, post in the group.

- [x] As John Doe, promote Jane Doe to "moderator".

- [x] As Jane Doe, invite James Smith to "Private Test Group"
    - [x] As James Smith, accept the email invite.
    - [x] As James Smith, accept the group invite.
    - [x] As James Smith, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As James Smith, post in the group.
    - [x] As James Smith, leave the group.
        - [x] As James Smith, confirm post no longer visible.
        - [x] As Jane Doe, confirm James Smith's, post remains.
        - [x] As Jane Doe, comment on James Smith's post.  Confirm James Smith is *not* still subscribed and *not* notified.

- [x] As John Doe, invite Maria Rodriguez to "Private Test Group" using an email
    - [x] As Maria Rodriguez, accept the email invite.
    - [x] As Maria Rodriguez, accept the group invite.
    - [x] As Maria Rodriguez, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As Maria Rodriguez, make a post.
    - [x] As John Doe, remove Maria Rodriguez from the group.
        - [x] As John Doe, confirm Maria Rodriguez's post remains.
        - [x] As John Doe, comment on Maria Rodriguez's post.  Confirm Maria Rodriguez is *not* still subscribed and is *not* notified.
        - [x] As Maria Rodriguez, confirm Maria Rodriguez's post is no longer visible.
    - [x] As Maria Rodriguez, delete account.

- [x] As John Doe, flag Jane Doe's post in the group for Admin.
    - [x] As Admin, confirm flagged post shows up in Admin Moderation queue.
    - [x] As Admin, reject the flagged post with a reason.
    - [x] As John Doe, confirm the rejected post shows the moderation message and reason.
- [x] As John Doe, flag Jane Doe's comment on a post in the group.
    - [x] As Admin, confirm the flagged comment shows up in the Admin Moderation Queue.
    - [x] As Admin, reject the flagged comment.
    - [x] As John Doe, confirm the rejected comment shows the moderation message and reason.

- [x] As John Doe, promote Jane Doe to group "admin"

- [x] As John Doe, modify the group's profile in Settings.
- [x] As Jane Doe, modify the group's profile in Settings.
- [x] As John Doe, delete the group.
    - [x] Confirm all posts deleted.

#### Test 'hidden' Groups

- [x] As John Doe, create a "hidden" group named "Hidden Test Group"
    - [x] As John Doe, create a post in "Hidden Test Group".

- [x] As Jane Doe, attempt to view "Hidden Test Group", confirm 404.
    - [x] As user2, attempt to view a specific post in "Hidden Test Group" by loading the direct link, confirm 404.

- [x] As John Doe, invite Jane Doe to "Hidden Test Group"
    - [x] As Jane Doe, confirm "Hidden Test Group" is visible.
    - [x] As Jane Doe, reject the invite.
    - [x] As Jane Doe, confirm group is no longer visible.
    - [x] As John Doe, invite Jane Doe to "Hidden Test Group".
    - [x] As Jane Doe, accept the invite and join the group.
    - [x] As Jane Doe, confirm posts and members are now visible.
        - [x] As Jane Doe, attempt to view a specific post in "Hidden Test Group" by loading the direct link, confirm visible.
        - [x] As Jane Doe, comment on the viewed post.
        - [x] As Jane Doe, post in the group.

- [x] As John Doe, promote Jane Doe to "moderator".

- [x] As Jane Doe, invite James Smith to "Hidden Test Group" 
    - [x] As James Smith, confirm group is visible.
    - [x] As James Smith, accept the group invite.
    - [x] As James Smith, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As James Smith, post in the group.
    - [x] As James Smith, leave the group.
        - [x] As James Smith, confirm group is no longer visible.
        - [x] As James Smith, confirm post is no longer visible.
        - [x] As Jane Doe, confirm James Smith's, post remains.
        - [x] As Jane Doe, comment on James Smith's post.  Confirm James Smith is *not* still subscribed and *not* notified.

- [x] As John Doe, invite Maria Rodriguez to "Hidden Test Group" using an email
    - [x] As Maria Rodriguez, accept the email invite.
    - [x] As Maria Rodriguez, confirm the group is visible.
    - [x] As Maria Rodriguez, accept the group invite.
    - [x] As Maria Rodriguez, attempt to view a specific post by loading the direct link.  Confirm visible.
    - [x] As Maria Rodriguez, make a post.
    - [x] As John Doe, remove Maria Rodriguez from the group.
        - [x] As John Doe, confirm Maria Rodriguez's post remains.
        - [x] As John Doe, comment on Maria Rodriguez's post.  Confirm Maria Rodriguez is *not* still subscribed and is *not* notified.
        - [x] As Maria Rodriguez, confirm Maria Rodriguez's post is no longer visible.
        - [x] As Maria Rodriguez, confirm the group is no longer visible.
    - [x] As Maria Rodriguez, delete account.
 
- [x] As John Doe, flag Jane Doe's post in the group for Admin.
    - [x] As Admin, confirm flagged post shows up in Admin Moderation queue.
    - [x] As Admin, reject the flagged post with a reason.
    - [x] As John Doe, confirm the rejected post shows the moderation message and reason.
- [x] As John Doe, flag Jane Doe's comment on a post in the group.
    - [x] As Admin, confirm the flagged comment shows up in the Admin Moderation Queue.
    - [x] As Admin, reject the flagged comment.
    - [x] As John Doe, confirm the rejected comment shows the moderation message and reason.

- [x] As John Doe, promote Jane Doe to group "admin"

- [x] As John Doe, modify the group's profile in Settings.
- [x] As Jane Doe, modify the group's profile in Settings.
- [x] As John Doe, delete the group.
    - [x] Confirm all posts deleted.

