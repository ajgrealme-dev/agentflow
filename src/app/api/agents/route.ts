import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

function getOfflineAgents() {
  try {
    const htmlPath = path.join(process.cwd(), 'prisma', 'jobdesc.html');
    if (!fs.existsSync(htmlPath)) {
      return [];
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);

    const agents: any[] = [];
    const insertedNames = new Set<string>();

    function getDivisiFromClass(className: string) {
      if (className.includes('cfo')) return 'FINANCE';
      if (className.includes('coo')) return 'PURCHASING';
      if (className.includes('cmo')) return 'MARKETING';
      if (className.includes('chro')) return 'HR';
      if (className.includes('cto')) return 'TECH';
      if (className.includes('legal')) return 'LEGAL';
      if (className.includes('cx')) return 'CUSTOMER';
      if (className.includes('strat')) return 'STRATEGY';
      return 'FINANCE';
    }

    function getDivisiFromDeptId(deptId: string) {
      if (/akun|pajak|treasury|audit/i.test(deptId)) return 'FINANCE';
      if (/prod|qaqc|pengadaan|logistik/i.test(deptId)) return 'PURCHASING';
      if (/digimkt|socmed|visual|brand/i.test(deptId)) return 'MARKETING';
      if (/ta|cb|lnd|hrops/i.test(deptId)) return 'HR';
      if (/infra|soc|uxui|bi/i.test(deptId)) return 'TECH';
      if (/corplegal|erm|aml/i.test(deptId)) return 'LEGAL';
      if (/cs|crm|ecom/i.test(deptId)) return 'CUSTOMER';
      if (/esg|corpstrat|dei/i.test(deptId)) return 'STRATEGY';
      return 'FINANCE';
    }

    // 1. Parse Chiefs
    $('.cc').each((i, el) => {
      const title = $(el).find('.ch-title').text().trim();
      const rep = $(el).find('.ch-rep').text().trim();
      const desc = $(el).find('.ch-desc').text().trim();

      const className = $(el).attr('class') || '';
      const divisi = getDivisiFromClass(className);

      const responsibilities: string[] = [];
      $(el).find('.sl').first().find('li').each((j, li) => {
        responsibilities.push($(li).text().trim());
      });

      const workflows: string[] = [];
      $(el).find('.sl').eq(1).find('li').each((j, li) => {
        workflows.push($(li).text().trim());
      });

      const sopMarkdown = `# SOP & Job Description: ${title}
**Level:** CHIEF
**Divisi:** ${divisi}
**Lapor ke:** ${rep}

## Deskripsi Posisi
${desc}

## Tanggung Jawab Utama
${responsibilities.map(r => `- ${r}`).join('\n')}

## Ritme / Alur Kerja Harian
${workflows.map(w => `- ${w}`).join('\n')}`;

      const name = `${title} (AI)`;
      if (!insertedNames.has(name)) {
        insertedNames.add(name);
        agents.push({
          id: `offline-${divisi}-CHIEF-${i}`,
          name,
          role: 'CHIEF',
          divisi,
          type: `${divisi} Chief (AI)`,
          status: 'idle',
          tasksCompleted: 15,
          tasksToday: 3,
          errorRate: 0.2,
          uptime: '99.9%',
          lastActivity: 'Aktif',
          goal: desc.slice(0, 200),
          sopMarkdown,
          icon: divisi === 'FINANCE' ? '🧾' : divisi === 'HR' ? '👥' : divisi === 'PURCHASING' ? '📦' : '🤖',
        });
      }
    });

    // 2. Parse Dept Roles
    $('.db').each((i, dbEl) => {
      const deptId = $(dbEl).attr('id') || '';
      const deptName = $(dbEl).find('.dept-n').text().trim();
      const divisi = getDivisiFromDeptId(deptId);

      $(dbEl).find('.rc').each((j, rcEl) => {
        const level = ($(rcEl).attr('data-level') || 'staff').toUpperCase();
        const roleName = $(rcEl).find('.rt').text().trim();
        const rep = $(rcEl).find('.rr').text().trim();
        const desc = $(rcEl).find('.rd').text().trim();

        const responsibilities: string[] = [];
        $(rcEl).find('.rl').find('li').each((k, li) => {
          responsibilities.push($(li).text().trim());
        });

        const workflows: string[] = [];
        $(rcEl).find('.ws').each((k, wsEl) => {
          const stepNum = $(wsEl).find('.wn').text().trim();
          const stepText = $(wsEl).find('.wt').text().trim();
          workflows.push(`${stepNum}. ${stepText}`);
        });

        const sopMarkdown = `# SOP & Job Description: ${roleName}
**Level:** ${level}
**Departemen:** ${deptName}
**Divisi:** ${divisi}
**Lapor ke:** ${rep}

## Deskripsi Posisi
${desc}

## Tanggung Jawab Utama
${responsibilities.map(r => `- ${r}`).join('\n')}

## Ritme / Alur Kerja Harian
${workflows.map(w => `- ${w}`).join('\n')}`;

        let name = `${roleName} (AI)`;
        if (insertedNames.has(name)) {
          name = `${roleName} - ${deptName} (AI)`;
        }

        if (!insertedNames.has(name)) {
          insertedNames.add(name);
          agents.push({
            id: `offline-${divisi}-${level}-${i}-${j}`,
            name,
            role: level,
            divisi,
            type: `${divisi} ${level === 'INTERN' ? 'Intern' : level === 'STAFF' ? 'Staff' : 'Manager'} (AI)`,
            status: 'idle',
            tasksCompleted: Math.floor(Math.random() * 20) + 5,
            tasksToday: Math.floor(Math.random() * 5) + 1,
            errorRate: Math.round(Math.random() * 15 * 10) / 100,
            uptime: '99.9%',
            lastActivity: 'Aktif',
            goal: desc.slice(0, 200),
            sopMarkdown,
            icon: divisi === 'FINANCE' ? '🧾' : divisi === 'HR' ? '👥' : divisi === 'PURCHASING' ? '📦' : '🤖',
          });
        }
      });
    });

    return agents;
  } catch (err) {
    console.error('Error parsing offline agents:', err);
    return [];
  }
}

