## [Create Group](documentation/testing/test-cases/Group/create.md)

Cases covering group creation.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created.

### Cases

#### Top level Groups

- [ ] Users can create Public groups.
    1. As User1, go to Groups -> Create.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Public Group'
        4. Confirm URL is autopopulated as 'public-group'
        5. Enter some text in the About field.
        6. Choose 'Public' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Public Group'.
    3. As User2, visit 'Public Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is visible.
        3. Confirm members are visible and User1 is listed as Admin.
        4. Click on User1's post permalink, confirm visible on post view.
        3. React to User1's post.
        4. Comment on User1's post.

#### Subgroups

- [ ] Users can create Public subgroups of Public groups.
    1. As User1, create a Public group called 'Public Group'.
    1. As User1, go to 'Public Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Public -> Public Group'
        4. Confirm URL is autopopulated as 'public---public-group'
        5. Enter some text in the About field.
        6. Choose 'Public' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Public -> Public Group'.
    3. As User2, a non-member of both groups, visit 'Public -> Public Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is visible.
        3. Confirm members are visible and User1 is listed as Admin.
        4. Click on User1's post permalink, confirm visible on post view.
        3. React to User1's post.
        4. Comment on User1's post.
    4. As User1, invite User3 to 'Public Group'.
    5. As User3, accept User1's invitation to join 'Public Group'.
    6. As User3, visit 'Public -> Public Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is visible.
        3. Confirm members are visible and User1 is listed as Admin.
        4. Click on User1's post permalink, confirm visible on post view.
        3. React to User1's post.
        4. Comment on User1's post.
