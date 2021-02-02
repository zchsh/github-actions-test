const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), ".generated/test-file.txt");

const time = Date.now();
console.log({ cwd: process.cwd(), filePath, time });
fs.writeFileSync(
  filePath,
  `Hello world! This file was written from node at ${Date.now()}.\n`
);
