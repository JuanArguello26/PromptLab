import Groq from 'groq-sdk';

export async function generatePrompt(systemPrompt: string, userDescription: string, customApiKey?: string): Promise<string> {
  const groq = new Groq({
    apiKey: customApiKey || process.env.GROQ_API_KEY || '',
  });

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Descripción del usuario: ${userDescription}\n\nGenera un prompt profesional y detallado basado en esta descripción.` },
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.7,
    max_tokens: 1500,
  });

  return completion.choices[0]?.message?.content || 'No se pudo generar el prompt';
}
