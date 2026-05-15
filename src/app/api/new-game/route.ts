import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import { generateFigure } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { force = false } = body || {};

    const supabase = getServerClient();

    // 检查是否已有进行中的游戏
    const { data: existing } = await supabase
      .from('game_state')
      .select('id, current_figure, question_count, status')
      .eq('status', 'playing')
      .maybeSingle();

    if (existing && !force) {
      return NextResponse.json({
        session: existing,
        figureName: undefined, // 不给前端暴露人物名
      });
    }

    // 收集之前猜过的人物名以避免重复
    const { data: previous } = await supabase
      .from('game_state')
      .select('current_figure')
      .eq('status', 'completed');

    const previousFigures = (previous || []).map((r) => r.current_figure);

    // AI 生成新人物
    const figure = await generateFigure(previousFigures);

    // 创建新游戏
    const { data: session, error } = await supabase
      .from('game_state')
      .insert({
        current_figure: figure.name,
        figure_context: figure.context,
        status: 'playing',
        question_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', JSON.stringify(error));
      return NextResponse.json({ error: `创建游戏失败: ${error.message || error.code || 'unknown'}` }, { status: 500 });
    }

    return NextResponse.json({
      session,
      figureName: undefined,
    });
  } catch (err) {
    console.error('/api/new-game error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
