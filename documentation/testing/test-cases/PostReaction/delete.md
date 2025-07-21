# Delete PostReaction

Cases covering removing reactions from Posts.

## Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and has created at least three posts.
- [ ] User1 has reacted to each of User2's posts.

## Cases

- [ ] As User1, unlike one of User2's Posts.
    - [ ] Confirm like unhighlighted and "likes" is decremented by 1.
    - [ ] Confirm clicking on the reactions doesn't show User1 as liking.
    - [ ] Confirm post decreases rank when feed is sorted by "Most Activity"
    
- [ ] As User1, remove a dislike from a second one of User2's Posts.
    - [ ] Confirm dislike is not highlighted and "dislikes" is decremented by 1.
    - [ ] Confirm clicking on the reactions does not show User1 as disliking.
    - [ ] Confirm post decreases rank when feed is sorted by "Most Activity"
    
- [ ] As User1, remove a demote from a third one of User2's Posts.
    - [ ] Confirm demote is not highlighted and "demotes" is decremented by 1.
    - [ ] Confirm clicking on reactions does not show User1 as demoting.
    - [ ] Confirm post increaess rank when feed is sorted by "Most Activity".
