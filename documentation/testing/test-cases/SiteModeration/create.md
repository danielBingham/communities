## [Create SiteModeration](documentation/testing/test-cases/SiteModeration/create.md)

Test cases related to SiteModeration creation.  Who can flag posts for site moderation?

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is **not** friends with User1.
- [ ] User4 has been created and is friends with User1.
- [ ] User1 has created a private post.
- [ ] User1 has created a public post.
- [ ] User2 has commented on User1's private post.
- [ ] User2 has commented on User1's public post.

### Cases

- [ ] User2 can flag User1's private post for Site Moderators.
- [ ] User2 can flag User1's public post for Site Moderators.
- [ ] User3 **cannot** flag User1's private post for Site Moderators.
- [ ] User3 can flag User1's public post for Site Moderators.
- [ ] User3 **cannot** flag User2's comment on User1's private post.
- [ ] User3 can flag User2's comment on User1's public post. 
- [ ] User4 can flag User2's comment on User1's private post.
- [ ] User1 can flag User2's comment on User1's posts.
