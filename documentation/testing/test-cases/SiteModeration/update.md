## [Update SiteModeration](documentation/testing/test-cases/SiteModeration/update.md)

Test cases related to SiteModeration updating.  Who can act on posts and
comments that have been flagged for site moderation?

### Smoke Test

#### Pre-requisites

- [ ] A Site admin user has been created.
- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.
- [ ] Several posts have been flagged for site moderation.

#### Cases

- [ ] As a SiteAdmin, I can reject a flagged post.
    - As the Site admin:
        - Open the site moderation queue and reject a flagged post.
            - **Confirm the post is removed from the platform.**
    - As User2:
        - Attempt to view the rejected post.
            - **Confirm it is shown as removed by moderators rather than silently missing.**

- [ ] As a SiteAdmin, I can approve a flagged post.
    - As the Site admin:
        - Open the site moderation queue and approve a flagged post.
            - **Confirm the post remains visible.**
            - **Confirm the post leaves the moderation queue.**

- [ ] A non-admin **cannot** act on the site moderation queue.
    - As User1:
        - Attempt to open the site moderation queue.
            - **Confirm it is not offered and cannot be reached by URL.**

### Manual Regression

#### Pre-requisites

- [ ] A Site admin user has been created.
- [ ] Several posts and comments have been flagged for site moderation, and
      their authors are available to log in as.

#### Posts

- [ ] As a SiteAdmin, I can reject a flagged post with a reason.
    - As the Site admin:
        - Reject a flagged post and supply a reason.
            - **Confirm the reason is recorded.**
    - As the post's author:
        - **Confirm a notification of the moderation decision is received.**
        - Open the post.
            - **Confirm the reason is shown.**

- [ ] As a SiteAdmin, I can approve a flagged post with a reason.
    - As the Site admin:
        - Approve a flagged post and supply a reason.
            - **Confirm the reason is recorded and the post remains visible.**

#### Comments

- [ ] As a SiteAdmin, I can reject a flagged comment.
    - As the Site admin:
        - Reject a flagged comment.
            - **Confirm the comment is removed from the post.**

- [ ] As a SiteAdmin, I can reject a flagged comment with a reason.
    - As the Site admin:
        - Reject a flagged comment and supply a reason.
            - **Confirm the reason is recorded.**
    - As the comment's author:
        - **Confirm a notification of the moderation decision is received.**

- [ ] As a SiteAdmin, I can approve a flagged comment.
    - As the Site admin:
        - Approve a flagged comment.
            - **Confirm the comment remains visible and leaves the queue.**

- [ ] As a SiteAdmin, I can approve a flagged comment with a reason.
    - As the Site admin:
        - Approve a flagged comment and supply a reason.
            - **Confirm the reason is recorded and the comment remains visible.**

#### The moderation queue

- [ ] As a SiteAdmin, the queue distinguishes pending, approved and rejected items.
    - As the Site admin:
        - Open the site moderation queue.
            - **Confirm pending, approved and rejected items are distinguishable.**
            - **Confirm each entry shows who flagged it and why.**

- [ ] As a SiteAdmin, I can reverse a moderation decision.
    - As the Site admin:
        - Reject a flagged post, then approve it.
            - **Confirm the post returns to the platform.**

### Full Regression

#### Pre-requisites

None.

The site moderation endpoints are not yet covered by the Integration suite.
All site moderation update cases are defined in the Smoke Test and Manual
Regression sections above.
