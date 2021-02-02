const fs = require("fs");
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const grayMatter = require("gray-matter");
const klawSync = require("klaw-sync");

const INPUT_DIR = "website/content";
const OUTPUT_DIR = ".generated";
const OUTPUT_FILE = "collected-frontmatter.json";

async function collectAndCommitFrontmatter() {
  // Set up a directory for output
  const outputDir = path.join(process.cwd(), OUTPUT_DIR);
  const outputFile = path.join(outputDir, OUTPUT_FILE);
  fs.mkdirSync(outputDir, { recursive: true });

  // @TODO - traverse directories and parse frontmatter to get an actual fileString
  // console.log({ grayMatter });
  const targetFilepaths = klawSync(INPUT_DIR, {
    traverseAll: true,
    filter: (f) => path.extname(f.path) === ".mdx",
  })
    .map((f) => f.path)
    .slice(
      0,
      10
    ); /* TODO process all files, will take longer so for dev not doing it */

  const inputDirPath = path.join(process.cwd(), INPUT_DIR);
  const collectedFrontmatter = await Promise.all(
    targetFilepaths.map(async (filePath) => {
      const __resourcePath = path.relative(inputDirPath, filePath);
      return { __resourcePath };
    })
  );
  console.log(collectedFrontmatter);
  const fileString = JSON.stringify(collectedFrontmatter, null, 2);
  // @TODO - update the fileName to be something that makes sense given the frontmatter content

  // Write the file
  fs.writeFileSync(outputFile, fileString);

  //  Commit the changes
  await exec(`git add ${outputDir}`);
}

collectAndCommitFrontmatter().then(() => console.log("✅ Done"));
