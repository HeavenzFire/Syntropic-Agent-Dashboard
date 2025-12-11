// xAI Provider - Grok API integration
import type { AIProvider } from '../orchestrator';

export class XAIProvider implements AIProvider {
  name = 'xAI';
  private apiKey: string | undefined;
  private baseUrl = 'https://api.x.ai/v1';

  constructor() {
    this.apiKey = process.env.XAI_API_KEY;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      // xAI uses OpenAI-compatible API
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('xAI API key not configured');
    }

    // xAI uses OpenAI-compatible chat completions endpoint
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'grok-beta',
        messages: messages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`xAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async streamChat(
    messages: Array<{ role: string; content: string }>,
    onToken: (token: string) => void,
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('xAI API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'grok-beta',
        messages: messages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`xAI API error: ${error.error?.message || response.statusText}`);
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
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices[0]?.delta?.content || '';
          if (token) {
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
