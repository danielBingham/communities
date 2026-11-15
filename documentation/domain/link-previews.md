# Link Previews

The cards shown for links in posts: how they're made, safely, and reused.

## How One Is Made

1. **The client notices a link.** As someone writes a post, the post form
   finds links in the content (skipping any they've dismissed), or they
   add one with the link form.
2. **It asks for a preview:** `POST /link-previews` with the `url`.
3. **The server reuses or fetches.** If `link_previews` already has a
   preview for that exact URL, it returns it. Otherwise
   `LinkPreviewService.getPreview()` fetches the page and builds one:
   - with [linkpeek](https://www.npmjs.com/package/linkpeek) and its quality
     preset, which reads the page's Open Graph, Twitter and HTML metadata;
   - as `CommunitiesBot-LinkExpanding 1.0 (+https://communities.social)`;
   - through `ssrf-safe-fetch`, which resolves the host and refuses private
     and internal addresses at connection time, so a link can't be used to
     reach anything inside our network.
4. **It's cleaned, validated and saved** in `link_previews` (`url`,
   `title`, `type`, `site_name`, `description`, `image_url`), and returned.
5. **The post** keeps its id in `posts.link_preview_id`.

A page that answers 404 or 403, or can't be fetched, gives an error the
form shows; the post can still be made without a preview.

## Showing One

`components/links/view/LinkPreview` shows the title, site, description and
image. The image is loaded from the site's own `image_url` (the CSP allows
any `https:` image for this). Older previews have their image saved as a
File (`file_id`), which is shown instead.

YouTube links (`youtube.com`, `youtu.be`) are shown as embedded players.

## Things to Know

- **Previews are never refreshed.** Once a URL has a preview, it's reused
  as it was.
- **Previews are shared** across everyone who posts the same URL, so
  they're visible to everyone.
- **The integration and end-to-end tests** post links to Communities' own
  News page, which reliably has a preview.

## Where the Code Is

| Layer | Code |
| ----- | ---- |
| Controller | `web-application/server/controllers/LinkPreviewController.js` |
| Service | `packages/backend/services/LinkPreviewService.js`, `packages/backend/lib/ssrf-safe-fetch.js` |
| Data | `packages/backend/daos/LinkPreviewDAO.js`, the `link_previews` table |
| Cleaning and validation | `packages/shared/cleaning/entities/LinkPreview.js`, `packages/shared/validation/entities/LinkPreview.js`, `packages/backend/services/validation/LinkPreviewValidation.js` |
| Client | `web-application/client/state/LinkPreview/`, `components/links/`, `components/posts/PostForm/PostLinkPreviewAttachment/` |
| Tests | `web-application/test/lib/linkPreviews.js`, `web-application/test/e2e/suites/Post/` |
