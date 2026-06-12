import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { message, systemContext, language } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const systemPrompt = language === 'ar'
      ? `أنت مساعد ذكي متخصص في تصميم وتنفيذ المنظومات الشمسية الكهروضوئية. لديك خبرة واسعة في:
- تصميم المنظومات الشمسية (On-Grid, Off-Grid, Hybrid)
- حساب الأحمال الكهربائية وتحديد مكونات النظام
- اختيار الألواح الشمسية والبطاريات والعاكسات ومنظمات الشحن
- حساب الكابلات والحماية الكهربائية
- التحليل الاقتصادي ومقارنة التكاليف
- المعايير الدولية (IEC, NEC, IEEE) والممارسات الفضلى
- التركيب والصيانة والتشغيل
- السلامة الكهربائية في المنظومات الشمسية

${systemContext || ''}

أجب بشكل واضح ومنظم مع استخدام الأرقام والمعادلات عند الحاجة. إذا سُئلت عن شيء خارج تخصصك، وضح ذلك بلطف وأعد توجيه السؤال لمجالك.`
      : `You are an intelligent assistant specialized in the design and implementation of photovoltaic solar systems. You have extensive expertise in:
- Solar system design (On-Grid, Off-Grid, Hybrid)
- Electrical load calculations and system component sizing
- Selection of solar panels, batteries, inverters, and charge controllers
- Cable sizing and electrical protection
- Economic analysis and cost comparisons
- International standards (IEC, NEC, IEEE) and best practices
- Installation, maintenance, and commissioning
- Electrical safety in solar systems

${systemContext || ''}

Answer clearly and in an organized manner, using numbers and equations when needed. If asked about something outside your expertise, politely explain and redirect to your field.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const reply = completion.choices[0]?.message?.content || 'No response generated';

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error('AI Assistant error:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate response', details: errMsg },
      { status: 500 }
    );
  }
}
