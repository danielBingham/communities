## [Delete Post](documentation/testing/test-cases/Post/delete.md)

Test cases related to deleting posts.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created and is friends with User1.

### Cases

- [ ] Users can delete private posts with images.
    1. As User1, create a private post with an image.
    2. As User2, comment and react to the post.
    3. As User1, delete the post.
    4. As User1, attempt to view the post. Confirm its gone.
    5. As User2, attempt to view the post. Confirm its gone.

- [ ] Users can delete private posts with links. 
    1. As User1, create a private post with a link.
    2. As User2, comment and react to the post.
    3. As User1, delete the post.
    4. As User1, attempt to view the post. Confirm its gone.
    5. As User2, attempt to view the post. Confirm its gone.

- [ ] Users can delete public posts with images that have been shared. 
    1. As User1, create a public post with an image.
    2. As User2, comment and react to the post.
    3. As User2, share the post.
    4. As User1, delete the post.
    5. As User1, attempt to view the post. Confirm its gone.
    6. As User2, attempt to view the post. Confirm its gone.

- [ ] Users can delete public posts with links that have been shared. 
    1. As User1, create a public post with a link.
    2. As User2, comment and react to the post.
    3. As User2, share the post.
    4. As User1, delete the post.
    5. As User1, attempt to view the post. Confirm its gone.
    6. As User2, attempt to view the post. Confirm its gone.
