/**
 * Cliente ligero para el Servidor MCP de Antigravity Writer (SSE / JSON-RPC en puerto 3000)
 */
export class MCPClient {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.sessionId = null;
  }

  /**
   * Conecta con el endpoint SSE para obtener el Session ID
   */
  async connect() {
    try {
      const response = await fetch(`${this.baseUrl}/mcp`, {
        headers: { 'Accept': 'text/event-stream' },
        signal: AbortSignal.timeout(2000)
      });

      if (!response.ok) {
        throw new Error(`MCP SSE responded with status ${response.status}`);
      }

      // En el protocolo MCP SSE, la primera línea suele contener el endpoint o sessionid
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const { value } = await reader.read();
      const text = decoder.decode(value);

      const match = text.match(/sessionid=([a-zA-Z0-9\-_]+)/);
      if (match) {
        this.sessionId = match[1];
      }
      return true;
    } catch (e) {
      // Si el servidor MCP no está activo, permitimos continuar en modo autónomo
      return false;
    }
  }

  /**
   * Envía una solicitud JSON-RPC al endpoint MCP
   */
  async callTool(toolName, args = {}) {
    if (!this.sessionId) {
      await this.connect();
    }

    const url = this.sessionId 
      ? `${this.baseUrl}/mcp?sessionid=${this.sessionId}`
      : `${this.baseUrl}/mcp`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args
          }
        }),
        signal: AbortSignal.timeout(3000)
      });

      return await response.json();
    } catch (e) {
      return { error: e.message };
    }
  }

  async insertText(text) {
    return this.callTool('insert_text', { text });
  }

  async getEditorContent() {
    return this.callTool('get_editor_content', {});
  }
}
