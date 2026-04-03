import Groq from 'groq-sdk';
import OpenAI from 'openai';

export type AIProvider = 'groq' | 'openai' | 'anthropic';

export interface ProviderConfig {
  id: AIProvider;
  name: string;
  icon: string;
  defaultModel: string;
  requiresApiKey: boolean;
}

export const providers: ProviderConfig[] = [
  { id: 'groq', name: 'Groq', icon: '⚡', defaultModel: 'llama-3.1-8b-instant', requiresApiKey: false },
  { id: 'openai', name: 'OpenAI', icon: '🔵', defaultModel: 'gpt-4o-mini', requiresApiKey: true },
  { id: 'anthropic', name: 'Anthropic', icon: '🟤', defaultModel: 'claude-3-haiku-20240307', requiresApiKey: true },
];

export function getProviderModel(provider: AIProvider): string {
  const p = providers.find(p => p.id === provider);
  return p?.defaultModel || 'llama-3.1-8b-instant';
}

export async function generateWithProvider(
  systemPrompt: string,
  userDescription: string,
  provider: AIProvider,
  apiKey?: string
): Promise<string> {
  switch (provider) {
    case 'groq':
      return generateWithGroq(systemPrompt, userDescription, apiKey);
    case 'openai':
      return generateWithOpenAI(systemPrompt, userDescription, apiKey);
    case 'anthropic':
      return generateWithAnthropic(systemPrompt, userDescription, apiKey);
    default:
      return generateWithGroq(systemPrompt, userDescription, apiKey);
  }
}

async function generateWithGroq(systemPrompt: string, userDescription: string, apiKey?: string): Promise<string> {
  const groq = new Groq({
    apiKey: apiKey || process.env.GROQ_API_KEY || '',
  });

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Descripción del usuario: ${userDescription}\n\nGenera un prompt profesional y detallado.` },
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.7,
    max_tokens: 1500,
  });

  return completion.choices[0]?.message?.content || 'No se pudo generar el prompt';
}

async function generateWithOpenAI(systemPrompt: string, userDescription: string, apiKey?: string): Promise<string> {
  const openai = new OpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY || '',
  });

  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Descripción del usuario: ${userDescription}\n\nGenera un prompt profesional y detallado.` },
    ],
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 1500,
  });

  return completion.choices[0]?.message?.content || 'No se pudo generar el prompt';
}

async function generateWithAnthropic(systemPrompt: string, userDescription: string, apiKey?: string): Promise<string> {
  const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `Descripción del usuario: ${userDescription}\n\nGenera un prompt profesional y detallado.` },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || 'No se pudo generar el prompt';
}