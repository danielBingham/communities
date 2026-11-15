# Components

How components are organized and written, and the UI kit to build them
from.

**Code:** `web-application/client/components/`,
`web-application/client/pages/`

## Organization

| Path | What's there |
| ---- | ------------ |
| `components/<domain>/` | Components for one area of the product: `posts/`, `groups/`, `users/`, `friends/`, `files/`, `links/`, `notifications/`, `feeds/`, `admin/`, `authentication/`, `header/`, `notices/`, `about/`, `contribution/`, `errors/`, `Mutuals/`. Subfolders group a domain's components by purpose (`groups/form/`, `groups/view/`). |
| `components/ui/` | The UI kit: generic controls with no knowledge of the product. |
| `components/generic/` | Larger generic building blocks: `Page`, `modal`, `tabbed-box`, `text-box`, `timeline`, `toggle`. |
| `components/*.js` | A few small shared components at the top level: `Spinner`, `DateTag`, `AreYouSure`, `PaginationControls`, `ProgressBar`. |
| `pages/` | One component per route, composing components. See [Routing and Layouts](routing-and-layouts.md). |

## One Folder per Component

Newer components get a folder with the component, its CSS and an index:

```
components/posts/Post/
├── Post.js         the component (default export)
├── Post.css        its styles, imported by Post.js
├── index.js        export { default } from './Post'
├── PostComments/   components only Post uses, nested
└── PostReactions/
```

Import it by the folder: `import Post from '/components/posts/Post'`.
Older components are a `.js` and `.css` pair side by side; leave them unless
you're changing them anyway.

## Writing a Component

- **Function components with hooks**, written as
  `const Post = function({ id }) { ... }` and exported as the default.
- **Get data from hooks** (`usePost(id)`), not by dispatching thunks or
  selecting directly from the store, so loading and cleanup work the same
  everywhere. See [Hooks](hooks.md).
- **Handle every state**: a `Spinner` while the request is pending, a
  `RequestError` (or the 404 component) when it fails, then the content.
- **Check permissions with `can()`** to decide what to offer, never to
  protect anything. See [Shared Permissions](../shared/permissions.md).
- **Accessible names:** buttons and links have text or an `aria-label`, so
  people using screen readers can use them, and the end-to-end tests can
  find them by role and name.
- **Icons** come from [Heroicons](https://heroicons.com/)
  (`@heroicons/react/24/solid`, `/24/outline`, `/16/solid`).

## The UI Kit

`components/ui/` has the controls to build forms and pages from. Use them
rather than styling raw elements, so the app stays consistent.

| Component | For |
| --------- | --- |
| `Button` | Every button. `type` picks its style (`primary`, `warn`, or the default). |
| `Input`, `TextBox`, `Checkbox`, `Radio`, `Slider` | Form fields, with labels, explanations and errors. |
| `Card`, `Alert`, `Table`, `List` | Containers for content and messages. |
| `DotsMenu`, `DropdownMenu`, `NavigationMenu`, `Breadcrumbs` | Menus and navigation. |
| `Image`, `Video` | Showing stored files, with their variants. |
| `Refresher` | Pull to refresh. |
| `DeviceTweaks` | Spacing the apps need around the system UI (`IosBuffer`, `AndroidBuffer`). |

For text with mentions and links, use `components/posts/TextWithMentions`
and `TextAreaWithMentions`, which render user content safely.

## Styling

See [Styling](styling.md).
