const fs = require("fs");
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const OUTPUT_DIR = ".generated";
const GIT_NAME = "GitHub Actions";
const GIT_EMAIL = "actions@github.com";
const GITHUB_ACTOR = process.env.GITHUB_ACTOR;
const GIT_AUTHOR = `${GITHUB_ACTOR} <${GITHUB_ACTOR}@users.noreply.github.com>`;
const COMMIT_MSG = "chore: update test file";

async function collectAndCommitFrontmatter() {
  // Set up a directory for output
  const outputDir = path.join(process.cwd(), OUTPUT_DIR);
  fs.mkdirSync(outputDir, { recursive: true });

  // @TODO - traverse directories and parse frontmatter to get an actual fileString
  const fileString = `Hello world! This file was written from node at ${Date.now()}.\n`;
  // @TODO - update the fileName to be something that makes sense given the frontmatter content
  const fileName = "test-file.txt";

  // Write the file
  fs.writeFileSync(path.join(outputDir, fileName), fileString);

  //  Commit the changes
  console.log({ GITHUB_ACTOR, GIT_AUTHOR });
  await exec(`git config user.name "${GIT_NAME}"`);
  await exec(`git config user.email "${GIT_EMAIL}"`);
  await exec(`git add ${outputDir}`);
  const { stdout, stderr } = await exec(
    `git commit -m "${COMMIT_MSG}" --author="${GIT_AUTHOR}"`
  );
  console.log({ stdout, stderr });
}

collectAndCommitFrontmatter().then(() => console.log("✅ Done"));
