## [Create Group](documentation/testing/test-cases/Group/create.md)

Cases covering group creation.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created.

### Smoke Test

#### Top level Groups

- [ ] As a user, I can create a Public group.
    - As User1:
        - Go to Groups -> Create.
        - Upload an image.
        - Crop the image.
        - Enter the name 'Public Group'.
            - **Confirm URL is autopopulated as 'public-group'.**
        - Enter some text in the About field.
        - Choose 'Public' for Visibility.
        - Leave Posting Permissions set to 'Members'.
        - Submit.
            - **Confirm the group is created.**
        - Create a new post in 'Public Group'.
    - As User2:
        - Visit 'Public Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is visible.**
            - **Confirm members are visible and User1 is listed as Admin.**
        - Click on User1's post permalink.
            - **Confirm visible on post view.**
        - React to User1's post.
            - **Confirm the reaction registers.**
        - Comment on User1's post.
            - **Confirm the comment posts.**

#### Subgroups

- [ ] As a user, I can create a Public subgroup of a Public group.
    - As User1:
        - Create a Public group called 'Public Group'.
        - Go to 'Public Group' -> Subgroups -> Create Subgroup.
        - Upload an image.
        - Crop the image.
        - Enter the name 'Public -> Public Group'.
            - **Confirm URL is autopopulated as 'public---public-group'.**
        - Enter some text in the About field.
        - Choose 'Public' for Visibility.
        - Leave Posting Permissions set to 'Members'.
        - Submit.
            - **Confirm the subgroup is created.**
        - Create a new post in 'Public -> Public Group'.
    - As User2, a non-member of both groups:
        - Visit 'Public -> Public Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is visible.**
            - **Confirm members are visible and User1 is listed as Admin.**
        - Click on User1's post permalink.
            - **Confirm visible on post view.**
        - React to and comment on User1's post.
            - **Confirm both register.**
    - As User1:
        - Invite User3 to 'Public Group'.
    - As User3:
        - Accept User1's invitation to join 'Public Group'.
        - Visit 'Public -> Public Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is visible.**
            - **Confirm members are visible and User1 is listed as Admin.**
        - Click on User1's post permalink.
            - **Confirm visible on post view.**
        - React to and comment on User1's post.
            - **Confirm both register.**

### Manual Regression

- [ ] As a user, the create group form behaves correctly.
    - As User1:
        - Go to Groups -> Create.
        - Enter a name containing spaces and punctuation.
            - **Confirm the URL field autopopulates with a slugified version of the name.**
        - Edit the URL field by hand, then change the name again.
            - **Confirm the hand-edited URL is not overwritten.**
        - Upload an image that does not have a 1:1 aspect ratio.
            - **Confirm the crop tool is offered.**
        - Drag the crop box to an appropriate crop and submit.
            - **Confirm the group image is cropped to the chosen crop box.**

- [ ] As a user, I cannot create a group with a URL that is already taken.
    - As User1:
        - Create a group with the name 'Public Group'.
        - Go to Groups -> Create and enter the name 'Public Group' again.
        - Submit.
            - **Confirm a validation error is shown on the URL field.**

### Full Regression

#### Basics

- [ ] As an unauthenticated visitor, I cannot create a group. (covered: integration)
    - As unauthenticated user:
        - Attempt to create a group.
            - **Confirm the request is refused.**

- [ ] As a user, creating a group makes me its admin and subscribes me to it. (covered: integration)
    - As User1:
        - Create a group.
            - **Confirm you are an admin member of the new group.**
            - **Confirm you are subscribed to the new group.**

#### Top level Groups

- [ ] As a user, I can create a Public group. (covered: integration)
    - As User1:
        - Go to Groups -> Create.
        - Upload an image, crop it, enter the name 'Public Group'.
            - **Confirm URL is autopopulated as 'public-group'.**
        - Enter some text in the About field.
        - Choose 'Public' for Visibility, leave Posting Permissions set to 'Members', and Submit.
            - **Confirm the group is created.**
        - Create a new post in 'Public Group'.
    - As User2:
        - Visit 'Public Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is visible.**
            - **Confirm members are visible and User1 is listed as Admin.**
        - Click on User1's post permalink.
            - **Confirm visible on post view.**
        - React to and comment on User1's post.
            - **Confirm both register.**

