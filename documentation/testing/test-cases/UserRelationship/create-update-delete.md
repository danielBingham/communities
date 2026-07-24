## [UserRelationship](documentation/testing/test-cases/UserRelationship/create-update-delete.md)

Cases covering sending friend requests, accepting friend requests, and
rejecting friend requests.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 and User2 are not friends.

#### Cases

- [ ] As a user, I can send a friend request.
    - As User1:
        - Send User2 a friend request.
            - **Confirm request shows on "Friend Requests" view.**
            - **Confirm "Cancel Request" shows on User2's profile.**
    - As User2:
        - **Confirm friend request notification received.**
            - **Confirm request shows on "Friend Requests" view.**
            - **Confirm "Accept" or "Reject" show on User1's profile.**
    - As User1:
        - Cancel the request.
            - **Confirm request removed.**

- [ ] As a user, I can accept a friend request and later remove the friend.
    - As User1:
        - Send User2 a friend request.
    - As User2:
        - Accept the friend request.
            - **Confirm request accepted.**
        - Remove User1 as a friend.
            - **Confirm relationship removed.**

- [ ] As a user, I can reject a friend request.
    - As User1:
        - Send User2 a friend request.
    - As User2:
        - Reject the friend request.
            - **Confirm friend request is removed from profile.**
            - **Confirm friend request is removed from "Friend Requests" view.**

### Manual Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User1 and User2 are not friends.
- [ ] Two browser sessions are available, one logged in as each user.

#### Cases

- [ ] As a user, it doesn't matter which of us removes the friendship.
    - As User1:
        - Send User2 a friend request.
    - As User2:
        - Accept the friend request.
            - **Confirm request accepted.**
    - As User1:
        - Remove User2 as a friend.
            - **Confirm relationship removed.**

- [ ] As a user, I can cancel a friend request I sent.
    - As User1:
        - Send User2 a friend request.
    - As User2:
        - **Confirm friend request visible.**
    - As User1:
        - Cancel the friend request.
            - **Confirm removed.**
    - As User2:
        - **Confirm removed.**

- [ ] As two users, we can simultaneously remove each other without error.
    - As User1:
        - Send User2 a friend request.
    - As User2:
        - Accept the request.
    - As User1 and User2 together:
        - With two browser windows open, one as User1 and one as User2,
          simultaneously remove each other as friends.
            - **Confirm no error occurs and the relationship is removed for both.**

- [ ] As two users, we can simultaneously add each other and the request is auto-approved.
    - As User1 and User2 together:
        - With two browser windows open, one as User1 and one as User2, send
          each other simultaneous friend requests.
            - **Confirm relationship confirmed.**

### Full Regression

#### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created and is a friend of User2 but not of User1.
- [ ] User4 has been created and has not confirmed their email.
- [ ] A site moderator has been created.

The create, update and delete relationship endpoints are not yet covered by
the Integration suite.  The cases below are the manual counterparts of the
`GET /user/:userId/relationship/:relationId` and
`GET /user/:userId/relationships` suites, which cover who may read a
relationship once it exists.

#### The relationship response

- [ ] As a participant, I can read my relationship regardless of path order. (covered: integration)
    - As User1:
        - Send User2 a friend request, then view the relationship.
            - **Confirm the relationship is returned.**
            - **Confirm the direction of the request is reported correctly.**
            - **Confirm the relationship is the same whichever participant is named first in the path.**
    - As User2:
        - View the same relationship.
            - **Confirm the same relationship entity is returned.**
            - **Confirm both participants are included in the returned users.**
            - **Confirm no password is included for either participant.**

- [ ] As an unauthenticated visitor, I cannot read a relationship. (covered: integration)
    - As unauthenticated user:
        - Attempt to read a relationship that does not exist.
            - **Confirm the request is refused.**
        - Attempt to read a relationship that does exist.
            - **Confirm the request is refused.**

- [ ] As a user, a relationship that does not exist is not found. (covered: integration)
    - As User1:
        - Attempt to read a relationship between two real users who have none.
            - **Confirm a not found result.**
        - Attempt to read a relationship where neither id belongs to a user.
            - **Confirm a not found result.**
        - Attempt to read a relationship where only the relation id belongs to no user.
            - **Confirm a not found result.**
        - Attempt to read a relationship where only the user id belongs to no user.
            - **Confirm a not found result.**
        - Attempt to read a relationship between yourself and yourself.
            - **Confirm a not found result.**
        - Delete a relationship and then attempt to read it.
            - **Confirm a not found result.**
        - Attempt to read a relationship using a malformed (non-UUID) id.
            - **Confirm a not found result.**

