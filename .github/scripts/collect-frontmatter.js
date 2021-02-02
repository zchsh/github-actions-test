const fs = require("fs");

fs.writeFileSync(
  ".generated/test-file.txt",
  "Hello world! This file was written from node.\n"
);
