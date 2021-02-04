# GitHub Actions Test

This repo is meant to help me learn how to set up GitHub Actions.

Specifically, I want to set up an action that:

1. Ensures a `.generated` directory exists, for action output
2. Allows configuration of a `resourcesDir` variable, which determines the target folder from which frontmatter will be collected.
3. Collects a list of all target files in the target folder. For now, target files will be `*.mdx` files, but could make this filter configurable.
4. Collects frontmatter from all the target files, by reading their contents, and extracting frontmatter
   - Will likely use a tool like [`gray-matter`](https://www.npmjs.com/package/gray-matter)
   - This should result in an array of `{ __resourcePath, frontmatter }`, where `__resourcePath` is the path to the file relative to the target folder (eg, if `website/content` is the target folder in `packer`, then `website/content/docs/install.mdx` should have the `__resourcePath` of `docs/install.mdx`)
5. Writes the collected data to a `.generated/collected-frontmatter.json` file.
   - The top-level object should consist of `{ resourcesDir, resources }`, where `resourcesDir` is the path to the target folder within the repository (eg, `website/content` in the case of `packer`).
6. Commits the file to the repo, automatically (?)
   - Maybe there's something related to [`add-commit`](https://github.com/marketplace/actions/add-commit) that would be of use?
   - Maybe this is simpler and one can just run `git add .generated/collection-frontmatter.json` and `git commit -m "chore: update collected frontmatter`?

## To Do

- New format seems to work well
- Likely makes sense to write transform script based on above "collect frontmatter" script. NOT a GitHub action. Just a utility to help migrate from the old format to the new format.
- Specifically, can import `docs-navigation.js` into a copied version of `.github/scripts/collect-and-stage-frontmatter`. Rather than staging collected frontmatter...
  1. Use this imported `order` data, plus the frontmatter, to generate the new `.json` format.
  2. Note the (hopefully) explicit inclusion of `overview` pages.