- [ ] As a user, I can create a Private group. (covered: integration)
    - As User1:
        - Go to Groups -> Create.
        - Upload an image, crop it, enter the name 'Private Group'.
            - **Confirm URL is autopopulated as 'private-group'.**
        - Enter some text in the About field.
        - Choose 'Private' for Visibility, leave Posting Permissions set to 'Members', and Submit.
            - **Confirm the group is created.**
        - Create a new post in 'Private Group'.
    - As User2:
        - Visit 'Private Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**

- [ ] As a user, I can create a Hidden group. (covered: integration)
    - As User1:
        - Go to Groups -> Create.
        - Upload an image, crop it, enter the name 'Hidden Group'.
            - **Confirm URL is autopopulated as 'hidden-group'.**
        - Enter some text in the About field.
        - Choose 'Hidden' for Visibility, leave Posting Permissions set to 'Members', and Submit.
            - **Confirm the group is created.**
        - Create a new post in 'Hidden Group'.
    - As User2:
        - Visit 'Hidden Group'.
            - **Confirm group is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**

#### Subgroup creation permissions

- [ ] A parent group's creating admin **can** create a subgroup. (covered: integration)
- [ ] A second parent group admin **can** create a subgroup. (covered: integration)
- [ ] A parent group moderator **cannot** create a subgroup. (covered: integration)
- [ ] A parent group member **cannot** create a subgroup. (covered: integration)
- [ ] A non-member of the parent **cannot** create a subgroup. (covered: integration)

#### Subgroups of Public Groups

- [ ] As a user, I can create a Public subgroup of a Public group. (covered: integration)
    - As User1:
        - Create a Public group called 'Public Group'.
        - Go to 'Public Group' -> Subgroups -> Create Subgroup.
        - Upload an image, crop it, enter the name 'Public -> Public Group'.
            - **Confirm URL is autopopulated as 'public---public-group'.**
        - Enter some text in the About field.
        - Choose 'Public' for Visibility, leave Posting Permissions set to 'Members', and Submit.
            - **Confirm the subgroup is created.**
        - Create a new post in 'Public -> Public Group'.
    - As User2, a non-member of both groups:
        - Visit 'Public -> Public Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is visible.**
            - **Confirm members are visible and User1 is listed as Admin.**
        - Click on User1's post permalink.
            - **Confirm visible on post view.**
        - React to and comment on User1's post.
            - **Confirm both register.**
    - As User1:
        - Invite User3 to 'Public Group'.
    - As User3:
        - Accept the invitation, then visit 'Public -> Public Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is visible.**
            - **Confirm members are visible and User1 is listed as Admin.**
        - React to and comment on User1's post.
            - **Confirm both register.**

- [ ] As a user, I can create a Private subgroup of a Public group. (covered: integration)
    - As User1:
        - Create a Public group called 'Public Group'.
        - Go to 'Public Group' -> Subgroups -> Create Subgroup.
        - Upload an image, crop it, enter the name 'Public -> Private Group'.
            - **Confirm URL is autopopulated as 'public---private-group'.**
        - Enter some text in the About field.
        - Choose 'Private' for Visibility, leave Posting Permissions set to 'Members', and Submit.
            - **Confirm the subgroup is created.**
        - Create a new post in 'Public -> Private Group'.
    - As User2, a non-member of both groups:
        - Visit 'Public -> Private Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**
    - As User1:
        - Invite User3 to 'Public Group'.
    - As User3:
        - Accept the invitation, then visit 'Public -> Private Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**

