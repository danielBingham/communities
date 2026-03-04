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

- [ ] Users can create Private Groups.
    1. As User1, go to Groups -> Create.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Private Group'
        4. Confirm URL is autopopulated as 'private-group'
        5. Enter some text in the About field.
        6. Choose 'Private' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Private Group'.
    3. As User2, visit 'Private Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

- [ ] Users can create Hidden Groups.
    1. As User1, go to Groups -> Create.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Hidden Group'
        4. Confirm URL is autopopulated as 'hidden-group'
        5. Enter some text in the About field.
        6. Choose 'Hidden' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Hidden Group'.
    3. As User2, visit 'Hidden Group'.
        1. Confirm group is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

#### Subgroups

##### Subgroups of Public Groups

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

- [ ] Users can create Private subgroups of Public groups.
    1. As User1, create a Public group called 'Public Group'.
    1. As User1, go to 'Public Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Public -> Private Group'
        4. Confirm URL is autopopulated as 'public---private-group'
        5. Enter some text in the About field.
        6. Choose 'Private' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Public -> Private Group'.
    3. As User2, a non-member of both groups, visit 'Public -> Private Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.
    4. As User1, invite User3 to 'Public Group'.
    5. As User3, accept User1's invitation to join 'Public Group'.
    6. As User3, visit 'Public -> Private Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

- [ ] Users can create Hidden subgroups of Public groups.
    1. As User1, create a Public group called 'Public Group'.
    1. As User1, go to 'Public Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Public -> Hidden Group'
        4. Confirm URL is autopopulated as 'public---hidden-group'
        5. Enter some text in the About field.
        6. Choose 'Hidden' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Public -> Hidden Group'.
    3. As User2, a non-member of both groups, visit 'Public -> Hidden Group'.
        1. Confirm group is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.
    4. As User1, invite User3 to 'Public Group'.
    5. As User3, accept User1's invitation to join 'Public Group'.
    6. As User3, visit 'Public -> Hidden Group'.
        1. Confirm group is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

#### Subgroups of Private Groups

- [ ] Users can create Open subgroups of Priavte groups.
    1. As User1, create a Private group called 'Private Group'.
    1. As User1, go to 'Private Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Private -> Open Group'
        4. Confirm URL is autopopulated as 'private---open-group'
        5. Enter some text in the About field.
        6. Choose 'Open to Group Members' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Private -> Open Group'.
    3. As User2, a non-member of both groups, visit 'Private -> Open Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.
    4. As User1, invite User3 to 'Private Group'.
    5. As User3, accept User1's invitation to join 'Private Group'.
    6. As User3, visit 'Private -> Open Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is visible.
        3. Confirm members are visible and User1 is listed as Admin.
        4. Click on User1's post permalink, confirm visible on post view.
        3. React to User1's post.
        4. Comment on User1's post.

- [ ] Users can create Private subgroups of Private groups. 1. As User1, create a Private group called 'Private Group'.
    1. As User1, go to 'Private Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Private -> Private Group'
        4. Confirm URL is autopopulated as 'private---private-group'
        5. Enter some text in the About field.
        6. Choose 'Private' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Private -> Private Group'.
    3. As User2, a non-member of both groups, visit 'Private -> Private Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.
    4. As User1, invite User3 to 'Private Group'.
    5. As User3, accept User1's invitation to join 'Private Group'.
    6. As User3, visit 'Private -> Private Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

- [ ] Users can create Hidden subgroups of Private groups.
    1. As User1, create a Private group called 'Private Group'.
    1. As User1, go to 'Private Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Private -> Hidden Group'
        4. Confirm URL is autopopulated as 'priavte---hidden-group'
        5. Enter some text in the About field.
        6. Choose 'Hidden' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Private -> Hidden Group'.
    3. As User2, a non-member of both groups, visit 'Private -> Hidden Group'.
        1. Confirm group is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.
    4. As User1, invite User3 to 'Private Group'.
    5. As User3, accept User1's invitation to join 'Private Group'.
    6. As User3, visit 'Private -> Hidden Group'.
        1. Confirm group is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.


#### Subgroups of Hidden Groups

- [ ] Users can create Open subgroups of Hidden groups.
    1. As User1, create a Hidden group called 'Hidden Group'.
    1. As User1, go to 'Hidden Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Hidden -> Open Group'
        4. Confirm URL is autopopulated as 'hidden---open-group'
        5. Enter some text in the About field.
        6. Choose 'Open to Group Members' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Hidden -> Open Group'.
    3. As User2, a non-member of both groups, visit 'Hidden -> Open Group'.
        1. Confirm group is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.
    4. As User1, invite User3 to 'Hidden Group'.
    5. As User3, accept User1's invitation to join 'Hidden Group'.
    6. As User3, visit 'Hidden -> Open Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is visible.
        3. Confirm members are visible and User1 is listed as Admin.
        4. Click on User1's post permalink, confirm visible on post view.
        3. React to User1's post.
        4. Comment on User1's post.

- [ ] Users can create Private subgroups of Hidden groups.
    1. As User1, create a Hidden group called 'Hidden Group'.
    1. As User1, go to 'Hidden Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Hidden -> Private Group'
        4. Confirm URL is autopopulated as 'hidden---private-group'
        5. Enter some text in the About field.
        6. Choose 'Private' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Hidden -> Private Group'.
    3. As User2, visit 'Hidden -> Private Group'.
        1. Confirm group is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.
    4. As User1, invite User3 to 'Hidden Group'.
    5. As User3, accept User1's invitation to join 'Hidden Group'.
    6. As User3, visit 'Hidden -> Open Group'.
        1. Confirm group is visible.
        2. Confirm User1's post is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.

- [ ] Users can create Hidden subgroups of Hidden groups.
    1. As User1, create a Hidden group called 'Hidden Group'.
    1. As User1, go to 'Hidden Group' -> Subgroups -> Create Subgroup.
        1. Upload an image.
        2. Crop the image.
        3. Enter the name 'Hidden -> Hidden Group'
        4. Confirm URL is autopopulated as 'hidden---hidden-group'
        5. Enter some text in the About field.
        6. Choose 'Hidden' for Visibility.
        7. Leave Posting Permissions set to 'Members'.
        8. Submit.
    2. As User1, create a new post in 'Hidden -> Hidden Group'.
    3. As User2, visit 'Hidden -> Hidden Group'.
        1. Confirm group is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.
    4. As User1, invite User3 to 'Hidden Group'.
    5. As User3, accept User1's invitation to join 'Hidden Group'.
    6. As User3, visit 'Hidden -> Hidden Group'.
        1. Confirm group is *not* visible.
        3. Confirm members are *not* visible.
        4. Attempt to visit User1's post using the permalink and confirm the post is *not* visible.
