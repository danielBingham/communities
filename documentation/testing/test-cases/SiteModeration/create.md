## [Create SiteModeration](documentation/testing/test-cases/SiteModeration/create.md)

Test cases related to SiteModeration creation.  Who can flag posts and
comments for site moderation?

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is **not** friends with User1.
- [ ] User4 has been created and is friends with User1.
- [ ] A site moderator has been created.

### Smoke Test

- [ ] As a user, I can flag a public post for Site Moderators.
    - As User1:
        - Create a public post.
    - As User3:
        - Flag User1's public post for Site Moderators.
            - **Confirm the flag is accepted and a confirmation is shown.**
    - As a site moderator:
        - Open the site moderation queue.
            - **Confirm the flagged post is listed with its reason.**

- [ ] As a user, I can flag a private post I can see for Site Moderators.
    - As User1:
        - Create a private post.
    - As User2:
        - Flag User1's post for Site Moderators.
            - **Confirm the flag is accepted.**

- [ ] A user **cannot** flag a post they can't see.
    - As User1:
        - Create a private post.
    - As User3:
        - Attempt to find User1's post.
            - **Confirm the post cannot be seen and no flag control is offered.**

### Manual Regression

#### Comments

- [ ] As a user, I can flag a comment on a public post for Site Moderators.
    - As User1:
        - Create a public post.
    - As User2:
        - Comment on User1's post.
    - As User3:
        - Flag User2's comment.
            - **Confirm the flag is accepted.**

- [ ] As a user, I can flag a comment on a private post I can see for Site Moderators.
    - As User1:
        - Create a private post.
    - As User2:
        - Comment on User1's private post.
    - As User4:
        - Flag User2's comment.
            - **Confirm the flag is accepted.**

- [ ] A user **cannot** flag a comment on a private post they can't see.
    - As User1:
        - Create a private post.
    - As User2:
        - Comment on User1's post.
    - As User3:
        - Attempt to find User2's comment.
            - **Confirm the comment cannot be seen and no flag control is offered.**

#### The flag interface

- [ ] As a user, flagging asks me for a reason.
    - As User3:
        - Flag a public post for Site Moderators.
            - **Confirm a reason is requested before the flag is submitted.**
        - Cancel the prompt.
            - **Confirm no flag is recorded.**

- [ ] As a user, I cannot flag the same post twice.
    - As User3:
        - Flag a public post, then attempt to flag it again.
            - **Confirm the second flag is refused or the control is disabled.**

### Full Regression

The site moderation endpoints are not yet covered by the Integration suite.
All site moderation creation cases are defined in the Smoke Test and Manual
Regression sections above.
