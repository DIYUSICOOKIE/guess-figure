import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const FIGURE_GEN_PROMPT = `你是一个中国历史专家。请随机生成一个中国古代人物（公元前到清朝），尽量避免过于知名的人物（如李白、诸葛亮这类），选择一些有趣但不太常被提及的人物。

请以JSON格式返回（不要包含其他内容）：
{
  "name": "人物姓名",
  "context": "简要描述（朝代、身份、主要事迹，50字以内）"
}`;

export async function generateFigure(
  previousFigures: string[]
): Promise<{ name: string; context: string }> {
  const avoidList =
    previousFigures.length > 0
      ? `\n请避免以下已出现过的人物：${previousFigures.join('、')}`
      : '';

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    temperature: 1.0,
    system: '你是一个中国历史专家。只返回JSON，不返回其他内容。',
    messages: [{ role: 'user', content: FIGURE_GEN_PROMPT + avoidList }],
  });

  const text = msg.content[0]?.type === 'text' ? msg.content[0].text : '';
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
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 50,
    temperature: 0,
    system: `你正在想一个历史人物：${figureName}（${figureContext}）。用户会问关于这个人物的问题。你只能用以下五个回答之一来回复：是、不是、不确定、无关、猜对了。

规则：
- 如果用户准确说出了这个人物的姓名（包括字号、别称等常见称呼），回答"猜对了"
- 如果用户的问题与人物无关（如问朝代但人物生活在多朝代交替期），回答"不确定"
- 如果用户的问题与人物完全不相关，回答"无关"
- 如果用户的问题与人物相关且你确定答案，回答"是"或"不是"
- 只回复一个字或词，不解释`,
    messages: [{ role: 'user', content: question }],
  });

  const text = msg.content[0]?.type === 'text' ? msg.content[0].text : '';
  return text.trim().replace(/[。，.!！?？]/g, '');
}
