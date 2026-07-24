## [Update Group](documentation/testing/test-cases/Group/update.md)

Cases covering group updates.

### Smoke Test

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created with User1 as admin,
      User2 as moderator and User3 as member.
- [ ] User7 has been created and is a non-member of Public Group.
- [ ] Sample images are available to upload as group images.

#### Cases

- [ ] As a group admin, I can update a group's profile.
    - As User1:
        - Go to Public Group -> Settings.
        - Upload a new profile image and crop it.
            - **Confirm the image updates.**
        - Change the description.
            - **Confirm the description updates.**
        - Change the Posting Permissions.
            - **Confirm the Posting Permissions update.**
        - Reload the group page.
            - **Confirm all three changes persisted.**

- [ ] A group moderator **cannot** update the group. (covered: integration)
- [ ] A plain member **cannot** update the group. (covered: integration)
- [ ] A non-member **cannot** update the group. (covered: integration)

### Manual Regression

#### Pre-requisites

- [ ] A Public Group, Public Group, has been created with User1 as admin.

#### Cases

- [ ] As a group admin, the group settings form doesn't commit until submitted.
    - As User1:
        - Go to Public Group -> Settings and change the title and description.
        - In a separate tab, load the group page.
            - **Confirm the changes do not show.**
        - Submit the form and refresh the separate tab.
            - **Confirm the changes do show.**

- [ ] As a group admin, I cannot change a group's URL or visibility after creation.
    - As User1:
        - Go to Public Group -> Settings.
            - **Confirm the URL field is not editable.**
            - **Confirm the Visibility control is not editable.**

### Full Regression

#### Pre-requisites

- [ ] An Open, a Private and a Hidden Group have each been created with User1
      as their creating admin.
- [ ] User2 has been added as a second admin, User5 as a moderator and User3
      as a plain member of each group.
- [ ] User8 has a pending invitation to each group and has not accepted.
- [ ] User9 has been banned from each group.
- [ ] User7 has been created and is a non-member of all groups.
- [ ] A site moderator has been created.
- [ ] A group tree three levels deep has been created, plus a HIDDEN-OPEN
      subgroup, with User1 as admin of each parent.
- [ ] A file has been uploaded that can be referenced by fileId.

#### Basics

- [ ] As an unauthenticated visitor, I cannot update a group. (covered: integration)
    - As unauthenticated user:
        - Attempt to update Public Group.
            - **Confirm the request is refused before the id is validated.**

- [ ] As a user, updating a group that doesn't exist is not found. (covered: integration)
    - As User1:
        - Attempt to update a group id that does not exist.
            - **Confirm a not found result.**

- [ ] As a user, an update whose body id doesn't match the route is rejected. (covered: integration)
    - As User1:
        - Submit an update with no id in the body.
            - **Confirm the request is refused.**
        - Submit an update with a null id in the body.
            - **Confirm the request is refused.**
        - Submit an update whose body id doesn't match the route.
            - **Confirm the request is refused.**
        - Submit an update with a non-UUID id in the body.
            - **Confirm the request is refused.**
            - **Confirm the id match is checked before existence.**

- [ ] As a user, a non-UUID id in the route is rejected. (possibly deprecated) (covered: integration)
    - NOTE: This case is skipped in the Integration suite with a KNOWN BUG
      annotation: invalid UUIDs currently reach the database and fail as a 500
      server error rather than a 400.  Re-check the expectation before running.
    - As User1:
        - Attempt to update a group using a non-UUID id in the route.
            - **Confirm the request is refused with a validation error, not a server error.**

#### Permissions on an OPEN group

- [ ] The creating admin **can** update the group. (covered: integration)
- [ ] A second admin **can** update the group. (covered: integration)
- [ ] A site moderator **can** update the group. (covered: integration)
- [ ] A group moderator **cannot** update the group. (covered: integration)
- [ ] A plain member **cannot** update the group. (covered: integration)
- [ ] A pending-invited user **cannot** update the group. (covered: integration)
- [ ] A non-member **cannot** update the group. (covered: integration)
- [ ] A banned member **cannot** update the group, and is told it is not found rather than forbidden. (covered: integration)

#### Permissions on a PRIVATE group

