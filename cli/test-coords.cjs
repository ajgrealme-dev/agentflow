const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const divisionBases = {
  'FINANCE': 500,
  'PURCHASING': 1650,
  'MARKETING': 2800,
  'HR': 3950,
  'TECH': 5100,
  'LEGAL': 6250,
  'CUSTOMER': 7400,
  'STRATEGY': 8550
};

const levelY = {
  'CHIEF': 260,
  'MANAGER': 440,
  'SUPERVISOR': 620,
  'SENIOR': 800,
  'STAFF': 980,
  'INTERN': 1160
};

function computeGraphNodes(agents) {
  const nodes = [];
  
  nodes.push({
    id: 'ceo',
    label: 'CEO / Owner (Aziz Maulana)',
    role: 'CEO',
    x: 4500,
    y: 80,
    divisi: 'MANAJEMEN'
  });

  const grouped = {};

  Object.keys(divisionBases).forEach(div => {
    grouped[div] = {};
    Object.keys(levelY).forEach(lv => {
      grouped[div][lv] = [];
    });
  });

  agents.forEach(agent => {
    const role = (agent.role || 'STAFF').toUpperCase();
    const div = (agent.divisi || 'FINANCE').toUpperCase();
    if (grouped[div] && grouped[div][role]) {
      grouped[div][role].push(agent);
    } else {
      console.log("NOT GROUPED:", agent.name, "role:", role, "div:", div);
    }
  });

  Object.entries(grouped).forEach(([divName, levels]) => {
    const baseX = divisionBases[divName];

    Object.entries(levels).forEach(([lvName, levelAgents]) => {
      const y = levelY[lvName];
      const count = levelAgents.length;
      
      levelAgents.forEach((agent, j) => {
        const x = baseX + (j - (count - 1) / 2) * 190;
        
        nodes.push({
          id: agent.id,
          label: agent.name,
          role: agent.role,
          x,
          y,
          divisi: agent.divisi
        });
      });
    });
  });

  return nodes;
}

async function main() {
  const agents = await db.aIAgent.findMany();
  const nodes = computeGraphNodes(agents);

  console.log("Total computed nodes:", nodes.length);
  
  // Tampilkan sebaran Y koordinat
  const yCount = {};
  nodes.forEach(n => {
    yCount[n.y] = (yCount[n.y] || 0) + 1;
  });
  console.log("Y coordinates distribution:", yCount);

  // Tampilkan sampel koordinat beberapa divisi
  console.log("Sample nodes coords:", nodes.slice(0, 15).map(n => ({
    name: n.label,
    role: n.role,
    divisi: n.divisi,
    x: n.x,
    y: n.y
  })));
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
