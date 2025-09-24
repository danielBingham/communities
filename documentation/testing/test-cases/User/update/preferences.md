## [Update User: Preferences](documentation/testing/test-cases/User/update/preferences.md)

Cases covering the user updating their profile.

### Pre-requisites

- [ ] User1 has registered.

### Cases

- [ ] Should not receive Info posts in feed when turned off. 
    1. As User1, confirm info posts are present in your feed.
        1. If not, log into an admin user and create some info posts.
    2. As User1, navigate to User Menu -> Preferences.
    3. Toggle Info posts to "off".
    4. Return to your feed.
    5. Confirm info posts *are not* shown.

- [ ] Should receive Info posts in feed when turned on. 
    1. As User1, navigate to User Menu -> Preferences.
    2. Toggle Info posts to "on".
    3. Return to your feed.
    4. Confirm info posts *are* shown.

- [ ] Announcement posts can be turned off.
    1. As User1, confirm announcement posts are in your feed.
        1. If not, log into an admin user and create some announcement posts.
    2. As User1, navigate to User Menu -> Preferences.
    3. Toggle Announcement posts to "off".
    4. Return to your feed.
    5. Confirm announcement posts are not shown.

- [ ] Announcement posts can be turned back on.
    1. As User1, navigate to User Menu -> Preferences
    2. Toggle Announcement posts to "on"
    3. Return to your feed.
    4. Confirm Announcement posts *are* shown.
