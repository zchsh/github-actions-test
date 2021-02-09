const fs = require("fs");
const path = require("path");
const navJson = require("../../.generated/docs-navigation.json");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const CONTENT_DIR = "website/content/docs";
const CONTENT_ROOT = path.join(process.cwd(), CONTENT_DIR);
const OUTPUT_FILE = "docs-navigation-with-filepaths.json";
const OUTPUT_PATH = path.join(process.cwd(), ".generated", OUTPUT_FILE);

async function addFilePathsToJson() {
  const withFilePaths = addFilePaths(navJson);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(withFilePaths, null, 2));
  await exec(`git add ${OUTPUT_PATH}`);
}

addFilePathsToJson().then(() => {
  console.log("✅ Done");
});

function addFilePaths(navNodes) {
  return navNodes.slice(0).map(addFilePath);
}

function addFilePath(navNode) {
  if (navNode.path) {
    const indexFilePath = path.join(navNode.path, "index.mdx");
    const namedFilePath = `${navNode.path}.mdx`;
    const hasIndexFile = fs.existsSync(path.join(CONTENT_ROOT, indexFilePath));
    const hasNamedFile = fs.existsSync(path.join(CONTENT_ROOT, namedFilePath));
    if (!hasIndexFile && !hasNamedFile) {
      throw new Error(
        `Could not find file to match path "${navNode.path}". Neither "${namedFilePath}" or "${indexFilePath}" could be found.`
      );
    }
    if (hasIndexFile && hasNamedFile) {
      console.warn(
        `Ambiguous path "${navNode.path}". Both "${namedFilePath}" and "${indexFilePath}" exist.`
      );
    }
    const filePath = path.join(
      CONTENT_DIR,
      hasIndexFile ? indexFilePath : namedFilePath
    );
    return { ...navNode, filePath };
  }
  if (navNode.routes) {
    const routesWithFilePaths = addFilePaths(navNode.routes);
    return { ...navNode, routes: routesWithFilePaths };
  }
  return navNode;
}
