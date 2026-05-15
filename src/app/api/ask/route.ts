import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import { answerQuestion } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, question, userNickname, userAvatar } = body;

    if (!sessionId || !question || !userNickname || !userAvatar) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const supabase = getServerClient();

    // 原子锁：将 status 从 playing 改为 processing
    const { data: locked } = await supabase
      .from('game_state')
      .update({ status: 'locked' })
      .eq('id', sessionId)
      .eq('status', 'playing')
      .select('id, current_figure, figure_context, question_count')
      .single();

    if (!locked) {
      return NextResponse.json(
        { error: '正在处理中，请稍后' },
        { status: 409 }
      );
    }

    // 调用 AI
    let aiAnswer: string;
    try {
      aiAnswer = await answerQuestion(
        locked.current_figure,
        locked.figure_context,
        question
      );
    } catch {
      await supabase
        .from('game_state')
        .update({ status: 'playing' })
        .eq('id', sessionId);
      return NextResponse.json(
        { error: 'AI 响应失败，请重试' },
        { status: 500 }
      );
    }

    const isCorrect = aiAnswer.includes('猜对了');
    const seqNum = locked.question_count + 1;

    // 保存问答
    const { data: savedQuestion, error: insertError } = await supabase
      .from('questions')
      .insert({
        session_id: sessionId,
        sequence_num: seqNum,
        user_nickname: userNickname,
        user_avatar: userAvatar,
        question_text: question,
        ai_answer: aiAnswer,
        is_correct: isCorrect,
      })
      .select()
      .single();

    if (insertError) {
      await supabase
        .from('game_state')
        .update({ status: 'playing' })
        .eq('id', sessionId);
      return NextResponse.json({ error: '保存失败' }, { status: 500 });
    }

    // 更新游戏状态
    const updates: Record<string, unknown> = {
      question_count: seqNum,
      status: isCorrect ? 'completed' : 'playing',
    };
    if (isCorrect) updates.guessed_by = userNickname;

    await supabase.from('game_state').update(updates).eq('id', sessionId);

    return NextResponse.json({
      question: savedQuestion,
      isCorrect,
      figureName: isCorrect ? locked.current_figure : undefined,
    });
  } catch (err) {
    console.error('/api/ask error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
