# Pages and Metadata

How the server answers requests for pages: every page is the client's
`index.html`, with that page's title and link preview tags rendered in,
and optionally the entities it shows preloaded.

**Code:** `web-application/server/pages.js`,
`web-application/server/controllers/PageController.js`,
`packages/backend/services/PageMetadataService.js`,
`packages/shared/lib/pageMetadata.js`, `web-application/server/views/index.html`,
`web-application/client/state/lib/preloadedEntities.js`

## How a Page Is Served

1. Any request that isn't for the API or a static file reaches the page
   router (`pages.js`).
2. `PageController` reads `public/dist/index.html`, which webpack built
   from `server/views/index.html`, and splits it at the markers
   `<!--! page-metadata:start -->` and `<!--! page-metadata:end -->`.
3. It renders the page's metadata (title, description, Open Graph and
   Twitter tags) between the markers with `PageMetadataService`.
4. For pages that show an entity, it adds a `<script>` with the entity
   preloaded, which the client puts in its state before it renders, so it
   doesn't request it again.
5. The client's router decides what's on the page.

If reading the entity fails or takes too long, the page gets the default
metadata and nothing preloaded, and the client loads as usual.

## Pages with Their Own Metadata

| Route | Metadata |
| ----- | -------- |
| `/` | The home page's. |
| `/about/news` | The News list's. |
| `/about/news/:slug` | The News post's title, summary and image, and the post preloaded. |
| Everything else | The default. |

Pages that read from storage or the database are rate limited like the API
requests they stand in for.

## Giving a Page Its Own Metadata

1. Add a builder for its metadata to `lib.pageMetadata` in
   `packages/shared` (so it can be tested without the server).
2. Add a method to `PageMetadataService` that uses it.
3. Add a method to `PageController` that loads what it needs and renders the
   page with that metadata (and preloads the entity, if it read one).
4. Add a route to `pages.js` with the same path as the client's route in
   `client/App.js`, with a rate limit if it reads anything.
5. Add an integration test under `test/integration/suites/PageController/`.

## Development

The webpack dev server writes its builds to `public/dist`, so Express
serves the same `index.html` with metadata in development. Bundle names
change with each rebuild, so in development `PageController` reads
`index.html` again rather than caching it.
