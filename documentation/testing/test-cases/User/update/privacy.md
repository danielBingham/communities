## [Update User: Privacy](documentation/testing/test-cases/User/update/privacy.md)

Cases covering the user updating their feed and display preferences.

### Smoke Test

#### Pre-requisites

- [ ] User1 has registered.
- [ ] User2 has registered and is friends with User1.
    - [ ] User2 has set "Who can view friends?" to "Anyone".
    - [ ] User2 has set "Who can view mutual friends?" to "Anyone".
- [ ] User3 has registered and is friends with User2 and *not* friends with User1.
- [ ] User4 has registered is *not* friends with User1, User2, or User3.
- [ ] User5 has registered and is friends with User1 and User2.

## Cases

- [ ] As a user, I can turn "Who can see your friends?" to "Just Me" to hide my friends list.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Set "Who can see your friends?" to "Just You".
    - As User2:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is NOT shown.**
    - As User3:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is NOT shown.**
    - As User4:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is NOT shown.**
    - As User5:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is NOT shown.**

- [ ] As a user, I can turn "Who can see your mutual friends?" to "Just me" to hide my mutual friends.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Set "Who can see your mutual friends?" to "Just Me".
    - As User2:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are NOT shown.**
    - As User3:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are NOT shown.**
    - As User4:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are NOT shown.**
    - As User5:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are NOT shown.**

### Manual Regression

#### Pre-requisites

- [ ] User1 has registered.
- [ ] User2 has registered and is friends with User1.
    - [ ] User2 has set "Who can view friends?" to "Anyone".
    - [ ] User2 has set "Who can view mutual friends?" to "Anyone".
- [ ] User3 has registered and is friends with User2 and *not* friends with User1.
- [ ] User4 has registered is *not* friends with User1, User2, or User3.
- [ ] User5 has registered and is friends with User1 and User2.

#### Cases

- [ ] As a user, I can turn "Who can see your mutual friends?" to "Friends" to show mutual friends to my friends.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Set "Who can see your mutual friends?" to "Friends".
    - As User2:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are shown.**
    - As User3:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are NOT shown.**
    - As User4:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are NOT shown.**
    - As User5:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are shown.**

- [ ] As a user, I can turn "Who can see your mutual friends?" to "Friends of Friends" to show my mutual friends to friends of my friends.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Set "Who can see your mutual friends?" to "Friends of Friends".
    - As User2:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are shown.**
    - As User3:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are shown.**
    - As User4:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are NOT shown.**
    - As User5:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are shown.**

- [ ] As a user, I can turn "Who can see your mutual friends?" to "Anyone" to show my mutual friends.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Set "Who can see your mutual friends?" to "Anyone".
    - As User2:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are shown.**
    - As User3:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are shown.**
    - As User4:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are NOT shown.**
    - As User5:
        - Navigate to User1's profile page.
            - **Confirm mutual friends are shown.**

### Full Regression

#### Pre-requisites

None.

The user preferences endpoint is not yet covered by the Integration suite.
All preference cases are defined in the Manual Regression section above.

#### Cases

- [ ] As a user, I can turn "Who can see your friends?" to "Friends" to show it to friends. (covered: integration)
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Toggle "Who can see your friends?" to "Friends".
    - As User2:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is shown.**
    - As User3:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is NOT shown.**
    - As User4:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is NOT shown.**

- [ ] As a user, I can turn "Who can see your friends?" to "Friends of Friends" to show it to friends of my friends. (covered: integration)
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Toggle "Who can see your friends?" to "Friends".
    - As User2:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is shown.**
    - As User3:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is NOT shown.**
    - As User4:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is NOT shown.**

- [ ] As a user, I can turn "Who can see your friends?" to "Anyone" to show it to friends of my friends. (covered: integration)
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Toggle "Who can see your friends?" to "Friends".
    - As User2:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is shown.**
    - As User3:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is shown.**
    - As User4:
        - Navigate to User1's profile page.
            - **Confirm User1's friends list is shown.**
