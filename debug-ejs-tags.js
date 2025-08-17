const fs = require("fs");

const content = fs.readFileSync("src/views/teams/browse.ejs", "utf8");
const lines = content.split("\n");

let openTags = 0;
let lineNum = 0;

for (const line of lines) {
  lineNum++;

  // Count opening <% tags
  const openMatches = line.match(/<%/g);
  if (openMatches) {
    openTags += openMatches.length;
  }

  // Count closing %> tags
  const closeMatches = line.match(/%>/g);
  if (closeMatches) {
    openTags -= closeMatches.length;
  }

  console.log(`Line ${lineNum}: ${openTags} open tags - ${line.trim()}`);

  if (openTags < 0) {
    console.log(
      `ERROR: More closing tags than opening tags at line ${lineNum}`
    );
    break;
  }
}

if (openTags > 0) {
  console.log(`ERROR: ${openTags} unclosed tags at end of file`);
}
