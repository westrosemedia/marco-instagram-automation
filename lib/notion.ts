import { Client } from "@notionhq/client";

export const notion = new Client({ auth: process.env.NOTION_SECRET! });
const db = process.env.NOTION_DB_ID!;

export async function upsertLead(input: {
  handle: string;
  platform: "instagram";
  source: "comment" | "dm" | "outbound";
  lastMessage?: string;
  status?: "new" | "warm" | "replied" | "booked";
}) {
  const q = await notion.databases.query({
    database_id: db,
    filter: { property: "Handle", rich_text: { equals: input.handle } },
  });

  const props: any = {
    Name: { title: [{ text: { content: input.handle } }] },
    Platform: { select: { name: input.platform } },
    Source: { select: { name: input.source } },
    Status: { select: { name: input.status ?? "new" } },
    "Last Message": input.lastMessage
      ? { rich_text: [{ text: { content: input.lastMessage } }] }
      : undefined,
  };

  if (q.results[0]) {
    return notion.pages.update({
      page_id: q.results[0].id,
      properties: props,
    });
  }

  return notion.pages.create({
    parent: { database_id: db },
    properties: props,
  });
}

export interface Lead {
  id: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  source: 'instagram_comment' | 'instagram_message' | 'instagram_follow' | 'manual';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes?: string;
  last_interaction?: string;
  created_at: string;
  updated_at: string;
}

export class NotionService {
  private notion: Client;
  private databaseId: string;

  constructor() {
    this.notion = new Client({
      auth: process.env.NOTION_SECRET,
    });
    this.databaseId = process.env.NOTION_DB_ID || '';
  }

  async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    try {
      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databaseId,
        },
        properties: {
          Username: {
            title: [
              {
                text: {
                  content: lead.username,
                },
              },
            ],
          },
          Name: {
            rich_text: lead.name ? [
              {
                text: {
                  content: lead.name,
                },
              },
            ] : [],
          },
          Email: {
            email: lead.email || null,
          },
          Phone: {
            phone_number: lead.phone || null,
          },
          Source: {
            select: {
              name: lead.source,
            },
          },
          Status: {
            select: {
              name: lead.status,
            },
          },
          Notes: {
            rich_text: lead.notes ? [
              {
                text: {
                  content: lead.notes,
                },
              },
            ] : [],
          },
          'Last Interaction': {
            date: lead.last_interaction ? {
              start: lead.last_interaction,
            } : null,
          },
          'Created At': {
            date: {
              start: new Date().toISOString(),
            },
          },
          'Updated At': {
            date: {
              start: new Date().toISOString(),
            },
          },
        },
      });

      return {
        id: response.id,
        username: lead.username,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
        notes: lead.notes,
        last_interaction: lead.last_interaction,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating lead in Notion:', error);
      throw new Error('Failed to create lead');
    }
  }

  async getLeads(): Promise<Lead[]> {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        sorts: [
          {
            property: 'Created At',
            direction: 'descending',
          },
        ],
      });

      return response.results.map((page: any) => ({
        id: page.id,
        username: page.properties.Username?.title?.[0]?.text?.content || '',
        name: page.properties.Name?.rich_text?.[0]?.text?.content,
        email: page.properties.Email?.email,
        phone: page.properties.Phone?.phone_number,
        source: page.properties.Source?.select?.name || 'manual',
        status: page.properties.Status?.select?.name || 'new',
        notes: page.properties.Notes?.rich_text?.[0]?.text?.content,
        last_interaction: page.properties['Last Interaction']?.date?.start,
        created_at: page.properties['Created At']?.date?.start || '',
        updated_at: page.properties['Updated At']?.date?.start || '',
      }));
    } catch (error) {
      console.error('Error fetching leads from Notion:', error);
      throw new Error('Failed to fetch leads');
    }
  }

  async updateLead(leadId: string, updates: Partial<Lead>): Promise<Lead> {
    try {
      const properties: any = {};

      if (updates.username) {
        properties.Username = {
          title: [
            {
              text: {
                content: updates.username,
              },
            },
          ],
        };
      }

      if (updates.name !== undefined) {
        properties.Name = {
          rich_text: updates.name ? [
            {
              text: {
                content: updates.name,
              },
            },
          ] : [],
        };
      }

      if (updates.email !== undefined) {
        properties.Email = {
          email: updates.email || null,
        };
      }

      if (updates.phone !== undefined) {
        properties.Phone = {
          phone_number: updates.phone || null,
        };
      }

      if (updates.source) {
        properties.Source = {
          select: {
            name: updates.source,
          },
        };
      }

      if (updates.status) {
        properties.Status = {
          select: {
            name: updates.status,
          },
        };
      }

      if (updates.notes !== undefined) {
        properties.Notes = {
          rich_text: updates.notes ? [
            {
              text: {
                content: updates.notes,
              },
            },
          ] : [],
        };
      }

      if (updates.last_interaction) {
        properties['Last Interaction'] = {
          date: {
            start: updates.last_interaction,
          },
        };
      }

      properties['Updated At'] = {
        date: {
          start: new Date().toISOString(),
        },
      };

      await this.notion.pages.update({
        page_id: leadId,
        properties,
      });

      // Return updated lead (you might want to fetch it again for accuracy)
      return {
        id: leadId,
        username: updates.username || '',
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        source: updates.source || 'manual',
        status: updates.status || 'new',
        notes: updates.notes,
        last_interaction: updates.last_interaction,
        created_at: '',
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error updating lead in Notion:', error);
      throw new Error('Failed to update lead');
    }
  }

  async getLeadByUsername(username: string): Promise<Lead | null> {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Username',
          title: {
            equals: username,
          },
        },
      });

      if (response.results.length === 0) {
        return null;
      }

      const page: any = response.results[0];
      return {
        id: page.id,
        username: page.properties.Username?.title?.[0]?.text?.content || '',
        name: page.properties.Name?.rich_text?.[0]?.text?.content,
        email: page.properties.Email?.email,
        phone: page.properties.Phone?.phone_number,
        source: page.properties.Source?.select?.name || 'manual',
        status: page.properties.Status?.select?.name || 'new',
        notes: page.properties.Notes?.rich_text?.[0]?.text?.content,
        last_interaction: page.properties['Last Interaction']?.date?.start,
        created_at: page.properties['Created At']?.date?.start || '',
        updated_at: page.properties['Updated At']?.date?.start || '',
      };
    } catch (error) {
      console.error('Error fetching lead by username:', error);
      return null;
    }
  }

  async deleteLead(leadId: string): Promise<void> {
    try {
      await this.notion.pages.update({
        page_id: leadId,
        archived: true,
      });
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw new Error('Failed to delete lead');
    }
  }
}
