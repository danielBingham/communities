# Shared Helpers

The helpers in `@communities/shared` that both the server and client use:
`lib` and `util`.

**Code:** `packages/shared/lib/`, `packages/shared/util/`

| Module | Exports | Used for |
| ------ | ------- | -------- |
| `lib.mentions` | `parseMentions()` | Finding `@username` mentions in post and comment text: the server notifies the mentioned users, and the comment form checks them. |
| `lib.date` | `coerceDateFormat()`, `coerceDateSegmentFormat()`, `isLeapYear()`, `getDaysInMonth()`, `getAgeFromDate()`, `parseUSDate()` | Birthdates: parsing and normalizing what's typed in the age gate and registration, and working out ages. |
| `lib.news` | `slugify()`, `generateNewsSlug()`, `getNewsDateSortKey()`, `sortNewsByDateDescending()` | News posts' slugs and ordering. |
| `lib.pageMetadata` | `buildDefaultMetadata()`, `buildRootMetadata()`, `buildNewsListMetadata()`, `buildNewsMetadata()`, and helpers | Each page's title, description and link preview, which `PageMetadataService` renders into the page. See [Pages and Metadata](../server/pages-and-metadata.md). |
| `lib.preloadedEntities` | Reading and writing preloaded entities | The entities the server sends inside a page (as a `<script type="application/json" id="communities-preloaded-entities">`, shaped like a response's `relations`), which the client loads into its state at startup. |
| `util` | `objectHas(object, property)` | Checking a property is present and not `undefined`. |

## What Belongs Here

Code goes in `packages/shared` when it must behave identically in the
browser and on the server: rules (permissions, validation), parsing
(mentions, dates) and formats both sides read and write (preloaded
entities, page metadata).

It can't use Node-only modules or anything browser-only, and has no
dependencies on the other packages. Its tests are in
`packages/shared/test/`, run with `npm test -w packages/shared`.
