# Styling

How the client is styled: plain CSS, one file per component, with shared
variables for the palette.

**Code:** `web-application/client/app.css`, the `.css` file beside each
component

## The Approach

- **Plain CSS**, no framework or preprocessor. Webpack bundles it
  (`css-loader`, `style-loader`), so a component's styles load with it.
- **One stylesheet per component**, beside it, imported by it:
  `import './Post.css'`.
- **Class names are kebab-case and BEM-style:** the component's block
  (`.post`), its elements (`.post__header`, `.post__loading`), and
  modifiers as extra classes (`.post.shared`). Scope every rule under the
  block, so components don't leak styles into each other.
- **Global styles only in `app.css`**: element defaults, fonts, and the
  variables below.

## Variables

`app.css` defines the palette and common values as CSS variables on
`:root`, in families with a range from `-lightest` to `-darkest`:

| Family | Example | For |
| ------ | ------- | --- |
| `--primary-color-*` | `var(--primary-color-main)` | The blue that runs through the app: links, primary buttons, highlights. |
| `--secondary-color-*` | `var(--secondary-color-main)` | The orange accent. |
| `--danger-color-*` | `var(--danger-color-main)` | Destructive actions and errors. |
| `--main-border-color` and others | | Borders, backgrounds and text. |

Use the variables rather than color codes, and add one to `app.css` when
you need a value more than one component shares. (`color-scheme.css` is an
old palette export that nothing imports.)

## Responsive Layout

The same CSS serves desktop browsers, phone browsers and the apps. The
breakpoints in use:

| Width | Layout |
| ----- | ------ |
| Below 700px | Phone: one column, the mobile header and menus. |
| 700px to 1220px | Tablet and small desktop. |
| 1220px and up (1600px for wide) | Desktop: side menus beside the content. |

Write them as range media queries, like the rest of the code:
`@media (width < 700px) { ... }`.

## The Apps

`index.js` adds the platform (`ios` or `android`) as a class on `<body>`,
so styles can adjust for the apps: `.ios header { ... }`. The `DeviceTweaks`
components add the space the system UI needs. The apps also honor the
device's text size: `App` reads it with Capacitor's `TextZoom` and keeps it
in the `system` slice.

## Dark Mode

There isn't one yet.
