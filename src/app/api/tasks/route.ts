import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch tasks waiting for human approval
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // e.g. "WAITING_APPROVAL"
    const escalatedTo = searchParams.get('escalatedTo'); // e.g. "HUMAN"

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (escalatedTo) whereClause.escalatedTo = escalatedTo;

    const tasks = await db.aIAgentTask.findMany({
      where: whereClause,
      include: {
        agent: true,
        steps: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, tasks });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Approve or reject a task
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, decisionNote } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'id and status are required' }, { status: 400 });
    }

    // Verify task exists
    const task = await db.aIAgentTask.findUnique({
      where: { id },
      include: { agent: true }
    });

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Update task status
    const updatedTask = await db.aIAgentTask.update({
      where: { id },
      data: {
        status, // e.g. "COMPLETED" or "FAILED"
        currentState: JSON.stringify({
          ...JSON.parse(task.currentState || '{}'),
          humanDecision: status,
          decisionNote: decisionNote || 'Decision made via Workbench Command Center',
          decidedAt: new Date().toISOString()
        })
      }
    });

    // Create a log step to record human decision
    await db.aIAgentStep.create({
      data: {
        taskId: id,
        agentId: task.agentId,
        actionName: `HUMAN_${status}`,
        inputData: JSON.stringify({ decisionNote }),
        outputData: JSON.stringify({ success: true, newStatus: status })
      }
    });

    // If it's finance invoice and approved, we can update the Invoice status in db
    if (task.title.includes('INV-2026-002') && status === 'COMPLETED') {
      const invoice = await db.invoice.findUnique({
        where: { invoiceNumber: 'INV-2026-002' }
      });
      if (invoice) {
        await db.invoice.update({
          where: { id: invoice.id },
          data: { status: 'PAID' }
        });
      }
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