- [ ] As a user, I can create a Hidden subgroup of a Public group. (covered: integration)
    - As User1:
        - Create a Public group called 'Public Group'.
        - Go to 'Public Group' -> Subgroups -> Create Subgroup.
        - Upload an image, crop it, enter the name 'Public -> Hidden Group'.
            - **Confirm URL is autopopulated as 'public---hidden-group'.**
        - Enter some text in the About field.
        - Choose 'Hidden' for Visibility, leave Posting Permissions set to 'Members', and Submit.
            - **Confirm the subgroup is created.**
        - Create a new post in 'Public -> Hidden Group'.
    - As User2, a non-member of both groups:
        - Visit 'Public -> Hidden Group'.
            - **Confirm group is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**
    - As User1:
        - Invite User3 to 'Public Group'.
    - As User3:
        - Accept the invitation, then visit 'Public -> Hidden Group'.
            - **Confirm group is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**

#### Subgroups of Private Groups

- [ ] As a user, I can create an Open subgroup of a Private group. (covered: integration)
    - As User1:
        - Create a Private group called 'Private Group'.
        - Go to 'Private Group' -> Subgroups -> Create Subgroup.
        - Upload an image, crop it, enter the name 'Private -> Open Group'.
            - **Confirm URL is autopopulated as 'private---open-group'.**
        - Enter some text in the About field.
        - Choose 'Open to Group Members' for Visibility, leave Posting Permissions set to 'Members', and Submit.
            - **Confirm the subgroup is created.**
        - Create a new post in 'Private -> Open Group'.
    - As User2, a non-member of both groups:
        - Visit 'Private -> Open Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**
    - As User1:
        - Invite User3 to 'Private Group'.
    - As User3:
        - Accept the invitation, then visit 'Private -> Open Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is visible.**
            - **Confirm members are visible and User1 is listed as Admin.**
        - Click on User1's post permalink.
            - **Confirm visible on post view.**
        - React to and comment on User1's post.
            - **Confirm both register.**

- [ ] As a user, I can create a Private subgroup of a Private group. (covered: integration)
    - As User1:
        - Create a Private group called 'Private Group'.
        - Go to 'Private Group' -> Subgroups -> Create Subgroup.
        - Upload an image, crop it, enter the name 'Private -> Private Group'.
            - **Confirm URL is autopopulated as 'private---private-group'.**
        - Enter some text in the About field.
        - Choose 'Private' for Visibility, leave Posting Permissions set to 'Members', and Submit.
            - **Confirm the subgroup is created.**
        - Create a new post in 'Private -> Private Group'.
    - As User2, a non-member of both groups:
        - Visit 'Private -> Private Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**
    - As User1:
        - Invite User3 to 'Private Group'.
    - As User3:
        - Accept the invitation, then visit 'Private -> Private Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**

- [ ] As a user, I can create a Hidden subgroup of a Private group. (covered: integration)
    - As User1:
        - Create a Private group called 'Private Group'.
        - Go to 'Private Group' -> Subgroups -> Create Subgroup.
        - Upload an image, crop it, enter the name 'Private -> Hidden Group'.
            - **Confirm URL is autopopulated as 'private---hidden-group'.**
        - Enter some text in the About field.
        - Choose 'Hidden' for Visibility, leave Posting Permissions set to 'Members', and Submit.
            - **Confirm the subgroup is created.**
        - Create a new post in 'Private -> Hidden Group'.
    - As User2, a non-member of both groups:
        - Visit 'Private -> Hidden Group'.
            - **Confirm group is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**
    - As User1:
        - Invite User3 to 'Private Group'.
    - As User3:
        - Accept the invitation, then visit 'Private -> Hidden Group'.
            - **Confirm group is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**

#### Subgroups of Hidden Groups

- [ ] As a user, I can create an Open subgroup of a Hidden group. (covered: integration)
    - As User1:
        - Create a Hidden group called 'Hidden Group'.
        - Go to 'Hidden Group' -> Subgroups -> Create Subgroup.
        - Upload an image, crop it, enter the name 'Hidden -> Open Group'.
            - **Confirm URL is autopopulated as 'hidden---open-group'.**
        - Enter some text in the About field.
        - Choose 'Open to Group Members' for Visibility, leave Posting Permissions set to 'Members', and Submit.
            - **Confirm the subgroup is created.**
        - Create a new post in 'Hidden -> Open Group'.
    - As User2, a non-member of both groups:
        - Visit 'Hidden -> Open Group'.
            - **Confirm group is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**
    - As User1:
        - Invite User3 to 'Hidden Group'.
    - As User3:
        - Accept the invitation, then visit 'Hidden -> Open Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is visible.**
            - **Confirm members are visible and User1 is listed as Admin.**
        - Click on User1's post permalink.
            - **Confirm visible on post view.**
        - React to and comment on User1's post.
            - **Confirm both register.**

