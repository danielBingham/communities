## [Create User: Invitation](documentation/testing/test-cases/User/create/invitation.md)

Cases covering the User Invitation flow, in which a user is sent an invitation
email and may use it to register on the platform.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been registered and has made a private post.
- [ ] An email client (mailinator) is available for the invited addresses.

#### Cases

- [ ] As a user, I can invite someone by email and they can register from the invitation.
    - As User1:
        - Invite James Smith (communities-james-smith@mailinator.com).
            - **Confirm invitation is visible on the "Friend Requests" page.**
    - As James Smith:
        - Accept the invite and register with username `james-smith`.
            - **Confirm registration succeeds.**
        - Confirm the email address.
        - Accept the Terms of Service.
        - Skip "Pay What you Can".
        - Turn off all email notifications.
        - Attempt to view User1's profile.
            - **Confirm User1's private post is *not* visible.**
        - Accept the friend request and view User1's profile page.
            - **Confirm User1's private post is now visible.**

### Manual Regression

#### Pre-requisites

- [ ] User1 has been registered.
- [ ] User2 has been registered and has made a public post.
- [ ] An email client (mailinator) is available for the invited addresses.
- [ ] A second browser session is available.

#### Cases

- [ ] As a user, an invitation cannot be accepted from the inviting user's own session.
    - As User2:
        - Invite Jenny Smith (communities-jenny-smith@mailinator.com).
            - **Confirm invitation is visible on the "Friend Requests" page.**
        - From the same browser session, attempt to accept the invite.
            - **Confirm an error is shown.**
    - As User1:
        - Go to the "Friend Requests" page.
            - **Confirm the invitation is *not* visible.**
    - As Jenny Smith:
        - From a different browser session, accept the invite and register with
          username `jenny-smith`.
            - **Confirm registration succeeds.**
        - Confirm the email address.
        - Accept the Terms of Service.
        - Skip "Pay What you Can".
        - Turn off all email notifications.
        - Accept the friend request and view User2's profile page.
            - **Confirm User2's profile is visible.**

### Full Regression

#### Pre-requisites

None.

The invitation endpoints are not yet covered by the Integration suite.  All
invitation cases are defined in the Smoke Test and Manual Regression sections
above.
