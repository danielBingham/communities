# Documentation

What belongs in `documentation/`, and how it's written so it stays small,
current and cheap to read only what you need.

## What Belongs Here

Only two kinds of documentation:

1. **A high-level overview** that lets you find your footing and know where
   to look: the pieces, how they fit together, and where each lives in the
   code.
2. **Processes, configuration and setup that aren't clear from the code**:
   running the platform locally, configuring it, testing, releasing, and
   changes that touch places you wouldn't find by following the code (a
   migration, a queue, a configuration value).

Anything a contributor can reasonably work out by reading the code stays
out: how a class works, what each function does, lists of routes, tables,
components or hooks. That kind of documentation is long, drifts from the
code, and makes every pull request noisier. Explain *why* in a comment in
the code instead.

## How It's Organized

`documentation/README.md` is the top index. Each directory has a
`README.md` index listing every file in it, with one line saying when to
read it. A reader goes from the top index to a directory index to one
file, and stops there.

| Directory | Holds |
| --------- | ----- |
| `getting-started/` | Setting up and running locally. |
| `architecture/` | The overview: how the pieces fit, and where to look in each. |
| `database/` | How databases are initialized, locally and on staging. |
| `how-to/` | Checklists for changes that touch non-obvious places. |
| `standards/` | How we work: git, dependencies, what a change includes, documentation. |
| `testing/` | Running and writing the test suites, and the manual test cases. |
| `api/` | The API reference. |

## Writing

- **One subject per file**, small enough to read whole. Each fact has one
  home; link to it rather than repeating it.
- **Open with what the file covers**, then a **Code:** line with the paths
  it's about, from the repository root.
- **Exact identifiers in backticks**, and paths rather than line numbers.
- **Say what's true now**, not its history, unless the history explains
  something that would otherwise look wrong.
- **The infrastructure repository is private.** Say when something is
  handled there; don't link to it or give paths in it.
- **Write for contributors**: plain, present tense, "you".

## Keeping It Current

Documentation changes with the code, in the same pull request, when the
change makes it wrong: a command, a setup step, a configuration value, a
process, or the map of where things are. A `README.md` next to code is a
short pointer to the documentation here, not a second copy. Code comments
can point to documentation by path; update them if a file moves.
