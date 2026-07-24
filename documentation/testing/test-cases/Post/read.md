## [Read Post](documentation/testing/test-cases/Post/read.md)

Cases covering reading posts and post visibility permissions.

Posts made to a group are covered separately in
[Read GroupPost](documentation/testing/test-cases/GroupPost/read.md).

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created and has made a PUBLIC and a PRIVATE feed post.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is **not** friends with User1.

#### Cases

- [ ] A user **can** see a public post. (covered: integration)
- [ ] A friend of a user **can** see that user's private post. (covered: integration)
- [ ] A stranger **cannot** see a user's private post. (covered: integration)

### Manual Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User3 has been created and is **not** friends with User1.

#### Cases

- [ ] As a user, a post I cannot see is not reachable by permalink.
    - As User1:
        - Make a private post and copy its permalink.
    - As User3:
        - Open the permalink in the browser.
            - **Confirm the post is not shown and a not found page renders.**

### Full Regression

#### Pre-requisites

- [ ] User1 has been created and has made a PUBLIC and a PRIVATE feed post.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is **not** friends with User1.
- [ ] User4 has been created and has been blocked by User1.
- [ ] User5 has been created and has a pending friend request to User1.
- [ ] A site moderator has been created.

#### Basics

- [ ] As a user, I can view my own post. (covered: integration)
    - As User1:
        - Make a public post and open it.
            - **Confirm the post is returned.**

- [ ] As an unauthenticated visitor, I cannot view a post. (covered: integration)
    - As unauthenticated user:
        - Attempt to open a post permalink.
            - **Confirm the request is refused.**

- [ ] As a user, a post that doesn't exist is not found. (covered: integration)
    - As User1:
        - Open a permalink for a post id that does not exist.
            - **Confirm a not found result.**

- [ ] As a user, a post I cannot view is not found rather than forbidden. (covered: integration)
    - As User3:
        - Open a permalink for User1's private post.
            - **Confirm a not found result rather than a permission error.**

#### PUBLIC posts to a user's feed

- [ ] Anyone **can** view another user's PUBLIC post. (covered: integration)
- [ ] A confirmed friend **can** view a PUBLIC post. (covered: integration)
- [ ] A blocked user **cannot** view even a PUBLIC post. (covered: integration)

#### PRIVATE posts to a user's feed

- [ ] A stranger **cannot** view another user's PRIVATE post. (covered: integration)
- [ ] A confirmed friend **can** view a PRIVATE post. (covered: integration)
- [ ] A user with a pending friend request **cannot** view a PRIVATE post. (covered: integration)
- [ ] A blocked user **cannot** view a PRIVATE post. (covered: integration)
- [ ] A site moderator **can** view another user's PRIVATE post. (covered: integration)

#### Post lists

- [ ] As a user, the post list matches what I can read individually. (covered: integration)
    - As User1:
        - Page through the feed.
            - **Confirm every post shown can also be opened by permalink.**
            - **Confirm no post that cannot be opened by permalink appears in the feed.**

- [ ] As a user with no visible posts, the feed is empty rather than erroring. (covered: integration)
    - As a newly registered user with no friends and no posts:
        - Load the feed.
            - **Confirm the feed loads and shows only public posts.**
