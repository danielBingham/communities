## [Read User](documentation/testing/test-cases/User/read.md)

Cases covering viewing a user's profile and the fields that are disclosed to
each kind of viewer.

NOTE: This file is new.  It gives the manual counterparts for the
`GET /user/:id` Integration suite, which previously had no manual test case
definitions.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is **not** friends with User1.
- [ ] User3 has been created and is friends with User1.
- [ ] User4 has been created and has blocked User2.
- [ ] User5 has been created and has not yet confirmed their email.
- [ ] User6 has been created and has been banned by a site moderator.
- [ ] User7 has been created and has had their profile rejected by a site moderator.
- [ ] User8 has been invited but has never registered.
- [ ] A site moderator has been created.
- [ ] A site admin has been created.

### Smoke Test

- [ ] As a user, my password and multifactor secrets are never disclosed to anyone. (covered: integration)
    - As User1:
        - With browser developer tools open (Network tab), load your own profile page.
            - **Confirm no password or multifactor secret appears in any response.**
        - Load User2's profile page.
            - **Confirm no password or multifactor secret appears in any response.**
    - As a site moderator:
        - Load User1's profile page.
            - **Confirm no password or multifactor secret appears in any response.**

- [ ] As a user, another user's email is never disclosed to me. (covered: integration)
    - As User2:
        - Load User1's profile page.
            - **Confirm User1's email is not shown or present in the response.**
    - As User3 (User1's friend):
        - Load User1's profile page.
            - **Confirm User1's email is not shown or present in the response.**
    - As a site moderator:
        - Load User1's profile page.
            - **Confirm User1's email is not shown or present in the response.**

- [ ] As a user who has been blocked, I cannot view the blocker's profile. (covered: integration)
    - As User2 (blocked by User4):
        - Attempt to load User4's profile page.
            - **Confirm the profile is not found.**
    - As User4 (the blocker):
        - Load User2's profile page.
            - **Confirm the profile loads.**

### Manual Regression

- [ ] As a user, my own profile page shows the fields I have set.
    - As User1:
        - Set a profile image, name and "About You", then load your own profile page.
            - **Confirm the profile image, name and about text all render correctly.**

### Full Regression

#### The profile response

- [ ] As a user, I can view another user's profile. (covered: integration)
    - As User1:
        - Load User2's profile page.
            - **Confirm the profile loads with User2's public fields.**
            - **Confirm the relations envelope is returned alongside the profile.**

- [ ] As an unauthenticated visitor, I cannot view a profile. (covered: integration)
    - As unauthenticated user:
        - Attempt to load User1's profile page.
            - **Confirm the request is refused.**

- [ ] As a user, a profile that doesn't exist is not found. (covered: integration)
    - As User1:
        - Navigate to a profile URL for a user id that does not exist.
            - **Confirm a not found result.**
        - Navigate to a profile URL for a malformed (non-UUID) user id.
            - **Confirm a not found result.**

#### Field disclosure

- [ ] As a user, my own profile discloses my private fields to me. (covered: integration)
    - As User1:
        - Load your own profile page.
            - **Confirm the public profile fields are shown.**
            - **Confirm your own email is disclosed.**
            - **Confirm your own account status is disclosed.**
            - **Confirm your own settings and notices are disclosed.**
            - **Confirm your own permissions and invitations are disclosed.**
            - **Confirm your birthdate has not been stored.**

- [ ] As a user, another user's private fields are withheld from me. (covered: integration)
    - As User2:
        - Load User1's profile page.
            - **Confirm the public profile fields are shown.**
            - **Confirm User1's account status is *not* disclosed.**
            - **Confirm User1's birthdate is *not* disclosed.**
            - **Confirm User1's settings and notices are *not* disclosed.**
            - **Confirm User1's location is *not* disclosed.**
            - **Confirm User1's permissions and invitations are *not* disclosed.**
            - **Confirm User1's last authentication attempt is *not* disclosed.**

- [ ] As a friend, the user's private fields are still withheld from me. (covered: integration)
    - As User3 (User1's friend):
        - Load User1's profile page.
            - **Confirm the profile loads.**
            - **Confirm User1's private fields are *not* disclosed.**

- [ ] As a site moderator, a user's private fields are still withheld from me. (covered: integration)
    - As a site moderator:
        - Load User1's profile page.
            - **Confirm the profile loads.**
            - **Confirm User1's private fields are *not* disclosed.**

- [ ] As a site admin, a user's private fields are still withheld from me. (covered: integration)
    - As a site admin:
        - Load User1's profile page.
            - **Confirm the profile loads.**
            - **Confirm User1's private fields are *not* disclosed.**

#### Blocking

- [ ] A blocked user **cannot** view the blocker's profile. (covered: integration)
- [ ] A blocker **can** still view the profile of the user they blocked. (covered: integration)
- [ ] A blocker **can** still see the block in their relations. (covered: integration)
- [ ] A third party **can** still view the blocker's profile. (covered: integration)
- [ ] A third party **can** still view the blocked user's profile. (covered: integration)
- [ ] A blocked user **can** still view their own profile. (covered: integration)
- [ ] A site moderator **can** view a user who has blocked them. (covered: integration)

#### Account status

- [ ] As a user, invited users who have never registered are not visible. (covered: integration)
    - As User1:
        - Attempt to load User8's profile page.
            - **Confirm a not found result.**
    - As a site moderator:
        - Attempt to load User8's profile page.
            - **Confirm a not found result.**

- [ ] As a user, unconfirmed users are visible. (covered: integration)
    - As User1:
        - Load User5's profile page.
            - **Confirm the profile loads.**

- [ ] As a user, banned users are not visible. (covered: integration)
    - As User1:
        - Attempt to load User6's profile page.
            - **Confirm a not found result.**

#### Site moderation

- [ ] As a user, a profile that is flagged but not rejected is still visible. (covered: integration)
    - As User1:
        - Flag User2's profile for site moderation, then load User2's profile page.
            - **Confirm the profile still loads.**

- [ ] A stranger **cannot** view a rejected profile. (covered: integration)
- [ ] A site moderator **can** view a rejected profile. (covered: integration)
- [ ] A rejected user **can** still view their own profile. (covered: integration)
- [ ] A rejected user's own email **is** still disclosed to themselves. (covered: integration)

#### Relations

- [ ] As a user, the relations envelope reflects my relationship to the profile. (covered: integration)
    - As User2 (a stranger to User1):
        - Load User1's profile page.
            - **Confirm the userRelationships dictionary is empty.**
    - As User1:
        - Load your own profile page.
            - **Confirm the userRelationships dictionary is empty.**
        - Send a friend request to User2, then load User2's profile page.
            - **Confirm the pending request is present in relations.**
    - As User3 (User1's friend):
        - Load User1's profile page.
            - **Confirm the confirmed friendship is present in relations.**
    - As User1:
        - Load User3's profile page.
            - **Confirm the confirmed friendship is present in relations for the recipient too.**

- [ ] As a user, a profile with no picture returns an empty files dictionary. (covered: integration)
    - As User1:
        - Load the profile page of a user who has never set a profile picture.
            - **Confirm the files dictionary is empty and the default avatar renders.**

- [ ] As a user, mutual friends are returned when the feature is enabled. (covered: integration)
    - As User1:
        - With mutual friends enabled, load the profile of a user who shares a friend with you.
            - **Confirm the mutuals dictionary is populated.**
