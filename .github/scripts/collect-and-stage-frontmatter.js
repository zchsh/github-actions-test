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

  // Traverse directories and parse frontmatter
  const targetFilepaths = klawSync(INPUT_DIR, {
    traverseAll: true,
    filter: (f) => path.extname(f.path) === ".mdx",
  }).map((f) => f.path);
  const inputDirPath = path.join(process.cwd(), INPUT_DIR);
  const collectedFrontmatter = await Promise.all(
    targetFilepaths.map(async (filePath) => {
      const rawFile = fs.readFileSync(filePath, "utf-8");
      const { data: frontmatter } = grayMatter(rawFile);
      const __resourcePath = path.relative(inputDirPath, filePath);
      return { __resourcePath, ...frontmatter };
    })
  );

  //  Stringify the collected frontmatter, and write the file
  const fileString = JSON.stringify(collectedFrontmatter, null, 2);
  fs.writeFileSync(outputFile, fileString);

  //  Stage the changes so they're ready to commit
  // (kind of relies on the outputDir, which is why it happens here)
  await exec(`git add ${outputDir}`);
}

collectAndCommitFrontmatter().then(() => console.log("✅ Done"));
