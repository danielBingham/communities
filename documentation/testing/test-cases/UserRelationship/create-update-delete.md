## [UserRelationship](documentation/testing/test-cases/UserRelationship/create-update-delete.md)

Cases covering sending friend requests, accepting friend requests, and
rejecting friend requests.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 and User2 are not friends.

### Cases

- [ ] Users can send friend requests.
    1. As User1, send User2 a friend request.
        1. Confirm request shows on "Friend Requests" view.
        2. Confirm "Cancel Request" shows on User2's profile.
    2. As User2, confirm friend request notification.
        1. Confirm request shows on "Friend Requests" view.
        2. Confirm "Accept" or "Reject" show on User1's profile.
    5. As User1, cancel the request.

- [ ] Users can reject friend requests.
    1. As User1, send User2 a friend request.
    2. As User2, reject the friend request.
        1. Confirm friend request is removed from profile.
        2. Confirm friend request is removed from "Friend Requests" view.

- [ ] Users can remove friends.
    1. As User1, send User2 a friend request.
    2. As User2, accept the friend request. 
        1. Confirm request accepted.
        1. Remove User1 as a friend. 
        2. Confirm request removed.

- [ ] It doesn't matter which user (requester or accepter) removes the request.
    1. As User1, send User2 a friend request.
    2. As User2, accept the friend request. 
        1. Confirm request accepted.
    3. As User1, remove User2 as a friend. 
        1. Confirm request removed.

- [ ] Users can cancel friend requests they send.
    1. As User1, send User2 a friend request.
    2. As User2, confirm friend request visible.
    3. As User1, cancel the friend request. Confirm removed.
    4. As User2, confirm removed.

- [ ] Users can simultaneously remove each other without error.
    1. As User1, send User2 a friend request.
    2. As User2, accept the request.
    3. With two browser windows open, one As User1 and one As User2,
         simultaneously remove each other as friends.

- [ ] Users can simultaneously add each other as friends and the request will
     be auto-approved.
    1. With two browser windows open, one As User2 and one As User1, have User1
         and User2 send each other simultaneous friend requests.
         1. Confirm relationship confirmed.
