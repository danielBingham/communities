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

- [ ] A user **can** see a public post. (covered: e2e, integration)
- [ ] A friend of a user **can** see that user's private post. (covered: e2e, integration)
- [ ] A stranger **cannot** see a user's private post. (covered: e2e, integration)

### Full Regression

#### Pre-requisites

- [ ] User1 has been created and has made a PUBLIC and a PRIVATE feed post.
- [ ] User2 has been created and is friends with User1.
- [ ] User3 has been created and is **not** friends with User1.
- [ ] User4 has been created and has been blocked by User1.
- [ ] User5 has been created and has a pending friend request to User1.
- [ ] A site moderator has been created.
- [ ] Sample images are available to upload.

#### Cases

- [ ] As a user, a post I cannot see is not reachable by permalink. (covered: e2e)
    - As User1:
        - Make a private post and copy its permalink.
    - As User3:
        - Open the permalink in the browser.
            - **Confirm the post is not shown and a not found page renders.**

- [ ] As a user, I can copy a link to a post. (covered: e2e)
    - As User1:
        - Open a post's menu and choose "Copy Link".
            - **Confirm the app says the link was copied.**
        - Paste the link into the browser's address bar.
            - **Confirm it opens the post.**

- [ ] As a user, a long post is shortened until I choose to see all of it. (covered: e2e)
    - As User1:
        - Make a post longer than 1,000 characters.
            - **Confirm the feed shows its first 1,000 characters, followed by "...", and a "Show More." link.**
        - Click "Show More."
            - **Confirm the whole post shows.**

- [ ] As a user, I can page through the images in a post. (covered: e2e)
    - As User1:
        - Make a post with three images, and find it on the feed.
            - **Confirm it shows the first image, and "1 / 3".**
            - **Confirm there's a "Next item" button, and no "Previous item" button.**
        - Click "Next item".
            - **Confirm it shows the second image, and "2 / 3".**
        - Click "Next item".
            - **Confirm it shows the third image, and "3 / 3", and no "Next item" button.**
        - Click "Previous item".
            - **Confirm it shows the second image again, and "2 / 3".**

#### Post lists

- [ ] As a user, I can sort my feed. (covered: e2e)
    - As User1:
        - Make three posts, one after another.
    - As User2:
        - Comment on the second post twice, then on the first post once.
    - As User1:
        - Go to the Feed page.
            - **Confirm it's sorted by "Newest" unless you choose otherwise: the third post, then the second, then the first.**
        - Choose "Most Activity" from the sort menu.
            - **Confirm the second post comes first, then the first, then the third.**
        - Choose "Recent Activity" from the sort menu.
            - **Confirm the first post comes first, then the second, then the third.**
        - Choose "Newest" from the sort menu.
            - **Confirm the order is back to the third, the second, and the first.**

- [ ] As a user, the post list matches what I can read individually. (covered: integration)
    - As User1:
        - Page through the feed.
            - **Confirm every post shown can also be opened by permalink.**
            - **Confirm no post that cannot be opened by permalink appears in the feed.**

- [ ] As a user with no visible posts, the feed is empty rather than erroring. (covered: integration)
    - As a newly registered user with no friends and no posts:
        - Load the feed.
            - **Confirm the feed loads and shows only public posts.**

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
