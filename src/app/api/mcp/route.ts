import { NextResponse } from 'next/server';
import { mcpClient } from '@/lib/mcp/client';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Ensure MCP client is initialized
    await mcpClient.init();

    // Read config file from disk to get configured list
    const configPath = path.resolve(process.cwd(), 'mcp-config.json');
    let mcpServersConfig: Record<string, any> = {};
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        mcpServersConfig = config.mcpServers || {};
      } catch (e) {
        console.error('[API MCP] Failed parsing mcp-config.json:', e);
      }
    }

    // Get live status from client manager
    const liveServers = mcpClient.getServersStatus();

    const servers = Object.entries(mcpServersConfig).map(([name, srv]: [string, any]) => {
      const live = liveServers.find(s => s.name === name);
      const isConnected = !!live;
      const tools = live?.tools || [];

      return {
        name,
        command: srv.command,
        args: srv.args,
        status: isConnected ? 'CONNECTED' : 'NOT_CONNECTED',
        tools: tools.map((t: any) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema
        }))
      };
    });

    return NextResponse.json({ success: true, servers });
  } catch (err: any) {
    console.error('[API MCP Error]', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
