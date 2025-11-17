## [Delete Group](documentation/testing/test-cases/Group/delete.md)

Cases covering group deletion.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created.
- [ ] User4 has been created.
- [ ] A Group has been created with User1 as admin, User2 as moderator, and
      User3 as member, and User4 as non-member.

### Cases

- [ ] Members with 'admin' role can delete groups.

- [ ] Non-members with 'admin' or 'superadmin' siteRole can delete groups.

- [ ] Deleting a group with content deletes all its content.

- [ ] Deleting a group with subgroups also deletes its subgroups.
