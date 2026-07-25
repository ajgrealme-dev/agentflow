const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  const agents = await db.aIAgent.findMany({
    select: {
      id: true,
      name: true,
      role: true,
      divisi: true
    }
  });

  const roles = new Set();
  const divisions = new Set();

  agents.forEach(a => {
    roles.add(a.role);
    divisions.add(a.divisi);
  });

  console.log("Total agents:", agents.length);
  console.log("Roles found in DB:", Array.from(roles));
  console.log("Divisions found in DB:", Array.from(divisions));

  // Tampilkan 10 sample pertama
  console.log("Sample 5 agents:", agents.slice(0, 5));
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
