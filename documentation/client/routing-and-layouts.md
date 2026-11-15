# Routing and Layouts

How routes are declared, which layout each renders in, and how a user is
sent through the onboarding gates.

**Code:** `web-application/client/App.js`, `web-application/client/layouts/`,
`web-application/client/lib/hooks/useAuthentication.js`

## Routes

Every route is in `App.js`, with React Router, nested under the layout it
renders in:

| Layout | Renders | Routes |
| ------ | ------- | ------ |
| `RootLayout` | Nothing of its own: wraps everything, and runs app-wide hooks (`useVersion`, `useNativeDeepLinks`, `useScrollRestoration`). | All of them. |
| `HeaderlessLayout` | The page alone. | Flows a user must finish first: `/email-confirmation`, `/accept-invitation`, `/reset-password`, `/accept-terms-of-service`, `/set-contribution`, `/age-gate`. |
| `FooterlessLayout` | Header, no footer. | Public pages: `/login`, `/register`, `/reset-password-request`, `/about/...` (News, team, FAQ, terms, privacy, ...). |
| `AuthenticatedLayout` | Header, page, footer, for logged-in users. | Everything else: the home feed, `/account/...`, `/admin/...`, `/friends/...`, `/groups/...`, `/group/:slug/...`, `/create`, and profiles and posts at `/:slug` and `/:slug/:postId`. |

`AuthenticatedLayout` shows the login page to a logged-out user, and the
multi-factor page to one who's given their password but not their code.
It also shows the welcome notice, over any page, until it's been seen.

`/:slug` (a user's profile) is last, so every fixed path wins over it.

## Onboarding Gates

`useAuthentication()`, used by `AuthenticatedLayout`, sends the current user
to finish what they haven't:

| Condition | Sent to |
| --------- | ------- |
| A stored birthdate under 18. | `/age-gate` |
| `status` is `invited`. | `/accept-invitation` |
| `status` is `unconfirmed`. | `/email-confirmation` |
| Hasn't accepted the Terms of Service (`notices.termsOfService`). | `/accept-terms-of-service` |

Once a user passes the age check, the client clears their stored
birthdate. The flows are in
[Registration and Onboarding](../domain/registration-and-onboarding.md).

## Adding a Page

See [Add a Page](../how-to/add-a-page.md). In short: a component in
`pages/`, a `<Route>` in `App.js` under the right layout, and, if the page
is public and should have its own link preview, a route in the server's
page router with the same path.

## Navigation State

| Hook | Does |
| ---- | ---- |
| `useHistoryTracking` | Records where the user has been in the `history` slice. |
| `useBackPoint` | Lets a page return the user to where they came from. |
| `useScrollRestoration` | Restores the scroll position when going back. |
| `useNativeDeepLinks` | Opens links to the site in the apps, at the right route. |
