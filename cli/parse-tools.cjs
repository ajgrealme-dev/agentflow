const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('tools.html', 'utf8');
const $ = cheerio.load(html);

console.log("=== DETAIL PERKAKAS KERJA (TOOLS.HTML) ===");

const targetDepts = ['dept-pengadaan', 'dept-digimkt', 'dept-socmed', 'dept-ta'];

targetDepts.forEach(deptId => {
  const deptEl = $(`#${deptId}`);
  if (deptEl.length > 0) {
    const deptName = deptEl.find('.dept-n').first().text().trim();
    console.log(`\n========================================`);
    console.log(`🏢 DEPARTEMEN: ${deptName} (${deptId})`);
    console.log(`========================================`);

    deptEl.find('.rc').each((i, el) => {
      const card = $(el);
      const level = card.attr('data-level');
      const roleTitle = card.find('.rt').first().text().trim();
      console.log(`\n👤 [${level.toUpperCase()}] ${roleTitle}`);

      // Extract specific tools
      console.log(`  🔧 Tools Spesifik & Umum:`);
      card.find('.tool').each((j, tel) => {
        const toolTitle = $(tel).text().trim();
        const isSpec = $(tel).hasClass('tool-spec');
        console.log(`    - ${toolTitle} (${isSpec ? 'Spesifik' : 'Umum'})`);
      });

      // Extract workflow steps if any
      console.log(`  🔄 Alur Otomasi (Workflows):`);
      card.find('.af-txt').each((j, afEl) => {
        console.log(`    Step ${j + 1}: ${$(afEl).text().trim()}`);
      });
    });
  } else {
    console.log(`\n❌ Departemen ${deptId} tidak ditemukan.`);
  }
});
