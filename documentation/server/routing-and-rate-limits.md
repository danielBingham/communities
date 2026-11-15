# Routing and Rate Limits

How API routes are declared, named and limited.

**Code:** `web-application/server/router.js`,
`web-application/server/middleware/rateLimit.js`,
`web-application/server/middleware/upload.js`

## Declaring a Route

`router.js` is one file with every API route, grouped by controller under
banner comments. Each group creates its controller once, then declares its
routes:

```javascript
const PostController = require('./controllers/PostController')
const postController = new PostController(core)

router.get('/posts', rateLimit(core, 4800), function(request, response, next) {
    postController.getPosts(request, response).catch(function(error) {
        next(error)
    })
})
```

Every route:

- **has a rate limit**, as the first middleware;
- **calls one controller method**, named for the HTTP verb and resource;
- **passes errors to `next()`**, so the error middleware answers. Controller
  methods are `async`, and Express doesn't catch their rejections itself.

## Route Shapes

| Shape | Method | Controller method |
| ----- | ------ | ----------------- |
| `/posts` | `GET` | `getPosts`: query, with filters in the query string. |
| `/posts` | `POST` | `postPosts`: create. |
| `/post/:id` | `GET` | `getPost`: one. |
| `/post/:id` | `PATCH` | `patchPost`: partial update. |
| `/post/:id` | `DELETE` | `deletePost` |
| `/post/:postId/comments` | `GET`, `POST` | Children are nested under their parent. |
| `/post/:postId/comment/:id` | `GET`, `PATCH`, `DELETE` | |

There's no `PUT`: updates are partial `PATCH`es. Admin routes live under
`/admin/`, and the test routes under `/test/` exist only in development and
staging (see [The Shared Test Library](../testing/test-library.md#the-test-endpoints)).

## Rate Limits

`rateLimit(core, limit)` allows `limit` requests per minute, per IP
address, per route and method. It keeps a timestamped list of recent
requests in Redis, under `web-application:<route>:<method>:requests:<ip>`,
and answers 429 `too-many-requests` when there are more than `limit` in the
last minute.

Sizes in use:

| Limit | For |
| ----- | --- |
| 2400 to 4800 | Reads the client makes constantly: queries, single entities, initialization. |
| 120 to 240 | Frequent small writes (reactions, notifications, client logs). |
| 60 | Ordinary writes. |
| 30 | Writes that are expensive or abusable: creating posts and comments, uploads, deleting, logging in. |
| 15 to 20 | The most sensitive: changing or ending a session, tokens (email confirmation, password reset), creating groups. |

Pick the size from the closest existing route.

The `test` platform skips rate limits in development and staging, so the
integration tests aren't throttled. Pages that read from storage or the
database are rate limited too (`pages.js`).

## Uploads

Upload routes add a multer middleware after the rate limit:
`createImageUploadMiddleware()` or `createVideoUploadMiddleware()`. They
write the file to the app's `tmp/` folder under a random name, refuse types
and extensions the `ImageService` and `VideoService` don't support, and cap
the size (30 MB for images, 700 MB for video). The controller takes it from there; see
[Files and Media](../domain/files-and-media.md).
