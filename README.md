# Remote Content Test Repo

Purpose of this repo is to play around with GitHub Actions a bit, and see what a "remote content" repo might need in terms of workflows to make the job of building the remote content easier.

## 2021-02-09 - Refining next steps

- `navData` is the new format proposed in the RFC, that authors write
  - `navData` is an array of `navDataNode`s
  - A `navDataNode` is one of...
    - `{ divider: true }`, a presentational node to render a divider in the nav
    - `{ title, path }`, a leaf node representing an `.mdx` document
    - `{ title, href }`, a leaf node representing an external link
    - `{ title, routes: [ ...navDataNodes ] }`, a branch node representing a category, which contains children nodes in its `routes` array
- `DocsSidenav` will receive `navData` directly

  - The authored `path` values correspond directly to routes
  - We drop `matchOrderToData` - this logic is no longer necessary with our revised `navData` format
  - The component makes the assumption that the `path` values point to valid routes, which have valid source files

- `DocsPage`'s `server.js` will run a filesystem checking function `validateNavData`

  - Ensures the `navData` is structured correctly

    - Each item in a category should have a path that matches the parent category
    - Each item's `path` should resolve to exactly one file - either `{path}.mdx` or `{path}/index.mdx`
    - We will throw an error if there is a missing source for a `path`
    - We will throw an error if there is an ambiguous source for a `path` (ie both "named" and "index" files exist)

  - This function could also add a `filePath` value to each `navData` node, which would be the full path from the repo root
    - This is not needed for our main `docs` sites at present, since the `validate
    - For now we'll ignore this use case, we'll address changes related to "remote consumption" later

- `DocsSidenav` will be moved into `DocsPage`

  - `DocsSidenav` is not currently used standalone (need to confirm this, almost certain)
  - We actually probably want to discourage standalone use (?)
  - Alt approach: if we want standalone use, then `DocsSidenav` will get its own `server.js` file, where `validateNavData` will be run

- Migration scripts...
  - Remove `sidebar_title` from all `.mdx` files
  - Convert from old `.js` format to new `.json` format
  - Are there changes required in `[[...slug]].jsx` docs page routes?
    - We could NOT import `order`, and have `DocsPage` grab it via `fs`. This would reduce boilerplate, move us closer to a "docs platform"

### Next Steps

- Combine notes above with [current "mini"-RFC](https://docs.google.com/document/d/1cKUwgBCKFycTo8p5C1Ka1bI_0fkrwAGLd6aYFX9-nnA/edit#) and create new RFC document
- Add notes on changes to `DocsSidenav` / `DocsPage` to new RFC document
- Make a PR onto `react-components` with the refactored `DocsSidenav`
  - ... pending confirmation of "no independent use of DocsSidenav, will actually be changes to `DocsPage`
- Open PR on [`mktg-sourcegraph-campaigns`](https://github.com/hashicorp/mktg-sourcegraph-campaigns/) that adds scripts related to this migration

## 2021-02-09 - Platform meeting

### `DocsSidenav` changes

- Move `DocsSidenav` into `DocsPage`
- Filesystem checks that currently happen in `DocsSidenav` should now happen in `DocsPage`'s `server.js` file
- Would abstract the filesystem check into its own function, so we can export it separately if needed (eg for Packer Registry)
- `generateStaticProps` will take in `navData` (fka `order`), and throw errors as needed
- we won't need to read `allFrontmatter` anymore (it was only used for sidebar)
  - Related - we'll be eliminating the `sidebar_title` frontmatter

### "full" path vs "short / partial" path

- We'll go with the "full" path - majority wanted it, and two folks who didn't prefer it wouldn't be upset
- We'll need to check the "full" paths are actually valid - ie, the nesting is strict

## 2021-02-08 - For discussion

1. How do we handle "Overview" / `index.mdx` files?
   - We could automatically add and title these pages via a GitHub Action
     - This seems to be what the RFC implies
     - We likely want to do a filesystem check as part of the action anyways, to missing files from silently breaking builds
     - We probably also want to allow "overriding" the auto-added pages by explicitly listing, eg to allow custom titles (?)
       - This makes things a bit more complicated though...
       - Maybe an explicit
   - We could require authors to explicitly list these files
     - For example, `{ "title": "Overview", "path": "commands/index" }`
     - `path` may be able to be shortened to `commands` rather than `commands/index` (see below)
   - **Proposed** approach is to require index pages to be **explicitly listed**
2. When consuming content, how do we distinguish "named" file paths from "index" file paths?
   - Some paths reference an index file
     - For example `commands` >> `commands/index.mdx`
   - Other paths reference a named file
     - For example `terminology` >> `terminology.mdx`
   - We need to be able to do tell which is which to request the correct file path from the GitHub API
   - Option: index paths **must include the filename**
     - For example, we must have `commands/index`, and not `commands`
     - On the consumption side, we have to normalize the file path to the desired route
     - **🚨 This approach doesn't feel ideal**
   - Option: items with `title == "Overview"` are **assumed be index files**
     - When consuming content, we'd do something like `title === "Overview" ? fetchIndexFile() : fetchNamedFile()`
     - **🚨 But this feels brittle**, and requires consumption-side normalization (as above)
   - Option: check filesystem via GitHub action, and \*\*add `filePath` to each item
   - **Proposed** approach is to **automatically add a `filePath`** to each nav item via GitHub Actions
     - In this same Action, we can ensure the `filePath` actually exists
     - This will minimize errors fetching page content
     - It will also remove the need for path normalization in the deployment project that consumes content
     - ... and it could allow authors to imply index files like `commands` for `commands/index.mdx`
       - For each item, we'll try to resolve both `commands.mdx` and `commands/index.mdx`
       - If only one exists, great, we'll add that as the `filePath`
       - If neither exists, we throw an error - we're missing a file!
       - If both exists, we throw an error - it's ambiguous which file was intended.

### Proposed approach

- [ ] Add `filePath` "index path" normalization and "missing content" into GitHub Action
  - Check that files listed in navigation data actually exist
    - If a file doesn't exit, we'll throw an error
  - Allow implicit `index` files to be listed, we'll resolve it as expected
    - Authors can write `commands` and we'll know they mean `commands/index.mdx`, not `commands.mdx` (former exists, latter does not)
    - Authors can write `terminology` and we'll know they mean `terminology.mdx`, not `terminology/index.mdx` (former exists, latter does not)
    - If conflicting files exist, we'll throw an error
  - Generate data with an added `filePath` property

Benefits:

- Ensures navigation data that references non-existent content **cannot** be published
  - Throws an error where content authors will see it (in the "source project")
  - Alternate approach is that "consuming project" build breaks when there are broken links
    - ... but this would likely be silent in the "source project"
- Prevents the need for "index file normalization" in the consuming project
  - This seems like it'd be required otherwise (I think? 🤔)
- Safely enables the "implicit index file" shorthand as in the RFC
  - Alternate approaches, eg assuming "index files" based on the title "Overview", feel more brittle

Drawbacks:

- Requires a GitHub Action embedded in the "content source project"