- [ ] The admin **can** update the group. (covered: integration)
- [ ] A member **cannot** update the group. (covered: integration)
- [ ] A non-member **cannot** update the group. (covered: integration)
- [ ] A banned member **cannot** update the group, and is told it is not found. (covered: integration)

#### Permissions on a HIDDEN group

- [ ] The admin **can** update the group. (covered: integration)
- [ ] A site moderator **can** update the group. (covered: integration)
- [ ] A member **cannot** update the group. (covered: integration)
- [ ] A pending-invited user **cannot** update the group, and is told it is forbidden because they may view it. (covered: integration)
- [ ] A non-member **cannot** update the group, and is told it is not found because they may not view it. (covered: integration)
- [ ] A banned member **cannot** update the group, and is told it is not found. (covered: integration)

#### Permission is checked before validation

- [ ] As an unauthorized user, an invalid update is refused for permission, not validation. (covered: integration)
    - As User3 (a plain member):
        - Submit an invalid update to Public Group.
            - **Confirm the refusal cites permission rather than validation.**
    - As User7 (who cannot view Hidden Group):
        - Submit an invalid update to Hidden Group.
            - **Confirm the refusal is a not found result rather than a validation error.**

#### Subgroups

- [ ] A subgroup's own admin **can** update it. (covered: integration)
- [ ] An admin of the parent **can** update the subgroup. (covered: integration)
- [ ] A plain member of the parent **cannot** update the subgroup. (covered: integration)
- [ ] A non-member **cannot** update the subgroup. (covered: integration)
- [ ] For a HIDDEN-OPEN subgroup, the subgroup's admin **can** update it. (covered: integration)
- [ ] For a HIDDEN-OPEN subgroup, a member of the parent **cannot** update it, and is told it is forbidden because they may view it. (covered: integration)
- [ ] For a HIDDEN-OPEN subgroup, a non-member of the parent **cannot** update it, and is told it is not found. (covered: integration)
- [ ] An admin of the grandparent **can** update the immediate child. (covered: integration)
- [ ] An admin of the grandparent **cannot** update the grandchild -- inheritance stops at one level. (covered: integration)

#### Immutable fields

- [ ] As a group admin, immutable fields are rejected when changed. (covered: integration)
    - As User1:
        - Resubmit the group's type unchanged.
            - **Confirm the update is accepted.**
        - Submit a changed type.
            - **Confirm the update is refused.**
        - Submit a type that isn't a valid value.
            - **Confirm the update is refused.**
        - Submit a type differing only in case.
            - **Confirm the update is refused.**
        - Submit a null type.
            - **Confirm the update is refused.**
        - Submit a non-string type.
            - **Confirm the update is refused.**

- [ ] As a group admin, the slug cannot be changed. (covered: integration)
    - As User1:
        - Resubmit the slug unchanged.
            - **Confirm the update is accepted.**
        - Submit a changed slug.
            - **Confirm the update is refused.**
        - Submit a null slug.
            - **Confirm the update is refused.**
        - Submit a non-string slug.
            - **Confirm the update is refused.**
        - Submit a slug that differs only in case.
            - **Confirm the update is refused.**

- [ ] As a group admin, the parent cannot be changed. (covered: integration)
    - As User1:
        - Resubmit a null parentId on a top-level group.
            - **Confirm the update is accepted.**
        - Attempt to set a parentId on a top-level group.
            - **Confirm the update is refused.**
        - Submit a parentId that references a non-existent group.
            - **Confirm the update is refused.**
        - Submit a non-UUID parentId.
            - **Confirm the update is refused.**

#### Field validation

- [ ] As a group admin, the title is validated. (covered: integration)
    - As User1:
        - Update the title.
            - **Confirm the title is updated.**
        - Submit a title of 511 characters.
            - **Confirm the update is accepted.**
        - Submit a title of 512 characters.
            - **Confirm the update is refused.**
        - Submit an empty title.
            - **Confirm the update is refused.**
        - Submit a whitespace-only title.
            - **Confirm the update is refused.**
        - Submit a null title.
            - **Confirm the update is refused.**
        - Submit a non-string title.
            - **Confirm the update is refused.**
        - Submit a patch that omits the title.
            - **Confirm the update is accepted.**