#### Permissions on a PENDING relationship

- [ ] The requester **can** view a pending relationship. (covered: integration)
- [ ] The requester **can** view a pending relationship with the path parameters reversed. (covered: integration)
- [ ] The recipient **can** view a pending relationship. (covered: integration)
- [ ] The recipient **can** view a pending relationship with the path parameters reversed. (covered: integration)
- [ ] A third party **cannot** view a pending relationship. (covered: integration)
- [ ] A third party **cannot** view a pending relationship with the path parameters reversed. (covered: integration)
- [ ] A site moderator **cannot** view a pending relationship. (covered: integration)
- [ ] A site moderator **cannot** view a pending relationship with the path parameters reversed. (covered: integration)

#### Permissions on a CONFIRMED relationship

- [ ] The requester **can** view a confirmed relationship. (covered: integration)
- [ ] The requester **can** view a confirmed relationship with the path parameters reversed. (covered: integration)
- [ ] The accepter **can** view a confirmed relationship. (covered: integration)
- [ ] The accepter **can** view a confirmed relationship with the path parameters reversed. (covered: integration)
- [ ] A third party **cannot** view a confirmed relationship. (covered: integration)
- [ ] A third party **cannot** view a confirmed relationship with the path parameters reversed. (covered: integration)
- [ ] A friend of one participant **cannot** view a confirmed relationship. (covered: integration)
- [ ] A site moderator **cannot** view a confirmed relationship. (covered: integration)
- [ ] A site moderator **cannot** view a confirmed relationship with the path parameters reversed. (covered: integration)

#### Permissions on a BLOCKED relationship

- [ ] The blocker **is** stored as the relationship's owner. (covered: integration)
- [ ] The blocker **can** view a blocked relationship. (covered: integration)
- [ ] The blocker **can** view a blocked relationship with the path parameters reversed. (covered: integration)
- [ ] The blocked user **cannot** view a blocked relationship. (covered: integration)
- [ ] The blocked user **cannot** view a blocked relationship with the path parameters reversed. (covered: integration)
- [ ] A third party **cannot** view a blocked relationship. (covered: integration)
- [ ] A third party **cannot** view a blocked relationship with the path parameters reversed. (covered: integration)
- [ ] A site moderator **cannot** view a blocked relationship. (covered: integration)
- [ ] A site moderator **cannot** view a blocked relationship with the path parameters reversed. (covered: integration)

#### Replacing a friendship with a block

- [ ] As a user, blocking a friend replaces the friendship. (covered: integration)
    - As User1:
        - Become friends with User2, then block User2.
        - View the relationship with User2.
            - **Confirm a 'blocked' relationship is shown rather than the old friendship.**
    - As User2:
        - Attempt to view the relationship with User1.
            - **Confirm the relationship is hidden.**

#### Unconfirmed users

- [ ] A CONFIRMED recipient **can** view a request sent to them. (covered: integration)
- [ ] An UNCONFIRMED recipient **cannot** view a request sent to them. (covered: integration)
- [ ] An UNCONFIRMED recipient **cannot** view it with the path parameters reversed. (covered: integration)
- [ ] A confirmed requester **can** still view the request they sent. (covered: integration)

#### Existence information leaks

- [ ] As a third party, I cannot tell whether a relationship exists. (covered: integration)
    - As User3:
        - Attempt to read a relationship between User1 and User2 that does not exist.
        - Attempt to read a relationship between User1 and User2 that does exist.
            - **Confirm both attempts give the same not found result.**
        - Repeat for a pending, a confirmed and a blocked relationship.
            - **Confirm all give the same not found result.**
        - Attempt to read a relationship naming users who do not exist.
            - **Confirm the result does not reveal whether the named users exist.**

- [ ] As a blocked user, I am not told that I have been blocked. (covered: integration)
    - As User2 (blocked by User1):
        - Attempt to read the relationship with User1.
            - **Confirm the result does not reveal the block.**

#### The relationship list

- [ ] As a user, my relationship list matches what I can read individually. (covered: integration)
    - As User1:
        - Open the "Friend Requests" and friends views and page through them.
            - **Confirm every relationship shown can also be read individually.**
            - **Confirm no relationship that cannot be read individually appears in the list.**
