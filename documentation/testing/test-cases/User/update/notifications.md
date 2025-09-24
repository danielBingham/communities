## [Update User: Notifications](documentation/testing/test-cases/User/update/notifications.md)

Cases covering the user updating their profile to toggle Notifications.

### Pre-requisites

- [ ] User1 has registered.
- [ ] User2 has registered.

### Cases

#### All Notifications

- [ ] Should not receive any notifications when All Notifications are Silenced.

##### Email

- [ ] Should not receive Email notifications when All Notifications: Email is turned off.
- [ ] Should receive Email Notifications when All Notifications: Email is turned on.
- [ ] Should not receive Email notifications when a specific notification is turned off, if All Notifications: Email is turned on.
- [ ] Turning on a specific notification should turn All Notifications: Email back on when it is off.

##### Desktop

- [ ] Should not receive Desktop notifications when All Notifications: Desktop is turned off.
- [ ] Should receive Desktop notifications when All Notifications: Desktop is turned on.
- [ ] Should not recieve a Desktop notification when All Notifications: Desktop is turned on, but a more specific Desktop notification is turned off.
- [ ] Turning on a more specific Desktop notification should turn All Notifications: Desktop back on.

##### Mobile

- [ ] Should not recieve mobile notifications when All Notifications: Mobile is turned off.
- [ ] Should recieve mobile notifications when All Notifications: Mobile is turned on.
- [ ] Should not recieve a Mobile notification when All Notifications: Mobile is turned on, but a more specific Mobile notification is turned off.
- [ ] Turning on a more specific Mobile notification should turn All Notifications: Mobile on.


#### Friends

#### Posts

#### Post Comments

#### Groups

#### Moderation
