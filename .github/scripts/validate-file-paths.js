const CONTENT_DIR = "website/content/docs";
const CONTENT_ROOT = path.join(process.cwd(), CONTENT_DIR);

//  Validate an array of navNodes
function isValidNavData(navNodes, stack = []) {
  return navNodes.reduce((allValid, navNode) => {
    return allValid && validateNode(navNode, stack);
  }, true);
}

//  Validate a single navNode, ensure its path
//  or its child routes all resolve unambiguously
function validateNode(navNode, stack) {
  // Leaf nodes are valid if their path
  // can be resolved to exactly one `.mdx` file
  if (navNode.path) {
    // Leaf nodes must validate to exactly one `.mdx` file
    const [_resolvedPath, err] = resolveMdxFile(navNode.path, CONTENT_ROOT);
    if (err) throw new Error(err);
    // Leaf nodes must also match the current stack,
    // as either index or named files
    const dirPath = stack.join("/");
    const parts = navNode.path.split("/");
    const isValidIndex = parts.join("/") === dirPath;
    const isValidLeaf = parts.slice(0, parts.length - 1).join("/") === dirPath;
    // Throw an error if the leaf nodes don't seem properly nested
    if (!isValidIndex && !isValidLeaf) {
      throw new Error(
        `Invalid route nested in navData. Node: ${JSON.stringify(
          navNode
        )}. Stack: ${JSON.stringify(stack)}`
      );
    }
    // If we haven't thrown an error yet, the node
    // is valid, so we return true
    return true;
  }
  // Branch nodes are valid if all of
  // their child route nodes are valid
  if (navNode.routes) {
    // We need to parse the directory for this branch node
    // based on the child routes. We may run into errors here
    // if the paths aren't structured as we expect.
    const [dir, errors] = parseDir(navNode.routes, stack);
    // We collect errors from all child routes, and log them out.
    // This is intended to make it easier to fix multiple issues at once
    if (errors.length > 0) {
      throw new Error(
        `Error in route structure. Parent node title: "${
          navNode.title
        }". Stack: "${JSON.stringify(stack)}". Errors:\n\n${errors.join("\n")}`
      );
    }
    return isValidNavData(navNode.routes, stack.concat(dir));
  }
  // All other node types do not reference files,
  // so we just mark them as valid.
  return true;
}

// Given an array of routes, and the current stack
// of parent directories, parse the directory implied
// by the paths in each child route
function parseDir(routes, stack) {
  const parentDir = stack.join("/") + "/";
  const [dir, errs] = routes.reduce(
    (acc, node) => {
      const [parsedDir, errors] = acc;
      if (node.path === "") {
        errors.push(
          `Empty strings are not valid paths. Node: ${JSON.stringify(node)}`
        );
        return acc;
      }
      // For leaf nodes...
      if (node.path) {
        const isSubpath = node.path.indexOf(parentDir) === 0;
        if (!isSubpath) {
          errors.push(
            `"Mismatched route. All route paths must be subpaths of their parent. Node: ${JSON.stringify(
              node
            )}`
          );
          return acc;
        }
        const shortPath = node.path.replace(parentDir, "");
        const shortPathParts = shortPath.split("/");
        const isBadNestedPath = shortPathParts.length > 2;
        if (isBadNestedPath) {
          errors.push(
            `"Badly nested route. All routes must be direct subpaths of their parent. Node: ${JSON.stringify(
              node
            )}`
          );
          return acc;
        }
        const isIndexPath = shortPathParts.length === 1;
        const dirFromPath = isIndexPath ? shortPathParts[0] : shortPathParts[1];
        // If the parsed dir hasn't been initialized, then use this node's value to initialize it
        if (!parsedDir) return [dirFromPath, errors];
        if (dirFromPath !== parsedDir) {
          errors.push(
            `"Mismatched routes. All sibling routes must have the same parent directory. Node:  ${JSON.stringify(
              node
            )}`
          );
        }
        return acc;
      }
      // For nested routes...
      if (node.routes) {
        // TODO
      }
      // For all other nodes, just pass on the accumulator
      return acc;
    },
    [null, []]
  );
  if (!dir) {
    errs = [
      "Could not parse directory - no valid child routes were found.",
    ].concat(errs);
  }
  return [dir, errs];
}

//  Given a path without an extension,
//  and a rootDirectory from which to try to resolve the path.
//  resolvedPath will be either `{pathBasename}.mdx` or `{pathBasename}/index.mdx`.
//  If both files exist, or if neither files exist, then this function
//  returns [ null, err ] where err is a helpful error message.
//  If exactly one of the files exists, then this function
//  returns [ resolvedPath, null ].
function resolveMdxFile(pathBasename, rootDir) {
  const indexFilePath = path.join(pathBasename, "index.mdx");
  const namedFilePath = `${pathBasename}.mdx`;
  const hasIndexFile = fs.existsSync(path.join(rootDir, indexFilePath));
  const hasNamedFile = fs.existsSync(path.join(rootDir, namedFilePath));
  if (!hasIndexFile && !hasNamedFile) {
    let err = `Could not find file to match path "${pathBasename}". `;
    err += `Neither "${namedFilePath}" or "${indexFilePath}" could be found.`;
    return [null, err];
  }
  if (hasIndexFile && hasNamedFile) {
    let err = `Ambiguous path "${pathBasename}". Both "${namedFilePath}" and "${indexFilePath}" exist.`;
    return [null, err];
  }
  const resolvedPath = hasIndexFile ? indexFilePath : namedFilePath;
  return [resolvedPath, null];
}
