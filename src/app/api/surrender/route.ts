import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch { /* empty body is ok */ }

    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: '缺少 sessionId' }, { status: 400 });
    }

    const supabase = getServerClient();

    const { data: game, error: fetchErr } = await supabase
      .from('game_state')
      .select('id, current_figure, question_count, status')
      .eq('id', sessionId)
      .single();

    if (fetchErr || !game) {
      return NextResponse.json({ error: '游戏不存在' }, { status: 404 });
    }

    if (game.status !== 'playing' && game.status !== 'locked') {
      return NextResponse.json({ error: '游戏已结束' }, { status: 400 });
    }

    const { error: updateErr } = await supabase
      .from('game_state')
      .update({ status: 'completed', guessed_by: '投降' })
      .eq('id', sessionId);

    if (updateErr) {
      return NextResponse.json({ error: '操作失败' }, { status: 500 });
    }

    return NextResponse.json({ figureName: game.current_figure });
  } catch (err) {
    console.error('/api/surrender error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
