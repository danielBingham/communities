## [Create PostReaction](documentation/testing/test-cases/PostReaction/create.md)

Cases covering reacting to Posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least three posts.

### Cases

- [ ] As User1, like one of User2's Posts.
    - [ ] Confirm like highlighted and "likes" is incremented by 1.
    - [ ] Confirm clicking on the reactions shows User1 as liking.
    - [ ] Confirm post increases rank when feed is sorted by "Most Activity"

- [ ] As User1, dislike a second one of User2's Posts.
    - [ ] Confirm dislike highlighted and "dislikes" is incremented by 1.
    - [ ] Confirm clicking on the reactions shows User1 as disliking.
    - [ ] Confirm post increases rank when feed is sorted by "Most Activity"
 
- [ ] As User1, demote a third one of User2's Posts.
    - [ ] Confirm "Are You Sure" modal shows.
    - [ ] Select "Yes".
    - [ ] Confirm demote is highlighted and "demotes" is incremented by 1.
    - [ ] Confirm clicking on reactions show User1 as demoting.
    - [ ] Confirm post decreases rank when feed is sorted by "Most Activity".
