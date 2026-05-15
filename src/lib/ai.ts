const API_KEY = process.env.DEEPSEEK_API_KEY!;
const API_URL = 'https://api.deepseek.com/chat/completions';

async function chat(
  systemPrompt: string,
  userMessage: string,
  opts: { maxTokens?: number; temperature?: number } = {}
) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: opts.maxTokens ?? 256,
      temperature: opts.temperature ?? 0,
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

type Difficulty = 'easy' | 'normal' | 'hard';

const DIFFICULTY_PROMPTS: Record<Difficulty, string> = {
  easy: '请选择一位知名度很高的中国古代人物（如诸葛亮、李白、武则天、秦始皇等在普通大众中广为人知的人物，公元前到清朝）。',
  normal: '请选择一位有一定知名度的中国古代人物（对中国历史有一定了解的人会知道，但不算家喻户晓的人物，公元前到清朝）。',
  hard: '请选择一位较为冷门的中国古代人物（只有专门了解过中国历史的人才知道的冷门人物，公元前到清朝，尽量避免过于知名的人物）。',
};

export async function generateFigure(
  previousFigures: string[],
  difficulty: Difficulty = 'normal'
): Promise<{ name: string; context: string }> {
  const avoidList =
    previousFigures.length > 0
      ? `\n请避免以下已出现过的人物：${previousFigures.join('、')}`
      : '';

  const prompt = `${DIFFICULTY_PROMPTS[difficulty]}

请以JSON格式返回（不要包含其他内容）：
{
  "name": "人物姓名",
  "context": "简要描述（朝代、身份、主要事迹，50字以内）"
}`;

  const text = await chat(
    '你是一个中国历史专家。只返回JSON，不返回其他内容。',
    prompt + avoidList,
    { temperature: 1.0 }
  );

  const cleaned = text
    .replace(/```(?:json)?\s*\n?/g, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('AI 人物生成失败');
  }
}

export async function answerQuestion(
  figureName: string,
  figureContext: string,
  question: string
): Promise<string> {
  const systemPrompt = `你正在想一个历史人物：${figureName}（${figureContext}）。用户会问关于这个人物的问题。你只能用以下五个回答之一来回复：是、不是、不确定、无关、猜对了。

规则：
- 如果用户准确说出了这个人物的姓名（包括字号、别称等常见称呼），回答"猜对了"
- 如果用户的问题与人物无关（如问朝代但人物生活在多朝代交替期），回答"不确定"
- 如果用户的问题与人物完全不相关，回答"无关"
- 如果用户的问题与人物相关且你确定答案，回答"是"或"不是"
- 只回复一个字或词，不解释`;

  const text = await chat(systemPrompt, question, { maxTokens: 50, temperature: 0 });
  return text.trim().replace(/[。，.!！?？]/g, '');
}
