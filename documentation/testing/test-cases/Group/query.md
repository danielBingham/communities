## [Query Group](documentation/testing/test-cases/Group/query.md)

Cases covering group querying: the Find Group list and the search control.

### Pre-requisites

- [ ] A Public Group, Public Group, has been created.
    - [ ] The following subgroups of Public Group have been created:
        - [ ] A Public Group named Public - Public Group
        - [ ] A Private Group named Public - Private Group
        - [ ] A Hidden Group named Public - Hidden Group
- [ ] A Private Group, Private Group, has been created.
    - [ ] The following subgroups of Private Group have been created:
        - [ ] An Open Group named Private - Open Group
        - [ ] A Private Group named Private - Private Group
        - [ ] A Hidden Group named Private - Hidden Group
- [ ] A Hidden Group, Hidden Group, has been created.
    - [ ] The following subgroups of Hidden Group have been created:
        - [ ] An Open Group named Hidden - Open Group
        - [ ] A Private Group named Hidden - Private Group
        - [ ] A Hidden Group named Hidden - Hidden Group

- [ ] User1 has been created and added as an admin of each group.
- [ ] User2 has been created and added as a moderator of each group.
- [ ] User3 has been created and added as a member of each group.

- [ ] User4 has been created and added as an admin only of the top level groups.
- [ ] User5 has been created an added as a moderator only of the top level groups.
- [ ] User6 has been created and added as a member only of the top level groups.

- [ ] User7 has been created and is a non-member of all groups.
- [ ] User8 has been created, has a pending invitation to each group, and has not accepted.
- [ ] User9 has been created and has been banned from each group.
- [ ] A site moderator has been created.

### Smoke Test

- [ ] As a user, the Find Group list only includes groups I am allowed to see.
    - As User7, a non-member of all groups:
        - Go to the Find Group page.
            - **Confirm Public Group and Private Group are listed.**
            - **Confirm Hidden Group is *not* listed.**
    - As User3, a member of all groups:
        - Go to the Find Group page.
            - **Confirm Public Group, Private Group and Hidden Group are all listed.**

### Manual Regression

- [ ] As a user, I can filter the Find Group list using the Search control.
    - As User3:
        - Go to the Find Group page.
        - Enter part of a group's name in the Search control.
            - **Confirm the list filters down to matching groups.**
        - Clear the Search control.
            - **Confirm the full list returns.**
        - Enter a string that matches no group.
            - **Confirm an empty state is shown rather than an error.**

- [ ] As a user, the Find Group list includes subgroups I can see.
    - As User7:
        - Go to the Find Group page.
            - **Confirm Public - Public Group and Public - Private Group are listed.**
            - **Confirm Public - Hidden Group is *not* listed.**

### Full Regression

- [ ] As a user, the group list is self-consistent and de-duplicated across pages. (covered: integration)
    - As User3:
        - Go to the Find Group page and page through the whole list.
            - **Confirm no group appears twice across the pages.**

- [ ] As a user, the group list matches what I can read individually. (covered: integration)
    - As User1:
        - Go to the Find Group page and open each group in turn.
            - **Confirm every group shown in the list can also be opened directly.**
            - **Confirm no group that cannot be opened directly appears in the list.**

The list is checked against the individually readable group for every role and
group type below.  The expected visibility for each role is defined in
[Read Group](documentation/testing/test-cases/Group/read.md); this case
confirms the list agrees with it.

#### Top level Groups

- [ ] The Find Group list matches the readable group for a Group Admin, in Public, Private and Hidden groups. (covered: integration)
- [ ] The Find Group list matches the readable group for a Group Moderator, in Public, Private and Hidden groups. (covered: integration)
- [ ] The Find Group list matches the readable group for a Member, in Public, Private and Hidden groups. (covered: integration)
- [ ] The Find Group list matches the readable group for an Invited/Requested member, in Public, Private and Hidden groups. (covered: integration)
- [ ] The Find Group list matches the readable group for a Non-member, in Public, Private and Hidden groups. (covered: integration)
- [ ] The Find Group list matches the readable group for a Site moderator, in Public, Private and Hidden groups. (covered: integration)
- [ ] The Find Group list matches the readable group for a Banned member, in Public, Private and Hidden groups. (covered: integration)

#### Subgroups

- [ ] The Find Group list matches the readable subgroup for a Group Admin, for every subgroup type. (covered: integration)
- [ ] The Find Group list matches the readable subgroup for a Group Moderator, for every subgroup type. (covered: integration)
- [ ] The Find Group list matches the readable subgroup for a Member, for every subgroup type. (covered: integration)
- [ ] The Find Group list matches the readable subgroup for a Parent Group Admin, for every subgroup type. (covered: integration)
- [ ] The Find Group list matches the readable subgroup for a Parent Group Moderator, for every subgroup type. (covered: integration)
- [ ] The Find Group list matches the readable subgroup for a Parent Group Member, for every subgroup type. (covered: integration)
- [ ] The Find Group list matches the readable subgroup for an Invited/Requested member, for every subgroup type. (covered: integration)
- [ ] The Find Group list matches the readable subgroup for an Invited/Requested member who is a Parent Group Member, for every subgroup type. (covered: integration)
- [ ] The Find Group list matches the readable subgroup for a Non-member, for every subgroup type. (covered: integration)
- [ ] The Find Group list matches the readable subgroup for a Site moderator, for every subgroup type. (covered: integration)
- [ ] The Find Group list matches the readable subgroup for a Banned member, for every subgroup type. (covered: integration)
