export const WRM_CONTEXT = `
You are writing as Stephanie Rose of West Rose Media in Calgary.
Tone
Bold. Premium. Warm. Zero fluff. No em dashes.
Audience
High achieving online coaches and service brands. Time poor. Value quality.
Positioning
Partner. Thought leader. Creative director. You run content so their vision stays alive without them chasing it.
Offers
Spotlight. Lite. Immersion. ICON Brand Partner.
`;

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: 'comment' | 'message' | 'engagement' | 'follow_up';
}

export class PromptService {
  private static prompts: PromptTemplate[] = [
    {
      id: 'friendly_comment',
      name: 'Friendly Comment',
      description: 'A warm, friendly comment that builds rapport',
      template: 'Hey {username}! {personalized_message} {emoji}',
      variables: ['username', 'personalized_message', 'emoji'],
      category: 'comment',
    },
    {
      id: 'question_comment',
      name: 'Question Comment',
      description: 'A comment that asks an engaging question',
      template: 'Love this! {question} {emoji}',
      variables: ['question', 'emoji'],
      category: 'comment',
    },
    {
      id: 'compliment_comment',
      name: 'Compliment Comment',
      description: 'A genuine compliment about the content',
      template: 'This is {compliment}! {additional_comment} {emoji}',
      variables: ['compliment', 'additional_comment', 'emoji'],
      category: 'comment',
    },
    {
      id: 'value_add_comment',
      name: 'Value-Add Comment',
      description: 'A comment that adds value or insight',
      template: 'Great point! {value_add} {emoji}',
      variables: ['value_add', 'emoji'],
      category: 'comment',
    },
    {
      id: 'welcome_message',
      name: 'Welcome Message',
      description: 'A welcoming message for new followers',
      template: 'Hey {username}! Thanks for following! {welcome_content} {emoji}',
      variables: ['username', 'welcome_content', 'emoji'],
      category: 'message',
    },
    {
      id: 'help_response',
      name: 'Help Response',
      description: 'A helpful response to questions or requests',
      template: 'Hi {username}! {helpful_response} Let me know if you need anything else! {emoji}',
      variables: ['username', 'helpful_response', 'emoji'],
      category: 'message',
    },
    {
      id: 'follow_up_message',
      name: 'Follow-up Message',
      description: 'A follow-up message to continue conversations',
      template: 'Hey {username}! {follow_up_content} {emoji}',
      variables: ['username', 'follow_up_content', 'emoji'],
      category: 'follow_up',
    },
    {
      id: 'engagement_boost',
      name: 'Engagement Boost',
      description: 'A comment designed to boost engagement',
      template: '{engagement_hook} {call_to_action} {emoji}',
      variables: ['engagement_hook', 'call_to_action', 'emoji'],
      category: 'engagement',
    },
  ];

  static getPrompt(promptId: string): PromptTemplate | undefined {
    return this.prompts.find(p => p.id === promptId);
  }

  static getAllPrompts(): PromptTemplate[] {
    return this.prompts;
  }

