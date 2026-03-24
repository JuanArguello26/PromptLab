import { NextRequest, NextResponse } from 'next/server';
import { generatePrompt } from '@/lib/openai';
import { getCategoryById } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const { category, description } = await request.json();

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

    const prompt = await generatePrompt(categoryData.systemPrompt, description);
    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
