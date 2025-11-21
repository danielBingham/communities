## [Create SiteModeration](documentation/testing/test-cases/SiteModeration/create.md)

Test cases related to SiteModeration creation.  Who can flag posts for site moderation?

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is **not** friends with User1.
- [ ] User4 has been created and is friends with User1.

### Cases

- [ ] Users can flag private posts they can see for Site Moderators.
    1. As User1, create a private post.
    2. As User2, flag User1's post for Site Moderators.

- [ ] Users can flag public posts they can see for Site moderators.
    1. As User1, create a public post.
    1. As User3, flag User1's public post for Site Moderators.

- [ ] Users **cannot** flag posts they can't see.
    1. As User1, create a private post.
    2. As User3, confirm cannot see or flag post.

- [ ] Users can flag comments on private posts they can see for Site Moderators.
    1. As User1, create a private post.
    2. As User2, comment on User1's private post.
    3. As User4, flag User2's comment.

- [ ] Users can flag comments on public posts they can see for Site Moderators.
    1. As User1, create a public post.
    2. As User2, comment on User1's post.
    3. As User3, flag User2's comment.

- [ ] Users **cannot** flag comments on private posts they can't see.
    1. As User1, create a private post.
    2. As User2, comment on User1's post.
    3. As User3, confirm cannot see or flag User2's comment.
