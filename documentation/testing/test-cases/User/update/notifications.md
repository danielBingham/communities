## [Update User: Notifications](documentation/testing/test-cases/User/update/notifications.md)

Cases covering the user updating their profile to toggle Notifications.

### Pre-requisites

- [ ] User1 has registered.
- [ ] User2 has registered.

### Smoke Test

- [ ] As a user, I should not receive any notifications when All Notifications are Silenced.
    - As User1:
        - Navigate to User Menu -> Notifications and silence All Notifications.
    - As User2:
        - Send User1 a friend request, then post and mention User1.
    - As User1:
        - Check your email, desktop and mobile notifications.
            - **Confirm no notification of any kind is received.**

### Manual Regression

#### All Notifications

##### Email

- [ ] As a user, I should not receive Email notifications when All Notifications: Email is turned off.
- [ ] As a user, I should receive Email Notifications when All Notifications: Email is turned on.
- [ ] As a user, I should not receive Email notifications when a specific notification is turned off, if All Notifications: Email is turned on.
- [ ] As a user, turning on a specific notification should turn All Notifications: Email back on when it is off.

##### Desktop

- [ ] As a user, I should not receive Desktop notifications when All Notifications: Desktop is turned off.
- [ ] As a user, I should receive Desktop notifications when All Notifications: Desktop is turned on.
- [ ] As a user, I should not recieve a Desktop notification when All Notifications: Desktop is turned on, but a more specific Desktop notification is turned off.
- [ ] As a user, turning on a more specific Desktop notification should turn All Notifications: Desktop back on.

##### Mobile

- [ ] As a user, I should not recieve mobile notifications when All Notifications: Mobile is turned off.
- [ ] As a user, I should recieve mobile notifications when All Notifications: Mobile is turned on.
- [ ] As a user, I should not recieve a Mobile notification when All Notifications: Mobile is turned on, but a more specific Mobile notification is turned off.
- [ ] As a user, turning on a more specific Mobile notification should turn All Notifications: Mobile on.

#### Friends

NOTE: Cases for the Friends notification group have not been written yet.

#### Posts

NOTE: Cases for the Posts notification group have not been written yet.

#### Post Comments

NOTE: Cases for the Post Comments notification group have not been written yet.

#### Groups

NOTE: Cases for the Groups notification group have not been written yet.

#### Moderation

NOTE: Cases for the Moderation notification group have not been written yet.

### Full Regression

The notification settings endpoints are not yet covered by the Integration
suite.  All notification cases are defined in the Smoke Test and Manual
Regression sections above.
