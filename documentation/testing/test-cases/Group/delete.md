## [Delete Group](documentation/testing/test-cases/Group/delete.md)

Cases covering group deletion.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created.
- [ ] User4 has been created.
- [ ] A Group has been created with User1 as admin, User2 as moderator, and
      User3 as member, and User4 as non-member.
- [ ] User5 has been created and has been banned from the Group.
- [ ] A site moderator has been created.
- [ ] A second Group has been created with User1 as admin, containing posts,
      comments, reactions and a subgroup tree.

### Smoke Test

- [ ] As a group admin, I can delete a group and all of its content goes with it.
    - As User1:
        - Create a post in the Group and have User3 comment on and react to it.
        - Go to Group -> Settings -> Delete Group and confirm the deletion.
            - **Confirm the group is deleted.**
        - Attempt to visit the group.
            - **Confirm a not found page renders.**
    - As User3:
        - Attempt to visit the group and the post permalink.
            - **Confirm both are gone.**

- [ ] A group moderator **cannot** delete the group. (covered: integration)
- [ ] A plain member **cannot** delete the group. (covered: integration)
- [ ] A non-member **cannot** delete the group. (covered: integration)

### Manual Regression

- [ ] As a group admin, deleting a group asks me to confirm first.
    - As User1:
        - Go to Group -> Settings -> Delete Group.
            - **Confirm a confirmation prompt is shown.**
        - Cancel the prompt.
            - **Confirm the group still exists.**

- [ ] As a group admin, deleting a group removes it from my Groups list and my feed.
    - As User1:
        - Note a post from the Group in your feed.
        - Delete the Group.
            - **Confirm the group no longer appears in your Groups list.**
            - **Confirm the group's posts no longer appear in your feed.**

### Full Regression

#### Authentication and existence

- [ ] As an unauthenticated visitor, I cannot delete a group. (covered: integration)
    - As unauthenticated user:
        - Attempt to delete the Group.
            - **Confirm the request is refused before the id is validated.**

- [ ] As a user, a malformed or missing group is rejected. (covered: integration)
    - As User1:
        - Attempt to delete a non-UUID id.
            - **Confirm the request is refused with a validation error.**
        - Attempt to delete an empty-ish id.
            - **Confirm the request is refused with a validation error.**
            - **Confirm the id is validated before existence is checked.**
        - Attempt to delete a group that doesn't exist.
            - **Confirm a not found result.**
        - Delete a group, then attempt to delete it again.
            - **Confirm a not found result.**

#### Permissions on an OPEN group

- [ ] The creating admin **can** delete the group. (covered: integration)
- [ ] A second admin **can** delete the group. (covered: integration)
- [ ] A site moderator **can** delete the group. (covered: integration)
- [ ] A group moderator **cannot** delete the group. (covered: integration)
- [ ] A plain member **cannot** delete the group. (covered: integration)
- [ ] A pending-invited user **cannot** delete the group. (covered: integration)
- [ ] A non-member **cannot** delete the group. (covered: integration)
- [ ] A banned member **cannot** delete the group, and is told it is not found rather than forbidden. (covered: integration)
- [ ] The group **is** left intact after a refused delete. (covered: integration)

#### Permissions on a PRIVATE group

- [ ] The admin **can** delete the group. (covered: integration)
- [ ] A member **cannot** delete the group. (covered: integration)
- [ ] A non-member **cannot** delete the group. (covered: integration)
- [ ] A banned member **cannot** delete the group, and is told it is not found. (covered: integration)
- [ ] The group **is** left intact after a refused delete. (covered: integration)

#### Permissions on a HIDDEN group

- [ ] The admin **can** delete the group. (covered: integration)
- [ ] A site moderator **can** delete the group. (covered: integration)
- [ ] A member **cannot** delete the group. (covered: integration)
- [ ] A pending-invited user **cannot** delete the group, and is told it is forbidden because they may view it. (covered: integration)
- [ ] A non-member **cannot** delete the group, and is told it is not found because they may not view it. (covered: integration)
- [ ] A banned member **cannot** delete the group, and is told it is not found. (covered: integration)
- [ ] The group **is** left intact after a refused delete. (covered: integration)

#### Subgroups

- [ ] A subgroup's own admin **can** delete it. (covered: integration)
- [ ] An admin of the parent **can** delete the subgroup. (covered: integration)
- [ ] A plain member of the parent **cannot** delete the subgroup. (covered: integration)
- [ ] A non-member **cannot** delete the subgroup. (covered: integration)
- [ ] The parent **is** left intact when a subgroup is deleted. (covered: integration)
- [ ] The subgroup **is** left intact after a refused delete. (covered: integration)
- [ ] For a HIDDEN-OPEN subgroup, a member of the parent **cannot** delete it, and is told it is forbidden because they may view it. (covered: integration)
- [ ] For a HIDDEN-OPEN subgroup, a non-member of the parent **cannot** delete it, and is told it is not found. (covered: integration)

#### Inheritance stops at one level

- [ ] An admin of the grandparent **cannot** delete the grandchild. (covered: integration)
- [ ] An admin of the grandparent **can** delete the immediate child. (covered: integration)
- [ ] A grandparent admin **can** delete a grandchild once they join the parent as an admin. (covered: integration)

#### Cascades

- [ ] As a group admin, deleting a fully populated group removes all of its content. (covered: integration)
    - As User1:
        - Delete a group that has members, posts, comments and reactions.
            - **Confirm the group itself is removed.**
            - **Confirm the group's members are removed.**
            - **Confirm the group's subscription is removed.**
            - **Confirm the group's posts are removed.**
            - **Confirm the comments on those posts are removed.**
            - **Confirm the group's slug is freed for reuse.**

- [ ] As a group admin, deleting a parent deletes its whole subgroup tree. (covered: integration)
    - As User1:
        - Delete a parent group that has a tree of subgroups beneath it.
            - **Confirm the whole subgroup tree is deleted with the parent.**
            - **Confirm the posts belonging to every group in the tree are deleted.**

- [ ] As a group admin, deleting a subgroup leaves the rest of the tree intact. (covered: integration)
    - As User1:
        - Delete a single subgroup from a tree.
            - **Confirm the parent, its sibling and their posts are untouched.**

- [ ] As a group admin, deleting a group does not touch unrelated data. (covered: integration)
    - As User1:
        - Delete a group.
            - **Confirm the owner's other groups are untouched.**
            - **Confirm posts in other groups are untouched.**
            - **Confirm the owner's feed posts are untouched.**
            - **Confirm memberships in other groups are untouched.**

#### Response

- [ ] As a group admin, a successful delete returns the deleted entity. (covered: integration)
    - As User1:
        - Delete a group.
            - **Confirm the deleted entity and its relations are returned.**
