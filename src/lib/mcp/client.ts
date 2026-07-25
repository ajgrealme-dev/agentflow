import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

// JSON-RPC interface definition
interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params: any;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: any;
  error?: any;
}

class McpServerConnection {
  public name: string;
  private command: string;
  private args: string[];
  private process: ChildProcess | null = null;
  private requestId = 1;
  private pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private buffer = '';
  private initialized = false;
  public tools: any[] = [];

  constructor(name: string, command: string, args: string[]) {
    this.name = name;
    this.command = command;
    this.args = args;
  }

  // Start process and initialize connection
  public async connect(): Promise<boolean> {
    try {
      console.log(`[MCP Client] Spawning server "${this.name}": ${this.command} ${this.args.join(' ')}`);
      
      this.process = spawn(this.command, this.args, {
        stdio: ['pipe', 'pipe', 'inherit'],
        shell: true
      });

      this.process.on('error', (err) => {
        console.error(`[MCP Client] Process error in "${this.name}":`, err);
      });

      this.process.on('close', (code) => {
        console.log(`[MCP Client] Server "${this.name}" process closed with code ${code}`);
        this.initialized = false;
      });

      // Stream stdout parser
      this.process.stdout?.on('data', (chunk) => {
        this.buffer += chunk.toString();
        this.parseBuffer();
      });

      // 1. Send MCP Initialize request
      await this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'agentflow-mcp-client', version: '1.0.0' }
      });
      
      // Send initialized notification
      this.sendNotification('notifications/initialized', {});
      this.initialized = true;

      // 2. Fetch tools list from the server
      const toolsRes = await this.sendRequest('tools/list', {});
      if (toolsRes && Array.isArray(toolsRes.tools)) {
        this.tools = toolsRes.tools;
        console.log(`[MCP Client] Loaded ${this.tools.length} tools from server "${this.name}"`);
      }

      return true;
    } catch (err) {
      console.error(`[MCP Client] Failed to connect to server "${this.name}":`, err);
      this.disconnect();
      return false;
    }
  }

  public disconnect() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.initialized = false;
    this.tools = [];
  }

  // Parse lines from standard stdout stream
  private parseBuffer() {
    let index;
    while ((index = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.substring(0, index).trim();
      this.buffer = this.buffer.substring(index + 1);

      if (!line) continue;
      try {
        const response: JsonRpcResponse = JSON.parse(line);
        const pending = this.pendingRequests.get(response.id);
        if (pending) {
          this.pendingRequests.delete(response.id);
          if (response.error) {
            pending.reject(response.error);
          } else {
            pending.resolve(response.result);
          }
        }
      } catch (err) {
        // Log parse error or raw debug warnings from standard process streams
        console.warn(`[MCP Client Debug "${this.name}"]`, line);
      }
    }
  }

  // Send request waiting for JSON-RPC callback
  private sendRequest(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.process.stdin) {
        return reject(new Error('Process not connected'));
      }

      const id = this.requestId++;
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        id,
        method,
        params
      };

      this.pendingRequests.set(id, { resolve, reject });
      this.process.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  // Send lightweight event notification
  private sendNotification(method: string, params: any) {
    if (!this.process || !this.process.stdin) return;
    const request = {
      jsonrpc: "2.0",
      method,
      params
    };
    this.process.stdin.write(JSON.stringify(request) + '\n');
  }

  // Call dynamic tool on this server
  public async callTool(toolName: string, args: any): Promise<any> {
    if (!this.initialized) {
      throw new Error(`MCP Server "${this.name}" is not initialized.`);
    }
    console.log(`[MCP Client] Calling tool "${toolName}" on server "${this.name}" with args:`, args);
    const res = await this.sendRequest('tools/call', {
      name: toolName,
      arguments: args
    });
    
    // Parse standard MCP content response array
    if (res && Array.isArray(res.content)) {
      return res.content.map((c: any) => c.text || JSON.stringify(c)).join('\n');
    }
    return res;
  }
}

// Global Singleton Client Manager to keep connections active
class McpClientManager {
  private servers = new Map<string, McpServerConnection>();
  private loaded = false;

  public getServersStatus() {
    const list: any[] = [];
    for (const [name, conn] of this.servers.entries()) {
      list.push({
        name,
        tools: conn.tools
      });
    }
    return list;
  }

  public async init() {
    if (this.loaded) return;
    
    const configPath = path.resolve(process.cwd(), 'mcp-config.json');
    if (!fs.existsSync(configPath)) {
      console.warn('[MCP Client] No mcp-config.json file found. Skipping MCP setup.');
      return;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const serversConfig = config.mcpServers || {};

      for (const [name, srv] of Object.entries(serversConfig)) {
        const srvConfig = srv as any;
        const connection = new McpServerConnection(name, srvConfig.command, srvConfig.args);
        
        const success = await connection.connect();
        if (success) {
          this.servers.set(name, connection);
        }
      }
      this.loaded = true;
    } catch (err) {
      console.error('[MCP Client] Failed loading mcp-config.json:', err);
    }
  }

  // List all loaded MCP tools mapped to Gemini Function Declarations
  public getGeminiDeclarations(): any[] {
    const declarations: any[] = [];
    
    for (const [serverName, conn] of this.servers.entries()) {
      conn.tools.forEach((tool: any) => {
        // Map parameters schema directly to Gemini
        const properties: Record<string, any> = {};
        const inputProperties = tool.inputSchema?.properties || {};
        
        Object.entries(inputProperties).forEach(([propName, propVal]: [string, any]) => {
          properties[propName] = {
            type: (propVal.type || 'string').toUpperCase(),
            description: propVal.description || ''
          };
        });

        declarations.push({
          name: `mcp__${serverName}__${tool.name}`,
          description: `[MCP: ${serverName}] ${tool.description}`,
          parameters: {
            type: 'OBJECT',
            properties,
            required: tool.inputSchema?.required || []
          }
        });
      });
    }
    
    return declarations;
  }

  // Execute function if prefixed with mcp__
  public async handleCall(name: string, args: any): Promise<any> {
    const parts = name.split('__');
    if (parts.length < 3 || parts[0] !== 'mcp') {
      return null; // Not an MCP tool call
    }

    const serverName = parts[1];
    const toolName = parts.slice(2).join('__');

    const conn = this.servers.get(serverName);
    if (!conn) {
      throw new Error(`MCP Server connection to "${serverName}" not found.`);
    }

    return await conn.callTool(toolName, args);
  }

  public shutdown() {
    for (const conn of this.servers.values()) {
      conn.disconnect();
    }
    this.servers.clear();
    this.loaded = false;
  }
}

// Global reference for Next.js hot-reloads
const globalForMcp = global as unknown as { mcpClient: McpClientManager };
export const mcpClient = globalForMcp.mcpClient || new McpClientManager();

if (process.env.NODE_ENV !== 'production') {
  globalForMcp.mcpClient = mcpClient;
}
