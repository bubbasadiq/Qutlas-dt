// Custom Deepseek provider that calls API directly
// Bypasses the non-existent @ai-sdk/deepseek package

export async function callDeepseek(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    console.error('❌ DEEPSEEK_API_KEY environment variable is not set')
    throw new Error(
      'DEEPSEEK_API_KEY is not configured. Please set it in .env.local'
    )
  }

  try {
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
      const errorText = await response.text()
      console.error('❌ Deepseek API Error:', errorText)
      throw new Error(`Deepseek API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No response content from Deepseek API')
    }

    return content
  } catch (error) {
    console.error('❌ Deepseek API call failed:', error)
    throw error
  }
}

export async function parseIntentWithDeepseek(
  userIntent: string,
  systemPrompt: string
): Promise<string> {
  console.log('🔄 Parsing intent with Deepseek...')
  
  const response = await callDeepseek([
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Parse this CAD intent into structured JSON:\n\n${userIntent}`,
    },
  ])

  console.log('✅ Intent parsed successfully')
  return response
}
