# Add a Page

How to add a page to the client, and give it its own title and link
preview if it's public. See [Routing and Layouts](../client/routing-and-layouts.md).

## 1. The Component

Create it in `web-application/client/pages/<area>/`: `ThingPage.js` and
`ThingPage.css` (or a folder for a page with several views, like
`pages/admin/views/`).

- [ ] Compose components; keep data fetching in hooks. See
      [Components](../client/components.md).
- [ ] Handle loading and errors: a `Spinner` while pending, `RequestError`
      or `Error404` when a request fails.
- [ ] Hide anything behind a feature flag with `useFeature()`.

## 2. The Route

In `web-application/client/App.js`, add a `<Route>` under the layout it
belongs in:

| Layout | For |
| ------ | --- |
| `AuthenticatedLayout` | Pages for logged-in users (most pages). |
| `FooterlessLayout` | Public pages: login, registration, About. |
| `HeaderlessLayout` | Flows a user must finish first. |

Put fixed paths before `/:slug`, which matches any username.

Link to it with React Router's `<Link>` or `NavLink`, and add it to a menu
if people should find it there (`components/header/`,
`components/feeds/menu/`, a navigation menu).

## 3. Its Own Metadata (Public Pages)

Every page is served as `index.html` with the default title and link
preview. For a public page that should have its own (because people will
share links to it), add a route on the server with the same path; see
[Pages and Metadata](../server/pages-and-metadata.md#giving-a-page-its-own-metadata).

## 4. Tests

- [ ] Manual test cases for what the page does.
- [ ] End-to-end tests for the cases that can be automated. See
      [Writing End-to-End Tests](../testing/writing-e2e-tests.md).
