## [Update User: Preferences](documentation/testing/test-cases/User/update/preferences.md)

Cases covering the user updating their feed and display preferences.

### Pre-requisites

- [ ] User1 has registered.
- [ ] A site admin has been created and can create Info and Announcement posts.

### Smoke Test

No preference cases are critical enough for the Smoke Test.  All cases are
defined in the Manual Regression section below.

### Manual Regression

#### Info Posts

- [ ] As a user, I should not receive Info posts in my feed when they are turned off.
    - As User1:
        - Go to your feed.
            - **Confirm info posts are present in your feed.**
            - NOTE: If they are not, log into an admin user and create some info posts.
        - Navigate to User Menu -> Preferences.
        - Toggle Info posts to "off".
        - Return to your feed.
            - **Confirm info posts *are not* shown.**

- [ ] As a user, I should receive Info posts in my feed when they are turned on.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Toggle Info posts to "on".
        - Return to your feed.
            - **Confirm info posts *are* shown.**

#### Announcement Posts

- [ ] As a user, I can turn Announcement posts off.
    - As User1:
        - Go to your feed.
            - **Confirm announcement posts are present in your feed.**
            - NOTE: If they are not, log into an admin user and create some announcement posts.
        - Navigate to User Menu -> Preferences.
        - Toggle Announcement posts to "off".
        - Return to your feed.
            - **Confirm announcement posts *are not* shown.**

- [ ] As a user, I can turn Announcement posts back on.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Toggle Announcement posts to "on".
        - Return to your feed.
            - **Confirm Announcement posts *are* shown.**

#### Show Friends

- [ ] As a user, I can turn Show Friends off.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Toggle Show Friends to "off".
        - Navigate to your profile page.
            - **Confirm your friends list is not shown.**

- [ ] As a user, I can turn Show Friends back on.
    - As User1:
        - Navigate to User Menu -> Preferences.
        - Toggle Show Friends to "on".
        - Navigate to your profile page.
            - **Confirm your friends list is shown.**

### Full Regression

The user preferences endpoint is not yet covered by the Integration suite.
All preference cases are defined in the Manual Regression section above.
