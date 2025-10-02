import OpenAI from "openai";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function writeInWRMVoice(input: {
  context: string;
  incoming: string;
  goal: "dm" | "comment";
}) {
  const prompt = `
You are Marco, Stephanie's sassy bold assistant.
Rules
1. No em dashes ever
2. Be bold, warm, and premium
3. Short sentences
4. Always invite a next step when the goal is dm
5. Stay inclusive. Avoid slang that can alienate

Context
${input.context}

Incoming
${input.incoming}

Write a ${input.goal} reply in 60 to 120 words.
`;
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}

export interface CommentRequest {
  postContent: string;
  postType: 'photo' | 'video' | 'carousel';
  userContext?: string;
  brandVoice?: string;
}

export interface MessageRequest {
  messageContent: string;
  conversationHistory?: string[];
  userProfile?: string;
}

export class OpenAIService {
  static async generateComment(request: CommentRequest): Promise<string> {
    try {
      const context = `
        Post Content: ${request.postContent}
        Post Type: ${request.postType}
        ${request.userContext ? `User Context: ${request.userContext}` : ''}
        ${request.brandVoice ? `Brand Voice: ${request.brandVoice}` : ''}
      `;

      return await writeInWRMVoice({
        context,
        incoming: request.postContent,
        goal: "comment"
      });
    } catch (error) {
      console.error('Error generating comment:', error);
      throw new Error('Failed to generate comment');
    }
  }

  static async generateReply(request: MessageRequest): Promise<string> {
    try {
      const context = `
        ${request.conversationHistory ? `Conversation History: ${request.conversationHistory.join('\n')}` : ''}
        ${request.userProfile ? `User Profile: ${request.userProfile}` : ''}
      `;

      return await writeInWRMVoice({
        context,
        incoming: request.messageContent,
        goal: "dm"
      });
    } catch (error) {
      console.error('Error generating reply:', error);
      throw new Error('Failed to generate reply');
    }
  }

  static async analyzeEngagement(postData: any): Promise<{
    shouldEngage: boolean;
    engagementType: 'comment' | 'like' | 'follow' | 'none';
    reasoning: string;
  }> {
    const prompt = `
      Analyze this Instagram post data and determine if we should engage:
      
      Post Data: ${JSON.stringify(postData, null, 2)}
      
      Consider:
      - Content relevance to our brand
      - User engagement level
      - Post performance metrics
      - User relationship status
      
      Return a JSON object with:
      - shouldEngage: boolean
      - engagementType: 'comment' | 'like' | 'follow' | 'none'
      - reasoning: string explaining the decision
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content?.trim();
      return JSON.parse(response || '{"shouldEngage": false, "engagementType": "none", "reasoning": "No response"}');
    } catch (error) {
      console.error('Error analyzing engagement:', error);
      return {
        shouldEngage: false,
        engagementType: 'none',
        reasoning: 'Error in analysis'
      };
    }
  }
}
