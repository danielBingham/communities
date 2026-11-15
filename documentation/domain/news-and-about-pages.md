# News and About Pages

The public pages about Communities: the About pages, and News, the blog
administrators write from the admin dashboard.

## About Pages

`/about/...` are public pages (no login), rendered in the
`FooterlessLayout`. Each is a component in `pages/about/views/`:

| Path | Page |
| ---- | ---- |
| `/about/news` | News. |
| `/about/team` | The team. |
| `/about/faq` | Frequently asked questions. |
| `/about/roadmap` | The roadmap. |
| `/about/contribute` | How to contribute (funding). |
| `/about/tos` | Terms of Service. |
| `/about/privacy` | Privacy policy. |
| `/about/operating-agreement` | The operating agreement. |
| `/about/contact` | Contact. |

Their content is in the components; changing it is a code change.

## News

News is a flat-file CMS: every post is kept in one JSON file in storage,
`news/index.json`, keyed by slug, rather than in the database.

```json
{
    "09-29-2026-protocols-arent-the-answer": {
        "title": "Protocols Aren't the Answer",
        "slug": "09-29-2026-protocols-arent-the-answer",
        "date": "09/29/2026",
        "author": "...",
        "summary": "A sentence or two, for link previews.",
        ...
    }
}
```

| Action | Request | Who |
| ------ | ------- | --- |
| List | `GET /news` | Anyone, logged in or not. |
| Read | `GET /news/:slug` | Anyone. |
| Write | `POST /news`, from `/admin/news/create` | Admins. |
| Edit | `PATCH /news/:slug`, from `/admin/news/:slug/edit` | Admins. |
| Delete | `DELETE /news/:slug` | Admins. |

`NewsService` reads and writes `news/index.json` through the storage
driver; `packages/shared/lib/news.js` makes slugs (from the date and title)
and sorts posts newest first; `NewsSchema` validates them.

Locally, News starts empty; see
[Local Services](../getting-started/local-services.md#news).

## Link Previews for News

`/about/news/:slug` gets its own title, description and image in the page's
`<head>`, so links to a post preview well on other sites, and the post is
preloaded with the page. See [Pages and Metadata](../server/pages-and-metadata.md).

## Where the Code Is

| Layer | Code |
| ----- | ---- |
| Controllers | `web-application/server/controllers/NewsController.js`, `web-application/server/controllers/PageController.js` |
| Service | `packages/backend/services/NewsService.js`, `PageMetadataService.js` |
| Shared | `packages/shared/schema/News.js`, `packages/shared/lib/news.js`, `packages/shared/lib/pageMetadata.js` |
| Client | `web-application/client/state/News/`, `pages/about/`, `pages/admin/views/NewsFormView.js` |
| Tests | `web-application/test/integration/suites/NewsController/`, `web-application/test/integration/suites/PageController/`, `packages/backend/test/services/NewsService.spec.js` |
