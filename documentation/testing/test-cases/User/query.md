## [Query User](documentation/testing/test-cases/User/query.md)

Cases covering searching for and browsing lists of users.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.

#### Cases

- [ ] As a user, I can search for people by name on the Find Users page.
    - As User1:
        - Go to the Find Users page.
        - Enter part of User2's name in the search control.
            - **Confirm the list filters down to matching users.**
            - **Confirm User2 is present in the results.**

### Manual Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created and is friends with User1.

#### Cases

- [ ] As a user, I can search for people by name on the Your Friends page.
    - As User1:
        - Go to the Your Friends page.
        - Enter part of User3's name in the search control.
            - **Confirm the list filters down to matching friends.**
            - **Confirm User3 is present in the results.**

- [ ] As a user, I can search for people by name on the Pending -> Requests page.
    - As User1:
        - Send a friend request to User2.
        - Go to the Pending -> Requests page.
        - Enter part of User2's name in the search control.
            - **Confirm the list filters down to matching pending requests.**

### Full Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created, is friends with User1, and has blocked User2.
- [ ] User4 has been created and has not yet confirmed their email.
- [ ] User5 has been created and has been banned by a site moderator.
- [ ] User6 has been created and has had their profile rejected by a site moderator.
- [ ] A user has been invited but has never registered.
- [ ] A site moderator has been created.

#### Cases

- [ ] As a user, the user list is self-consistent and de-duplicated across pages. (covered: integration)
    - As User1:
        - Go to the Find Users page and page through the whole list.
            - **Confirm no user appears twice across the pages.**
            - **Confirm each entry matches what is shown on that user's profile page.**

- [ ] As an unauthenticated visitor, I cannot browse the user list. (covered: integration)
    - As unauthenticated user:
        - Attempt to load the Find Users page.
            - **Confirm the request is refused.**

- [ ] As an unconfirmed user, my view of the user list is restricted. (covered: integration)
    - As User4 (unconfirmed):
        - Go to the Find Users page.
            - **Confirm the list matches what User4 is permitted to see.**

- [ ] As a blocked user, I do not see the user who blocked me in the list. (covered: integration)
    - As User2 (blocked by User3):
        - Go to the Find Users page and search for User3.
            - **Confirm User3 is *not* present in the results.**
    - As User3 (the blocker):
        - Go to the Find Users page and search for User2.
            - **Confirm User2 *is* present in the results.**

- [ ] As a user, users with a non-standard account status are excluded from the list. (covered: integration)
    - As User1:
        - Go to the Find Users page and search for User5 (banned).
            - **Confirm User5 is *not* present in the results.**
        - Search for a user who has only been invited and has never registered.
            - **Confirm the invited user is *not* present in the results.**

- [ ] As a user, site-moderated profiles are excluded from the list. (covered: integration)
    - As User1:
        - Go to the Find Users page and search for User6 (profile rejected).
            - **Confirm User6 is *not* present in the results.**
    - As a site moderator:
        - Go to the Find Users page and search for User6.
            - **Confirm User6 *is* present in the results.**