- [ ] As a group admin, postPermissions are validated. (covered: integration)
    - As User1:
        - Update postPermissions to 'members'.
            - **Confirm the update is accepted.**
        - Update postPermissions to 'approval'.
            - **Confirm the update is accepted.**
        - Update postPermissions to 'restricted'.
            - **Confirm the update is accepted.**
        - Update postPermissions back to 'anyone'.
            - **Confirm the update is accepted.**
        - Submit an invalid postPermissions value.
            - **Confirm the update is refused.**
        - Submit a null postPermissions.
            - **Confirm the update is refused.**
        - Submit a non-string postPermissions.
            - **Confirm the update is refused.**

- [ ] As a group admin, the about text is validated. (covered: integration)
    - As User1:
        - Update the about.
            - **Confirm the about is updated.**
        - Submit an empty about.
            - **Confirm the update is accepted.**
        - Submit an about of 9999 characters.
            - **Confirm the update is accepted.**
        - Submit an about of 10000 characters.
            - **Confirm the update is refused.**
        - Submit a null about.
            - **Confirm the update is refused.**
        - Submit a non-string about.
            - **Confirm the update is refused.**

- [ ] As a group admin, the short description and rules are validated. (covered: integration)
    - As User1:
        - Submit a shortDescription of 149 characters.
            - **Confirm the update is accepted.**
        - Submit a shortDescription of 150 characters.
            - **Confirm the update is refused.**
        - Submit a null shortDescription.
            - **Confirm the update is refused.**
        - Submit a non-string shortDescription.
            - **Confirm the update is refused.**
        - Submit rules of 9999 characters.
            - **Confirm the update is accepted.**
        - Submit rules of 10000 characters.
            - **Confirm the update is refused.**
        - Submit null rules.
            - **Confirm the update is refused.**
        - Submit non-string rules.
            - **Confirm the update is refused.**

- [ ] As a group admin, the fileId is validated. (covered: integration)
    - As User1:
        - Submit a non-UUID fileId.
            - **Confirm the update is refused.**
        - Submit a fileId that references a non-existent file.
            - **Confirm the update is refused.**
        - Submit a null fileId.
            - **Confirm the update is accepted.**

- [ ] As a group admin, fields that may never be set are rejected. (covered: integration)
    - As User1:
        - Submit a patch that sets entranceQuestions.
            - **Confirm the update is refused.**
        - Submit a patch that sets a null entranceQuestions.
            - **Confirm the update is refused.**
        - Submit a patch that sets createdDate.
            - **Confirm the update is refused.**
        - Submit a patch that sets updatedDate.
            - **Confirm the update is refused.**
        - Submit a patch that sets siteModerationId.
            - **Confirm the update is refused.**

- [ ] As a group admin, unknown and server-managed fields are ignored. (covered: integration)
    - As User1:
        - Submit a patch with an unknown field.
            - **Confirm the field is ignored and the update is accepted.**
        - Submit a patch with server-maintained counts.
            - **Confirm the counts are ignored and the update is accepted.**

#### No-op updates and preservation

- [ ] As a group admin, a no-op update preserves everything else. (covered: integration)
    - As User1:
        - Submit a patch that changes nothing.
            - **Confirm the update is accepted.**
        - Submit a patch that changes one field.
            - **Confirm fields that weren't submitted are left untouched.**
            - **Confirm updatedDate is bumped.**
            - **Confirm the updated entity and its relations are returned.**

#### Type and parent consistency on update

- [ ] As a group admin, a subgroup's type may be resubmitted but not changed. (covered: integration)
    - As User1:
        - Submit a patch that omits the type entirely.
            - **Confirm the update is accepted.**
        - Resubmit a non-compound subgroup's type without a parentId.
            - **Confirm the update is accepted.**
        - Resubmit a compound type together with its parentId.
            - **Confirm the update is accepted.**
        - Resubmit a 'private-open' subgroup's type without a parentId.
            - **Confirm the update is accepted.**
        - Resubmit a 'hidden-open' subgroup's type without a parentId.
            - **Confirm the update is accepted.**
        - Resubmit a 'hidden-private' subgroup's type without a parentId.
            - **Confirm the update is accepted.**
        - Attempt to change a subgroup's type.
            - **Confirm the update is refused.**
        - Attempt to re-parent a subgroup.
            - **Confirm the update is refused.**
