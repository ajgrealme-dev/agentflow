import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const {
      industry = 'Logistik',
      location = 'Serang',
      keyword = 'purchasing',
      limit = 5,
    } = body;

    // Validate inputs
    const paramRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (
      typeof industry !== 'string' || !paramRegex.test(industry) ||
      typeof location !== 'string' || !paramRegex.test(location) ||
      typeof keyword !== 'string' || !paramRegex.test(keyword)
    ) {
      return NextResponse.json({ success: false, error: 'Invalid input parameters' }, { status: 400 });
    }

    const limitNum = Number(limit);
    if (isNaN(limitNum) || limitNum <= 0 || !Number.isInteger(limitNum)) {
      return NextResponse.json({ success: false, error: 'Invalid limit parameter' }, { status: 400 });
    }

    const scraperDir = path.resolve(process.cwd(), '..', 'job-scraper-bot');
    const pythonBin = process.platform === 'win32'
      ? path.join('.venv', 'Scripts', 'python.exe')
      : path.join('.venv', 'bin', 'python');
    const pythonExe = path.join(scraperDir, pythonBin);
    const scriptPath = path.join(scraperDir, 'scraper_runner.py');

    const result = await new Promise<{ leads: any[]; error?: string }>((resolve) => {
      let completed = false;
      const safeResolve = (val: { leads: any[]; error?: string }) => {
        if (!completed) {
          completed = true;
          resolve(val);
        }
      };

      const proc = spawn(pythonExe, [
        scriptPath,
        '--industry', industry,
        '--location', location,
        '--keyword', keyword,
        '--limit', String(limitNum),
      ], { cwd: scraperDir });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d) => {
        stdout += d.toString();
      });
      proc.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      const timeout = setTimeout(() => {
        proc.kill();
        safeResolve({ leads: [], error: 'Timeout: Scraper berjalan lebih dari 60 detik.' });
      }, 60000);

      proc.on('close', (_code) => {
        clearTimeout(timeout);
        try {
          const parsed = JSON.parse(stdout.trim());
          safeResolve({ leads: Array.isArray(parsed) ? parsed : parsed.leads || [] });
        } catch {
          safeResolve({ leads: [], error: stderr || 'Output scraper tidak valid.' });
        }
      });
    });

    if (result.error && result.leads.length === 0) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      leads: result.leads,
      count: result.leads.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
