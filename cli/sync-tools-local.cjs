const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

// Load .env
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  const htmlPath = path.resolve(__dirname, "../tools.html");
  if (!fs.existsSync(htmlPath)) {
    console.error(`tools.html tidak ditemukan di ${htmlPath}`);
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  const $ = cheerio.load(htmlContent);

  let matchedCount = 0;
  let toolCount = 0;

  const cards = $(".rc");
  console.log(`Ditemukan ${cards.length} kartu role di tools.html`);

  for (let i = 0; i < cards.length; i++) {
    const el = cards[i];
    const roleName = $(el).find(".rt").text().trim();

    const specTools = [];
    $(el).find(".tool-spec").each((_, item) => {
      specTools.push($(item).text().trim());
    });

    const genTools = [];
    $(el).find(".tool-gen").each((_, item) => {
      genTools.push($(item).text().trim());
    });

    const automationSteps = [];
    $(el).find(".af-txt").each((_, item) => {
      automationSteps.push($(item).text().trim());
    });

    if (specTools.length === 0 && genTools.length === 0) continue;

    // Pencarian kecocokan nama agent
    const agents = await db.aIAgent.findMany({
      where: {
        name: {
          startsWith: roleName,
          mode: "insensitive"
        }
      }
    });

    if (agents.length > 0) {
      matchedCount += agents.length;
      for (const agent of agents) {
        // Hapus tools lama
        await db.agentTool.deleteMany({
          where: { agentId: agent.id }
        });

        // Masukkan tools spesifik
        for (const t of specTools) {
          await db.agentTool.create({
            data: {
              agentId: agent.id,
              toolName: t,
              category: "SPESIFIK"
            }
          });
          toolCount++;
        }

        // Masukkan tools umum
        for (const t of genTools) {
          await db.agentTool.create({
            data: {
              agentId: agent.id,
              toolName: t,
              category: "UMUM"
            }
          });
          toolCount++;
        }

        // Update SOP Markdown
        let baseSop = agent.sopMarkdown;
        const markerIndex = baseSop.indexOf("\n\n## Peralatan Kerja (Tools) dari System");
        if (markerIndex !== -1) {
          baseSop = baseSop.substring(0, markerIndex);
        }

        const toolsSection = `\n\n## Peralatan Kerja (Tools) dari System
### Tools Spesifik:
${specTools.map(t => `- ${t}`).join('\n')}

### Tools Umum:
${genTools.map(t => `- ${t}`).join('\n')}

### Ritme Alur Kerja Otomatis:
${automationSteps.map(o => `- ${o}`).join('\n')}`;

        await db.aIAgent.update({
          where: { id: agent.id },
          data: {
            sopMarkdown: baseSop + toolsSection
          }
        });
      }
    }
  }

  console.log(`[SUKSES] Sinkronisasi selesai! ${matchedCount} agent diperbarui dengan total ${toolCount} tools.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