- [ ] As a user, I can create a Private subgroup of a Hidden group. (covered: integration)
    - As User1:
        - Create a Hidden group called 'Hidden Group'.
        - Go to 'Hidden Group' -> Subgroups -> Create Subgroup.
        - Upload an image, crop it, enter the name 'Hidden -> Private Group'.
            - **Confirm URL is autopopulated as 'hidden---private-group'.**
        - Enter some text in the About field.
        - Choose 'Private' for Visibility, leave Posting Permissions set to 'Members', and Submit.
            - **Confirm the subgroup is created.**
        - Create a new post in 'Hidden -> Private Group'.
    - As User2:
        - Visit 'Hidden -> Private Group'.
            - **Confirm group is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**
    - As User1:
        - Invite User3 to 'Hidden Group'.
    - As User3:
        - Accept the invitation, then visit 'Hidden -> Private Group'.
            - **Confirm group is visible.**
            - **Confirm User1's post is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**

- [ ] As a user, I can create a Hidden subgroup of a Hidden group. (covered: integration)
    - As User1:
        - Create a Hidden group called 'Hidden Group'.
        - Go to 'Hidden Group' -> Subgroups -> Create Subgroup.
        - Upload an image, crop it, enter the name 'Hidden -> Hidden Group'.
            - **Confirm URL is autopopulated as 'hidden---hidden-group'.**
        - Enter some text in the About field.
        - Choose 'Hidden' for Visibility, leave Posting Permissions set to 'Members', and Submit.
            - **Confirm the subgroup is created.**
        - Create a new post in 'Hidden -> Hidden Group'.
    - As User2:
        - Visit 'Hidden -> Hidden Group'.
            - **Confirm group is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**
    - As User1:
        - Invite User3 to 'Hidden Group'.
    - As User3:
        - Accept the invitation, then visit 'Hidden -> Hidden Group'.
            - **Confirm group is *not* visible.**
            - **Confirm members are *not* visible.**
        - Attempt to visit User1's post using the permalink.
            - **Confirm the post is *not* visible.**

#### Subgroup type matrix

- [ ] Under a PUBLIC parent, an admin **can** create an OPEN subgroup ('open'). (covered: integration)
- [ ] Under a PUBLIC parent, an admin **can** create a PRIVATE subgroup ('private'). (covered: integration)
- [ ] Under a PUBLIC parent, an admin **can** create a HIDDEN subgroup ('hidden'). (covered: integration)
- [ ] Under a PRIVATE parent, an admin **can** create an OPEN subgroup ('private-open'). (covered: integration)
- [ ] Under a PRIVATE parent, an admin **can** create a PRIVATE subgroup ('private'). (covered: integration)
- [ ] Under a PRIVATE parent, an admin **can** create a HIDDEN subgroup ('hidden'). (covered: integration)
- [ ] Under a HIDDEN parent, an admin **can** create an OPEN subgroup ('hidden-open'). (covered: integration)
- [ ] Under a HIDDEN parent, an admin **can** create a PRIVATE subgroup ('hidden-private'). (covered: integration)
- [ ] Under a HIDDEN parent, an admin **can** create a HIDDEN subgroup ('hidden'). (covered: integration)
- [ ] Under a PRIVATE-OPEN parent, an admin **can** create a PRIVATE-OPEN subgroup ('private-open'). (covered: integration)
- [ ] Under a PRIVATE-OPEN parent, an admin **can** create a PRIVATE subgroup ('private'). (covered: integration)
- [ ] Under a PRIVATE-OPEN parent, an admin **can** create a HIDDEN subgroup ('hidden'). (covered: integration)
