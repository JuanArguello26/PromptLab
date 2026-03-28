import { NextRequest, NextResponse } from 'next/server';
import { generatePrompt } from '@/lib/openai';
import { getCategoryById } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const { category, description, apiKey } = await request.json();

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

    const finalApiKey = apiKey || process.env.GROQ_API_KEY;
    if (!finalApiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please add your Groq API key in settings.' },
        { status: 401 }
      );
    }

    const prompt = await generatePrompt(categoryData.systemPrompt, description, finalApiKey);
    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
