import { NextRequest, NextResponse } from 'next/server';
import { generateWithProvider, AIProvider } from '@/lib/ai-providers';
import { getCategoryById } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const { category, description, apiKey, provider = 'groq' } = await request.json();

    if (!category || !description) {
      return NextResponse.json(
        { error: 'Category and description are required' },
        { status: 400 }
      );
    }

    const categoryData = getCategoryById(category);
    if (!categoryData) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const prompt = await generateWithProvider(
      categoryData.systemPrompt,
      description,
      provider as AIProvider,
      apiKey
    );
    
    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}