// Anthropic Provider - Real Claude API integration
import type { AIProvider } from '../orchestrator';

export class AnthropicProvider implements AIProvider {
  name = 'Anthropic';
  private apiKey: string | undefined;
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    // Anthropic doesn't have a simple health check endpoint,
    // so we verify the key format and assume it's valid
    return this.apiKey.startsWith('sk-ant-');
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // Convert messages format - Anthropic uses a different structure
    // Extract system message if present
    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Ensure messages alternate and start with user
    const formattedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    for (const msg of chatMessages) {
      if (formattedMessages.length === 0 && msg.role === 'assistant') {
        // Skip leading assistant messages
        continue;
      }
      if (formattedMessages.length > 0 && formattedMessages[formattedMessages.length - 1].role === msg.role) {
        // Merge consecutive same-role messages
        formattedMessages[formattedMessages.length - 1].content += '\n' + msg.content;
      } else {
        formattedMessages.push(msg);
      }
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options?.model || 'claude-sonnet-4-20250514',
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.7,
        system: systemMessage?.content,
        messages: formattedMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Extract text from content blocks
    const textContent = data.content?.find((block: any) => block.type === 'text');
    return textContent?.text || '';
  }

  async streamChat(
    messages: Array<{ role: string; content: string }>,
    onToken: (token: string) => void,
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options?.model || 'claude-sonnet-4-20250514',
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.7,
        system: systemMessage?.content,
        messages: chatMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            const token = parsed.delta.text;
            fullResponse += token;
            onToken(token);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    return fullResponse;
  }
}
