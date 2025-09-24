## [UserRelationship](documentation/testing/test-cases/UserRelationship/create-update-delete.md)

Cases covering sending friend requests, accepting friend requests, and
rejecting friend requests.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 and User2 are not friends.

### Cases

- [ ] Users can send friend requests.
    - [ ] As User1, send User2 a friend request.
        - [ ] As User1, confirm request shows on "Friend Requests" view.
        - [ ] As User2, confirm friend request notification.
        - [ ] As User2, confirm request shows on "Friend Requests" view.
        - [ ] As User1, confirm "Cancel Request" shows on User2's profile.
        - [ ] As User2, confirm "Accept" or "Reject" show on User1's profile.
    - [] As User1, cancel the request.

- [ ] Users can reject friend requests.
    - [ ] As User1, send User2 a friend request.
    - [ ] As User2, reject the friend request.
    - [ ] As User2, confirm friend request is removed from profile.
    - [ ] As User2, confirm friend request is removed from "Friend Requests" view.

- [ ] Users can remove friends.
    - [ ] As User1, send User2 a friend request.
    - [ ] As User2, accept the friend request. Confirm request accepted.
    - [ ] As User2, remove User1 as a friend. Confirm request removed.

- [ ] It doesn't matter which user (requester or accepter) removes the request.
    - [ ] As User1, send User2 a friend request.
    - [ ] As User2, accept the friend request. Confirm request accepted.
    - [ ] As User1, remove User2 as a friend. Confirm request removed.

- [ ] Users can cancel friend requests they send.
    - [ ] As User1, send User2 a friend request.
    - [ ] As User2, confirm friend request visible.
    - [ ] As User1, cancel the friend request. Confirm removed.
    - [ ] As User2, confirm removed.

- [ ] Users can simultaneously remove each other without error.
    - [ ] As User1, send User2 a friend request.
    - [ ] As User2, accept the request.
    - [ ] With two browser windows open, one As User1 and one As User2,
         simultaneously remove each other as friends.

- [ ] Users can simultaneously add each other as friends and the request will
     be auto-approved.
    - [ ] With two browser windows open, one As User2 and one As User1, have User1
         and User2 send each other simultaneous friend requests.  Confirm relationship
         confirmed.
