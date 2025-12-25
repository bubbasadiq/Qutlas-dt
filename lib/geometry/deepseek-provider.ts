// Custom Deepseek Provider - Direct API integration bypassing @ai-sdk/deepseek
// This module provides direct access to Deepseek's chat completions API

interface DeepseekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepseekResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

/**
 * Calls Deepseek's chat completions API directly
 * @param messages - Array of conversation messages
 * @returns The content of the AI's response
 */
export async function callDeepseek(messages: DeepseekMessage[]): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured in environment variables')
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Deepseek API error (${response.status}): ${error}`)
  }

  const data: DeepseekResponse = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('No content returned from Deepseek API')
  }

  return content
}

/**
 * Parse user intent using Deepseek
 * Used for converting natural language to structured geometry specs
 */
export async function parseIntentWithDeepseek(
  userIntent: string,
  systemPrompt: string
): Promise<string> {
  return callDeepseek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Parse this CAD intent into structured JSON:\n\n${userIntent}` },
  ])
}

/**
 * Refine existing geometry based on user feedback
 * Used for iterative design modifications
 */
export async function refineIntentWithDeepseek(
  refinementPrompt: string,
  systemPrompt: string
): Promise<string> {
  return callDeepseek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: refinementPrompt },
  ])
}