// GET: Fetch all AI Agents and their aggregate task stats
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');

    // If agentId is provided, fetch detailed agent info, tasks, and steps
    if (agentId) {
      try {
        const agent = await db.aIAgent.findUnique({
          where: { id: agentId },
          include: {
            tasks: {
              orderBy: { createdAt: 'desc' },
              include: {
                steps: {
                  orderBy: { createdAt: 'asc' }
                }
              }
            }
          }
        });

        if (!agent) {
          // Attempt offline fallback search
          const list = getOfflineAgents();
          const matched = list.find(a => a.id === agentId);
          if (matched) {
            return NextResponse.json({ success: true, agent: { ...matched, tasks: [] } });
          }
          return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, agent });
      } catch (dbErr) {
        // Fallback for single agent
        const list = getOfflineAgents();
        const matched = list.find(a => a.id === agentId);
        if (matched) {
          return NextResponse.json({ success: true, agent: { ...matched, tasks: [] } });
        }
        return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
      }
    }

    // Otherwise, fetch all agents and calculate metrics
    const agents = await db.aIAgent.findMany({
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Format output to match Agent interface expected by frontend
    const formattedAgents = agents.map(agent => {
      const tasksCompleted = agent.tasks.filter(t => t.status === 'COMPLETED').length;
      const tasksToday = agent.tasks.length; // Simplified for demo
      const errorRate = agent.tasks.length > 0 
        ? Math.round((agent.tasks.filter(t => t.status === 'FAILED').length / agent.tasks.length) * 1000) / 10
        : 0;

      let status = agent.status.toLowerCase();
      if (status === 'waiting_approval') {
        status = 'paused';
      }

      // Icon map based on role/divisi
      let icon = '🤖';
      if (agent.divisi === 'FINANCE') icon = '🧾';
      else if (agent.divisi === 'HR') icon = '👥';
      else if (agent.divisi === 'PURCHASING') icon = '📦';

      return {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        divisi: agent.divisi,
        type: `${agent.divisi} ${agent.role === 'INTERN' ? 'Intern' : agent.role === 'STAFF' ? 'Staff' : 'Manager'} (AI)`,
        status,
        tasksCompleted,
        tasksToday,
        errorRate,
        uptime: '99.9%',
        lastActivity: 'Aktif',
        goal: agent.goal,
        sopMarkdown: agent.sopMarkdown,
        icon,
      };
    });

    return NextResponse.json({ success: true, agents: formattedAgents });
  } catch (err: any) {
    // Database is offline! Use offline cheerio parser.
    const fallbackAgents = getOfflineAgents();
    return NextResponse.json({ success: true, agents: fallbackAgents });
  }
}

// POST: Create a new AI Agent
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, role, divisi, goal, sopMarkdown } = body;

    // Validation
    if (!name || !role || !divisi || !goal || !sopMarkdown) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const newAgent = await db.aIAgent.create({
      data: {
        name,
        role,
        divisi,
        goal,
        sopMarkdown,
        status: 'IDLE',
      }
    });

    return NextResponse.json({ success: true, agent: newAgent }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Update an AI Agent (e.g. edit SOP or change status)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, goal, status, sopMarkdown } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    // Check if exists
    const existing = await db.aIAgent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    const updated = await db.aIAgent.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(goal && { goal }),
        ...(status && { status }),
        ...(sopMarkdown && { sopMarkdown }),
      }
    });

    return NextResponse.json({ success: true, agent: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Delete an AI Agent
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    // Check if exists
    const existing = await db.aIAgent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    await db.aIAgent.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Agent deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