  static getPromptsByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return this.prompts.filter(p => p.category === category);
  }

  static generateCommentPrompt(
    postContent: string,
    postType: 'photo' | 'video' | 'carousel',
    userContext?: string,
    brandVoice?: string
  ): string {
    return `
      Generate an engaging Instagram comment for this ${postType} post:
      
      Post Content: "${postContent}"
      ${userContext ? `User Context: ${userContext}` : ''}
      ${brandVoice ? `Brand Voice: ${brandVoice}` : ''}
      
      Requirements:
      - Keep it under 150 characters
      - Sound natural and human-like
      - Be relevant to the content
      - Include 1-2 appropriate emojis
      - Avoid generic responses like "Nice!" or "Great post!"
      - Make it engaging and likely to get a response
      
      Return only the comment text, no quotes or explanations.
    `;
  }

  static generateMessagePrompt(
    messageContent: string,
    conversationHistory?: string[],
    userProfile?: string
  ): string {
    return `
      Generate a helpful, engaging reply to this Instagram message:
      
      Message: "${messageContent}"
      ${conversationHistory ? `Conversation History:\n${conversationHistory.join('\n')}` : ''}
      ${userProfile ? `User Profile: ${userProfile}` : ''}
      
      Requirements:
      - Be helpful and friendly
      - Keep it conversational and personal
      - Address their specific question/comment
      - Include relevant emojis (1-2 max)
      - Keep under 200 characters
      - If they're asking for help, provide value
      - If they're complimenting, acknowledge and engage
      
      Return only the reply text, no quotes or explanations.
    `;
  }

  static generateEngagementAnalysisPrompt(postData: any): string {
    return `
      Analyze this Instagram post and determine if we should engage:
      
      Post Data: ${JSON.stringify(postData, null, 2)}
      
      Consider these factors:
      - Content relevance to our brand/niche
      - User's engagement level and follower count
      - Post performance metrics (likes, comments, recency)
      - User's relationship with our brand
      - Content quality and authenticity
      - Hashtag relevance
      
      Return a JSON object with:
      {
        "shouldEngage": boolean,
        "engagementType": "comment" | "like" | "follow" | "none",
        "confidence": number (0-100),
        "reasoning": "explanation of decision",
        "suggestedComment": "if engagementType is comment, provide a suggested comment"
      }
    `;
  }

  static generateLeadQualificationPrompt(
    userProfile: any,
    interactionHistory: string[]
  ): string {
    return `
      Analyze this Instagram user to determine if they're a qualified lead:
      
      User Profile: ${JSON.stringify(userProfile, null, 2)}
      Interaction History: ${interactionHistory.join('\n')}
      
      Evaluate based on:
      - Follower count and engagement rate
      - Bio and profile information
      - Content quality and relevance
      - Interaction patterns
      - Potential for conversion
      
      Return a JSON object with:
      {
        "isQualified": boolean,
        "leadScore": number (0-100),
        "reasoning": "explanation of qualification",
        "suggestedNextAction": "what to do next",
        "tags": ["array", "of", "relevant", "tags"]
      }
    `;
  }

  static generateContentIdeasPrompt(
    niche: string,
    targetAudience: string,
    contentType: 'post' | 'story' | 'reel'
  ): string {
    return `
      Generate 5 creative content ideas for Instagram ${contentType}:
      
      Niche: ${niche}
      Target Audience: ${targetAudience}
      
      Requirements:
      - Each idea should be engaging and shareable
      - Include a catchy caption concept
      - Suggest relevant hashtags
      - Consider trending topics
      - Make it authentic to the brand voice
      
      Return as a JSON array:
      [
        {
          "title": "Content idea title",
          "description": "Brief description",
          "caption": "Suggested caption",
          "hashtags": ["#hashtag1", "#hashtag2"],
          "engagement_tip": "How to boost engagement"
        }
      ]
    `;
  }

  static generateHashtagResearchPrompt(
    niche: string,
    targetAudience: string,
    postContent: string
  ): string {
    return `
      Research and suggest relevant hashtags for this Instagram post:
      
      Niche: ${niche}
      Target Audience: ${targetAudience}
      Post Content: "${postContent}"
      
      Provide:
      - 5 high-volume hashtags (1M+ posts)
      - 5 medium-volume hashtags (100K-1M posts)
      - 5 low-volume hashtags (10K-100K posts)
      - 5 niche-specific hashtags
      - 5 trending hashtags (if applicable)
      
      Return as JSON:
      {
        "high_volume": ["#hashtag1", "#hashtag2"],
        "medium_volume": ["#hashtag3", "#hashtag4"],
        "low_volume": ["#hashtag5", "#hashtag6"],
        "niche_specific": ["#hashtag7", "#hashtag8"],
        "trending": ["#hashtag9", "#hashtag10"]
      }
    `;
  }

  static addCustomPrompt(prompt: Omit<PromptTemplate, 'id'>): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPrompt: PromptTemplate = {
      ...prompt,
      id,
    };
    
    this.prompts.push(newPrompt);
    return id;
  }

  static updatePrompt(promptId: string, updates: Partial<PromptTemplate>): boolean {
    const index = this.prompts.findIndex(p => p.id === promptId);
    if (index !== -1) {
      this.prompts[index] = { ...this.prompts[index], ...updates };
      return true;
    }
    return false;
  }

  static deletePrompt(promptId: string): boolean {
    const index = this.prompts.findIndex(p => p.id === promptId);
    if (index !== -1) {
      this.prompts.splice(index, 1);
      return true;
    }
    return false;
  }
}