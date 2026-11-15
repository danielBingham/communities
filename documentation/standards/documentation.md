# Documentation

How the documentation in `documentation/` is organized and written, so it
stays easy to find your way through, and cheap to read only what you need.

## How It's Organized

`documentation/README.md` is the top index. Each directory has its own
`README.md` index. A reader goes from the top index to a directory index to
one file, and stops there.

| Directory | Holds | Example |
| --------- | ----- | ------- |
| `getting-started/` | Setting up and running locally. | `running-with-docker.md` |
| `architecture/` | How the components work together: flows across them, without code-level detail. | `request-lifecycle.md` |
| `server/`, `backend/`, `shared/`, `client/`, `worker/`, `database/`, `mobile/` | One per code directory: its structure, patterns and conventions, at code level. | `backend/daos.md` |
| `domain/` | Each product feature end to end, and where its code is in every layer. | `domain/groups.md` |
| `standards/` | Rules that apply everywhere. | `standards/naming.md` |
| `how-to/` | Step-by-step recipes for common changes, linking to the rest. | `how-to/add-a-worker-job.md` |
| `testing/` | The test suites: running and writing them, and the manual test cases. | `testing/e2e-tests.md` |
| `api/` | The API reference. | |

Each fact has one home. If you're not sure where something goes, ask: is it
a rule (standards), a recipe (how-to), how one piece of code works
(component directory), how pieces work together (architecture), or how a
feature behaves (domain)?

## Rules for Writing

1. **One subject per file**, about 50 to 150 lines. Split anything a reader
   would look up separately.
2. **Indexes route.** Every directory's `README.md` lists every file in it,
   with one line saying when to read it. Add the line when you add the file.
3. **Open with what the file covers**, in a sentence or two, then a
   **Code:** line with the paths it describes, from the repository root.
4. **Link, don't repeat.** If another file already explains something, link
   to it.
5. **Facts over prose.** Tables for names, settings and comparisons. Exact
   identifiers in backticks: `PostDAO`, `feat-268-comment-reactions`,
   `web-application/server/router.js`.
6. **Paths, not line numbers.** Line numbers go stale with every change.
7. **Say what the code does now**, not its history. Mention history only
   when it explains something that would otherwise look wrong.
8. **The infrastructure repository is private.** Say when something is
   handled there; don't link to it or give paths in it.
9. **Write for contributors**: plain, present tense, "you".

## Keeping It Current

Documentation changes with the code, in the same pull request. When a change
adds or changes a pattern, a convention, a configuration value, a command or
a feature's behavior, update the file that describes it. When it adds a new
piece (an entity, a job, a driver), add it to the tables that list them.

Code comments can point to documentation by path
(`documentation/testing/test-library.md`); update them if a file moves. A
`README.md` next to code that's documented here is a short pointer to the
documentation, not a second copy.
