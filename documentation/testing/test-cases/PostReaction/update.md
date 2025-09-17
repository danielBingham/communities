## [Update PostReaction](documentation/testing/test-cases/PostReaction/update.md)

Cases covering updating reactions to Posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least three posts.
- [ ] User1 has reacted to each of User2 posts.

### Cases

- [ ] As User1, dislike the User2 Post previously liked. 
    - [ ] Confirm dislike highlighted and like not highlighted.
    - [ ] Confirm "dislikes" is incremented by 1 and "likes" is decremented by 1.
    - [ ] Confirm clicking on the reactions shows User1 as disliking.
    - [ ] Confirm post rank when feed is sorted by "Most Activity" stays the same
    
- [ ] As User1, demote the User2 Post previously disliked
    - [ ] Confirm "Are You Sure" modal is shown.
    - [ ] Select "yes".
    - [ ] Confirm demote highlighted and dislike not highlighted.
    - [ ] Confirm demotes is incremented by 1 and dislikes is decremented by 1.
    - [ ] Confirm clicking on the reactions shows User1 as demoting.
    - [ ] Confirm post decreases rank when feed is sorted by "Most Activity"
    
- [ ] As User1, like the User2 Post previously demoted 
    - [ ] Confirm like is highlighted and demote is not highlighted
    - [ ] Confirm likes is incremented by 1 and demotes is decremented by 1.
    - [ ] Confirm clicking on reactions show User1 as liking.
    - [ ] Confirm post increases rank when feed is sorted by "Most Activity".
