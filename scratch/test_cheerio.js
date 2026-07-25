const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const filePath = path.join(__dirname, '../jobdesc.html');
const html = fs.readFileSync(filePath, 'utf8');
const $ = cheerio.load(html);

console.log("HTML Loaded with Cheerio!");

let totalRoles = 0;

// Parse Chief Cards (class="cc")
$('.cc').each((i, el) => {
  const badge = $(el).find('.ch-badge').text().trim();
  const title = $(el).find('.ch-title').text().trim();
  const rep = $(el).find('.ch-rep').text().trim();
  const desc = $(el).find('.ch-desc').text().trim();
  
  // Tanggung Jawab
  const responsibilities = [];
  $(el).find('.sl').first().find('li').each((j, li) => {
    responsibilities.push($(li).text().trim());
  });

  // Alur Kerja
  const workflows = [];
  $(el).find('.sl').eq(1).find('li').each((j, li) => {
    workflows.push($(li).text().trim());
  });

  console.log(`CHIEF: ${title}`);
  console.log(`  Rep: ${rep}`);
  console.log(`  Tanggung Jawab Count: ${responsibilities.length}`);
  console.log(`  Alur Kerja Count: ${workflows.length}`);
  totalRoles++;
});

// Parse Department Role Cards (class="rc")
$('.db').each((i, dbEl) => {
  const deptId = $(dbEl).attr('id');
  const deptName = $(dbEl).find('.dept-n').text().trim();
  console.log(`\nDept: ${deptName} (${deptId})`);

  $(dbEl).find('.rc').each((j, rcEl) => {
    const level = $(rcEl).attr('data-level');
    const roleName = $(rcEl).find('.rt').text().trim();
    const rep = $(rcEl).find('.rr').text().trim();
    const desc = $(rcEl).find('.rd').text().trim();

    // Tanggung Jawab
    const responsibilities = [];
    $(rcEl).find('.rl').find('li').each((k, li) => {
      responsibilities.push($(li).text().trim());
    });

    // Alur Kerja
    const workflows = [];
    $(rcEl).find('.ws').each((k, wsEl) => {
      const stepNum = $(wsEl).find('.wn').text().trim();
      const stepText = $(wsEl).find('.wt').text().trim();
      workflows.push(`${stepNum}. ${stepText}`);
    });

    console.log(`  - ${roleName} (${level}) - Lapor: ${rep}`);
    console.log(`    Tanggung Jawab Count: ${responsibilities.length}`);
    console.log(`    Alur Kerja Count: ${workflows.length}`);
    totalRoles++;
  });
});

console.log(`\nTotal parsed roles: ${totalRoles}`);
