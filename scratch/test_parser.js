const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../jobdesc.html');
const html = fs.readFileSync(filePath, 'utf8');

console.log("HTML Length:", html.length);

// Regex to find departments and their role cards
// A department is defined by: <div class="db" id="[id]"><div class="dh" ...><span class="dept-n">[name]</span>...</div><div class="dbody">[roles]</div></div>
const deptRegex = /<div class="db"\s+id="([^"]+)">[\s\S]*?<span class="dept-n">([^<]+)<\/span>[\s\S]*?<div class="dbody">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;

let match;
let count = 0;
while ((match = deptRegex.exec(html)) !== null) {
  const deptId = match[1];
  const deptName = match[2];
  const deptBody = match[3];
  console.log(`\nDept: ${deptName} (${deptId})`);
  
  // Find role cards inside the department body
  // <div class="rc" data-level="[level]" data-text="[text]">...<span class="rt">[name]</span>...<div class="rd">[desc]</div>...
  const rcRegex = /<div class="rc"\s+data-level="([^"]+)"[\s\S]*?<span class="rt">([^<]+)<\/span>[\s\S]*?<div class="rd">([^<]+)<\/div>([\s\S]*?)<\/div>\s*<\/div>/g;
  let rcMatch;
  while ((rcMatch = rcRegex.exec(deptBody)) !== null) {
    const level = rcMatch[1];
    const roleName = rcMatch[2];
    const desc = rcMatch[3].trim();
    console.log(`  - Role: ${roleName} (${level}) - ${desc.slice(0, 50)}...`);
    count++;
  }
}

console.log(`\nTotal parsed roles: ${count}`);
