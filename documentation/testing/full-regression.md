# Full Regression Test

## Migrations
- [ ] As Administrator, run any migrations associated with this release.
- [ ] As Administrator, create content associated with those migrations. Confirm content creates.
- [ ] As Administrator, rollback the migrations. Confirm migrations rollback cleanly.
- [ ] As Administrator, run migrations forward again.

## Friend Requests

- [ ] From the administrator (Admin) account invite a new user (communities-test[issue#].user1).
    - [ ] Accept the invite and register (Test[issue#].User1), referred to as User1

- [ ] As User1, invite a new user (communities-test[issue#].user2).
    - [ ] From the same browser session attempt to accept the invite.
        - [ ] Expectation: Error.
    - [ ] From a different browser session accept the invite and register (Test[Issue#].User2), referred to as User2.

- [ ] As User2, send Admin a friend request.
    - [ ] As admin, reject the friend request.  Confirm its removed.


- [ ] As User2, send Admin a friend request.
     - [ ] As Admin, accept the friend request. Confirm request accepted.
     - [ ] As Admin, remove User2 as a friend.

- [ ] As User2, invite a new user (communities-test[isssue#].user3).
    - [ ] From a different browser session accept the invite and register (Test[Issue#].User3), referred to as User3.

- [ ] With two browser windows open, one As Admin and one As User2, have User2
     and Admin send each other simultaneous friend requests.  Confirm relationship
     confirmed.

## Authentication

- [ ] As User1, log out.
- [ ] As User1, attempt to log in with the wrong password. Confirm login fails.
- [ ] As User1, log in with the right password.  Confirm login succeeds.

- [ ] As User2, attempt to login with the wrong password.  Confirm login fails.
- [ ] As User2, attempt to login with the right password. Confirm login succeeds.

- [ ] As User2, log out and request a password reset. Change User2's password.
- [ ] As User2, log out and attempt to login with old password.  Confirm login fails.
- [ ] As User2, attempt to login with new password.  Confirm login succeeds.

## User Searching

- [ ] As User2, on the Find Friends page, search for "Admin", confirm list filtered.

## Posting

- [ ] As User1, make a post with just text.
- [ ] As User1, make a post with just an image.
- [ ] As User1, make a post with just a link.
- [ ] As User1, make a post with text and an image.
- [ ] As User1, make a post with text and a link.

- [ ] As User1, write a post draft with a link.
    - [ ] Navigate away from the home feed and back to feed.  Confirm draft remains. 
    - [ ] Close the Communities browser window. Reopen and reload.  Confirm draft remains.
    - [ ] Log out.  Log back in. Confirm draft is gone.

## Reactions

- [ ] As Admin, Like User2's post.
    - [ ] As Admin, unlike User2's post.
- [ ] As Admin, dislike User2's post.
     - [ ] As Admin, remove dislike of User2's post.
- [ ] As Admin, block User2's post.
    - [ ] As Admin, remove block of User2's post.
- [ ] As User2, react to each of User1's posts.

## Post Comments

- [ ] As Admin, comment on User2's post.
- [ ] As User2, click on comment notification from Admin's comment.
- [ ] As User2, comment on each of user1's posts.

## Post Subscriptions

- [ ] As User1, unsubscribe from a post.
    - [ ] As User2, comment on the post User1 unsubscribed from.
 
## Profile Editing

- [ ] As User2, upload a profile image and submit form.
- [ ] As User2, remove profile image and submit form.
- [ ] As User2, edit name and bio and submit form.
- [ ] As User2, edit name and bio and don't submit form.
- [ ] As User2, change email.  Confirm email.
- [ ] As user2, change password. Log out and log back in with new password.

## Settings 

- [ ] As User2, turn off Post Comments.
    - [ ] As User1, comment on a User2 post. Confirm no emails.
- [ ] As User2, turn off friend requests.

## Groups

- [ ] As User1, create an "open" group named "Open Test Group"
    - [ ] As User1, create a post in "Open Test Group".
- [ ] As User1, create a "private" group named "Private Test Group"
    - [ ] As User1, create a post in "Private Test Group".
- [ ] As User1, create a "hidden" group named "Hidden Test Group"
    - [ ] As User1, create a post in "Hidden Test Group".

- [ ] As User2, attempt to view "Open Test Group", confirm posts and members are visible.
    - [ ] As User2, attempt to view a specific post in "Open Test Group" by loading the direct link.  Confirm visible.
- [ ] As User1, invite User2 to "Open Test Group"
    - [ ] As User2, reject the invite.
    - [ ] As USer1, invite User2 to "Open Test Group"
    - [ ] As User2, accept the invite and join the group.

- [ ] As User2, attempt to view "Private Test Group", confirm posts and members are *not* visible.
    - [ ] As User2, attempt to view a specific post in "Private Test Group" by loading the direct link.  Confirm 404.
- [ ] As User1, invite User2 to "Private Test Group"
    - [ ] As User2, reject the invite.
    - [ ] As User1, invite User2 to "Private Test Group".
    - [ ] As User2, accept the invite and join the group.
    - [ ] As User2, confirm posts and members are now visible.
        - [ ] As User2, attempt to view a specific post in "Private Test Group" by loading the direct link, confirm visible.

- [ ] As User2, attempt to view "Hidden Test Group", confirm 404.
    - [ ] As user2, attempt to view a specific post in "Hidden Test Group" by loading the direct link, confirm 404.
- [ ] As User1, invite User2 to "Hidden Test Group"
    - [ ] As User2, confirm "Hidden Test Group" is visible.
    - [ ] As User2, reject the invite.
    - [ ] As User1, invite User2 to "Hidden Test Group".
    - [ ] As User2, accept the invite and join the group.
    - [ ] As User2, confirm posts and members are now visible.
        - [ ] As User2, attempt to view a specific post in "Hidden Test Group" by loading the direct link, confirm visible.


