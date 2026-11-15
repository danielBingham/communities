# Code Style

How our JavaScript is written. No linter or formatter is configured, so this
page is the reference: match it, and match the file you're in.

## Formatting

| Rule | Example |
| ---- | ------- |
| 4-space indentation. | |
| No semicolons. | `const post = await this.postDAO.getPostById(id)` |
| Single quotes; template literals when interpolating. | `` `Post(${id}) not found.` `` |
| Spaces inside the parentheses of `if`, `while` and `for` conditions. | `if ( ! currentUser ) {` |
| Opening braces on the same line. | `} else {` |
| Long conditions broken before the operator. | `if ( post.visibility === 'public'`<br>`    && post.type === 'feed' ) {` |

A handful of older files use 2-space indentation (`web-application/server/wsServer.js`,
`web-application/server/bin/www`); keep to whatever a file already uses.

## Functions and Classes

- **Named functions are `const` assignments of `function` expressions**,
  not arrow functions: `const createRouter = function(core) { ... }`.
  Arrow functions are for short callbacks:
  `results.list.map((id) => results.dictionary[id])`.
- **DAOs, services, controllers, validators, permission classes and
  migrations are classes**, constructed with `core`, exported with
  `module.exports = class PostDAO extends DAO { ... }`.
- **`async`/`await`**, not promise chains, except where the code needs the
  promise itself.

## Modules

| Where | Module system | Imports |
| ----- | ------------- | ------- |
| `packages/`, `web-application/server/`, `worker/`, tests | CommonJS | `const { Core } = require('@communities/backend')` |
| `web-application/client/` | ES modules, built by webpack | `import { usePost } from '/lib/hooks/Post'`: paths from the client's root start with `/`. |

The client's root alias is set in `web-application/webpack.config.js` and
mirrored for Jest in `web-application/package.json`.

## Comments

- **A JSDoc block on every public method and exported function**: what it
  does, `@param`, `@return`, and `@throws` where it throws.
- **Comments say why**: the reason, the constraint, the bug it avoids. The
  code already says what.
- **Big files are divided** with banner comments
  (`// ==================== Static Asset Requests ====================`).
- **`TECHDEBT`** marks a known shortcut, with what a better design would be.

## License Header

Every new source file (JavaScript, CSS, SQL) starts with the AGPL header:

```
/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media
 *  Copyright (C) 2022 - 2024 Daniel Bingham
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
```

Copy it from a neighboring file. Many older client files are missing it;
add it when you're changing one anyway.

## CSS

Each component has its own CSS file beside it, imported by the component.
Class names are kebab-case, with BEM-style elements: a block (`.post`), its
elements (`.post__header`), and modifiers as extra classes
(`.post.shared`). See [Styling](../client/styling.md).

## Naming

See [Naming](naming.md).
