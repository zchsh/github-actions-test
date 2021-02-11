const navData = require("../../.generated/docs-navigation.json");

const [rootStack, navDataWithStacks] = validateRouteStructure(navData);
console.log(JSON.stringify({ rootStack, navDataWithStacks }, null, 2));

function validateRouteStructure(navData, depth = 0) {
  if (navData.length === 0) {
    throw new Error(`Found empty array of navData. Depth: ${depth}`);
  }
  // Parse the stacks from the flat, non-nested path children
  const withStacks = navData.map((navNode) => {
    // Handle leaf nodes, which have path values
    if (typeof navNode.path !== "undefined") {
      // Empty paths are invalid
      if (navNode.path === "") {
        throw new Error(
          `Empty strings are not valid paths.\n\nNode:\n${JSON.stringify(
            navNode,
            null,
            2
          )}`
        );
      }
      return { __stack: navNode.path.split("/"), ...navNode };
    }
    if (navNode.routes) {
      const [nestedStack, routesWithStacks] = validateRouteStructure(
        navNode.routes,
        depth + 1
      );
      return { __stack: nestedStack, ...navNode, routes: routesWithStacks };
    }
    //  Other nodes aren't relevant, we don't touch them
    return navNode;
  });
  console.log({ withStacks });
  const routeStacks = withStacks.reduce((acc, navNode) => {
    // Ignore nodes that don't have a path stack
    if (!navNode.__stack) return acc;
    // For other nodes, grab their stacks
    return acc.concat([navNode.__stack]);
  }, []);
  // Ensure that there are no duplicate paths
  const allPaths = routeStacks.map((s) => s.join("/"));
  const dupes = allPaths.filter((value, index, self) => {
    return self.indexOf(value) !== index;
  });
  if (dupes.length > 0) {
    throw new Error(`Duplicate routes found:\n\n${JSON.stringify(dupes)}\n`);
  }
  // Normalize the length of each leaf stack for comparison
  // with sibling stacks
  const dirPaths = routeStacks.map((stack) => {
    // Index leaf nodes will have the same
    // number of path parts as the current nesting depth
    if (stack.length === depth) {
      // For index nodes, the dir path
      // is identical to the leaf path
      return stack.join("/");
    }
    // Named leaf nodes will have one more
    // path part than the current nesting depth
    if (stack.length === depth + 1) {
      // For named nodes, the dir path
      // is sliced from the leaf path
      return stack.slice(0, stack.length - 1).join("/");
    }
    // If we have any other number of parts in the
    // leaf node's path, then it is invalid.
    throw new Error(
      `Invalid path depth. At depth ${depth}, found path "${stack.join("/")}"`
    );
  });

  const uniqueDirs = dirPaths.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
  if (uniqueDirs.length > 1) {
    throw new Error(`Found mismatched paths: ${JSON.stringify(uniqueDirs)}`);
  }
  console.log({ allPaths, uniqueDirs });
  return [uniqueDirs[0].split("/"), withStacks];
}
