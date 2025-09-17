## [Create User: Invitation](documentation/testing/test-cases/User/create/invitation.md)

Cases covering the User Invitation flow, in which a user is sent an invitation
email and may use it to register on the platform.

### Pre-requisites

- [ ] User1 has been registered and has made a private post.
- [ ] User2 has been registered and has made a public post.

### Cases

- [ ] As User1 invite James Smith (communities-james-smith@mailinator.com).
    - [ ] As User1, confirm invitation is visible on the "Friend Requests" page.
    - [ ] As James Smith, Accept the invite and register James Smith with username `james-smith`
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.
    - [ ] As James Smith, attempt to view User1's profile.  Confirm private post not visible.
    - [ ] As James Smith, accept the friend request and view User1's profile page.

- [ ] As User2, invite Jenny Smith (communities-jenny-smith@mailiantor.com).
    - [ ] As User2, confirm invitation is visible on the "Friend Requests" page.
    - [ ] As Jenny Smith, from the same browser session attempt to accept the invite.
        - [ ] Expectation: Error.
    - [ ] As User1, confirm the invitation is *not* visible on the "Friend Requests" page.
    - [ ] From a different browser session accept the invite and register Jenny Smith with username `jenny-smith`.
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.
    - [ ] As Jenny Smith, accept the friend request and view User1's profile page.
