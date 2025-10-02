import axios from 'axios';

export interface InstagramPost {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

export interface InstagramComment {
  id: string;
  text: string;
  timestamp: string;
  from: {
    id: string;
    username: string;
  };
}

export interface InstagramMessage {
  id: string;
  message: string;
  from: {
    id: string;
    username: string;
  };
  timestamp: string;
}

export class InstagramService {
  private accessToken: string;
  private userId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.accessToken = process.env.IG_ACCESS_TOKEN || '';
    this.userId = process.env.IG_USER_ID || '';
  }

  async getRecentPosts(limit: number = 10): Promise<InstagramPost[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.userId}/media`,
        {
          params: {
            fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
            limit,
            access_token: this.accessToken,
          },
        }
      );

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      throw new Error('Failed to fetch Instagram posts');
    }
  }

  async getPostComments(postId: string): Promise<InstagramComment[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${postId}/comments`,
        {
          params: {
            fields: 'id,text,timestamp,from{id,username}',
            access_token: this.accessToken,
          },
        }
      );

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching post comments:', error);
      throw new Error('Failed to fetch post comments');
    }
  }

  async postComment(postId: string, message: string): Promise<{ id: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${postId}/comments`,
        {
          message,
          access_token: this.accessToken,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error posting comment:', error);
      throw new Error('Failed to post comment');
    }
  }

  async likePost(postId: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${postId}/likes`,
        {
          access_token: this.accessToken,
        }
      );

      return { success: response.data.success || true };
    } catch (error) {
      console.error('Error liking post:', error);
      throw new Error('Failed to like post');
    }
  }

  async getMessages(): Promise<InstagramMessage[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.userId}/conversations`,
        {
          params: {
            fields: 'messages{id,message,from,timestamp}',
            access_token: this.accessToken,
          },
        }
      );

      // Flatten messages from conversations
      const messages: InstagramMessage[] = [];
      response.data.data?.forEach((conversation: any) => {
        if (conversation.messages?.data) {
          messages.push(...conversation.messages.data);
        }
      });

      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new Error('Failed to fetch messages');
    }
  }

  async sendMessage(recipientId: string, message: string): Promise<{ id: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/me/messages`,
        {
          recipient: { id: recipientId },
          message: { text: message },
          access_token: this.accessToken,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  async getUserInfo(userId: string): Promise<{
    id: string;
    username: string;
    name?: string;
    profile_picture_url?: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${userId}`,
        {
          params: {
            fields: 'id,username,name,profile_picture_url',
            access_token: this.accessToken,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw new Error('Failed to fetch user info');
    }
  }

  async searchHashtag(hashtag: string, limit: number = 10): Promise<InstagramPost[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/ig_hashtag_search`,
        {
          params: {
            user_id: this.userId,
            q: hashtag,
            access_token: this.accessToken,
          },
        }
      );

      const hashtagId = response.data.data?.[0]?.id;
      if (!hashtagId) return [];

      const mediaResponse = await axios.get(
        `${this.baseUrl}/${hashtagId}/recent_media`,
        {
          params: {
            user_id: this.userId,
            fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
            limit,
            access_token: this.accessToken,
          },
        }
      );

      return mediaResponse.data.data || [];
    } catch (error) {
      console.error('Error searching hashtag:', error);
      throw new Error('Failed to search hashtag');
    }
  }
}

// Additional functions needed for the app
export const TARGET_MEDIA_IDS = [
  "167044567309307", // Your target post ID
  // Add more Instagram post IDs here as needed
];

export async function getRecentComments(limit: number = 25): Promise<InstagramComment[]> {
  const instagramService = new InstagramService();
  const posts = await instagramService.getRecentPosts(10);
  const allComments: InstagramComment[] = [];
  
  for (const post of posts) {
    const comments = await instagramService.getPostComments(post.id);
    allComments.push(...comments);
  }
  
  return allComments.slice(0, limit);
}

export async function getRecentMessages(limit: number = 20): Promise<any[]> {
  const instagramService = new InstagramService();
  return await instagramService.getMessages();
}

export async function replyToComment(commentId: string, text: string): Promise<{ id: string }> {
  const instagramService = new InstagramService();
  return await instagramService.postComment(commentId, text);
}

export async function sendDM(userId: string, message: string): Promise<{ id: string }> {
  const instagramService = new InstagramService();
  return await instagramService.sendMessage(userId, message);
}

export async function getMediaComments(mediaId: string, limit: number = 10): Promise<InstagramComment[]> {
  const instagramService = new InstagramService();
  return await instagramService.getPostComments(mediaId);
}

export async function createComment(mediaId: string, text: string): Promise<{ id: string }> {
  const instagramService = new InstagramService();
  return await instagramService.postComment(mediaId, text);
}
