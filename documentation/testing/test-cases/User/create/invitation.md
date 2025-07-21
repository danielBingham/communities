### User Invitation

Cases covering the User Invitation flow, in which a user is sent an invitation
email and may use it to register on the platform.

- [ ] From the administrator (Admin) account invite John Doe (communities-john-doe@mailinator.com).
    - [ ] As Admin, Confirm invitation is visible on the "Friend Requests" page.
    - [ ] As John Doe, Accept the invite and register John Doe with username `john-doe`
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.
    - [ ] As John Doe, accept the friend request and view Admin's profile page.

- [ ] As John Doe, invite Jane Doe (communities-jane.doe@mailiantor.com).
    - [ ] As John Doe, confirm invitation is visible on the "Friend Requests" page.
    - [ ] As John Doe, from the same browser session attempt to accept the invite.
        - [ ] Expectation: Error.
    - [ ] As Admin, confirm the invitation is *not* visible on the "Friend Requests" page.
    - [ ] From a different browser session accept the invite and register Jane Doe with username `jane.doe`.
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.
    - [ ] As Jane Doe, accept the friend request and view John Doe's profile page.

- [ ] As Jane Doe, invite James Smith (communities-james_smith@mailinator.com).
    - [ ] As Jane Doe, confirm the invitation is visible on the "Friend Requests" page.
    - [ ] From a different browser session accept the invite and register James Smith with username `james_smith`.
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.
    - [ ] As James Smith, accept the Friend Request and view Jane Doe's profile page.
