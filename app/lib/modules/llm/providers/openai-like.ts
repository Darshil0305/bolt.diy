// Install the OpenAI package: npm install openai
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.zukijourney.com/v1',
  apiKey: 'your-api-key-here',
});

async function main() {
  const response = await client.chat.completions.create({
    model: 'caramelldansen-1', // or gpt-4o-mini, claude-3-haiku, gemini-1.5-flash, etc...
    messages: [{ role: 'user', content: 'Hello, AI!' }],
  });

  console.log(response.choices[0].message.content);
}

main();
