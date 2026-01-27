
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ParsedSMS {
  amount: number;
  vendor: string;
  type: 'EXPENSE' | 'INCOME';
  suggestedPillarId?: string;
  date: string;
}

/**
 * دالة مساعدة لتنظيف نصوص JSON التي قد يعيدها النموذج داخل علامات التحديد
 */
const cleanJsonString = (str: string): string => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

/**
 * تحليل الرسائل البنكية باستخدام Gemini 3 Flash لضمان السرعة والدقة
 */
export const parseBankSMS = async (smsContent: string, pillars: any[]): Promise<ParsedSMS | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // استخدام فلاش للسرعة وتجنب تعليق الواجهة
      contents: `قم بتحليل هذه الرسالة البنكية واستخراج البيانات المالية منها: "${smsContent}".
      التصنيفات المتاحة: ${JSON.stringify(pillars.map(p => ({id: p.id, name: p.name})))}.
      يجب أن تعيد JSON فقط يحتوي على:
      1. amount: المبلغ كرقم.
      2. vendor: اسم الجهة (مثل فودافون، سوبر ماركت، إيداع نقدي).
      3. type: إما "EXPENSE" للمصروفات أو "INCOME" للإيداعات.
      4. suggestedPillarId: معرف الركيزة الأنسب من القائمة المعطاة.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            vendor: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['EXPENSE', 'INCOME'] },
            suggestedPillarId: { type: Type.STRING },
          },
          required: ['amount', 'vendor', 'type'],
        },
      },
    });

    const cleanedText = cleanJsonString(response.text || '{}');
    const data = JSON.parse(cleanedText);
    
    return {
      amount: Math.abs(data.amount) || 0,
      vendor: (data.vendor || "معاملة بنكية").substring(0, 40),
      type: data.type || 'EXPENSE',
      suggestedPillarId: data.suggestedPillarId || pillars[0]?.id,
      date: new Date().toISOString()
    };
  } catch (error) {
    console.error("Gemini SMS parsing failed:", error);
    
    // الفشل الآمن: محاولة استخراج الرقم بالركس (Regex) لتجنب توقف البرنامج
    const amountRegex = /([\d,.]+)/;
    const amountMatch = smsContent.match(amountRegex);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

    return {
      amount,
      vendor: "معاملة غير معروفة",
      type: /deposit|credited|إيداع|تم إضافة/.test(smsContent) ? 'INCOME' : 'EXPENSE',
      suggestedPillarId: pillars[0]?.id,
      date: new Date().toISOString()
    };
  }
};

export const getFinancialAdvice = async (summary: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `بناءً على البيانات المالية التالية، قدم نصيحة مالية واحدة مركزة ومحفزة باللغة العربية: ${summary}`,
      config: {
        systemInstruction: "أنت مستشار مالي ذكي. قدم نصيحة واحدة فقط، قصيرة جداً (أقل من 20 كلمة)، ومباشرة.",
      },
    });
    
    return response.text || "حافظ على توازن مصروفاتك لتحقيق أهدافك المالية.";
  } catch (error) {
    return "استمر في مراقبة ميزانيتك بدقة لتحقيق استقرار مالي.";
  }
};
