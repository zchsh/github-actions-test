const fs = require("fs");
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const grayMatter = require("gray-matter");

const OUTPUT_DIR = ".generated";
const COMMIT_MSG = "chore: update test file";

async function collectAndCommitFrontmatter() {
  // Set up a directory for output
  const outputDir = path.join(process.cwd(), OUTPUT_DIR);
  fs.mkdirSync(outputDir, { recursive: true });

  // @TODO - traverse directories and parse frontmatter to get an actual fileString
  console.log({ grayMatter });
  const fileString = `Hello world! This file was written from node at ${Date.now()}.\n`;
  // @TODO - update the fileName to be something that makes sense given the frontmatter content
  const fileName = "test-file.txt";

  // Write the file
  fs.writeFileSync(path.join(outputDir, fileName), fileString);

  //  Commit the changes
  await exec(`git add ${outputDir}`);
  await exec(`git commit -m "${COMMIT_MSG}"`);
  await exec(`git push`);
}

collectAndCommitFrontmatter().then(() => console.log("✅ Done"));
