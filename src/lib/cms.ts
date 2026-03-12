import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface CMSContent {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  content_type: 'page' | 'post' | 'announcement' | 'faq';
  author_id: string;
  published_at?: string;
  metadata: Record<string, any>;
  tags: string[];
  seo_title?: string;
  seo_description?: string;
  featured_image?: string;
  created_at: string;
  updated_at: string;
}

export interface CMSContentVersion {
  id: string;
  content_id: string;
  version: number;
  title: string;
  content: string;
  excerpt?: string;
  metadata: Record<string, any>;
  created_at: string;
  created_by: string;
}

class CMSManager {
  async createContent(contentData: Omit<CMSContent, 'id' | 'created_at' | 'updated_at'>): Promise<CMSContent | null> {
    try {
      const supabase = createClient();

      const newContent = {
        ...contentData,
        id: `cms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('cms_content')
        .insert(newContent)
        .select()
        .single();

      if (error) {
        logger.error('Error creating CMS content:', error);
        return null;
      }

      // Create initial version
      await this.createVersion(data.id, contentData.author_id, {
        title: contentData.title,
        content: contentData.content,
        excerpt: contentData.excerpt,
        metadata: contentData.metadata,
      });

      return data as CMSContent;
    } catch (error) {
      logger.error('Error creating CMS content:', error);
      return null;
    }
  }

  async updateContent(contentId: string, updates: Partial<CMSContent>, authorId: string): Promise<CMSContent | null> {
    try {
      const supabase = createClient();

      // Get current content for versioning
      const { data: currentContent, error: fetchError } = await supabase
        .from('cms_content')
        .select('*')
        .eq('id', contentId)
        .single();

      if (fetchError || !currentContent) {
        logger.error('Error fetching current content:', fetchError);
        return null;
      }

      // Create version before updating
      if (updates.title || updates.content || updates.excerpt || updates.metadata) {
        await this.createVersion(contentId, authorId, {
          title: updates.title || currentContent.title,
          content: updates.content || currentContent.content,
          excerpt: updates.excerpt || currentContent.excerpt,
          metadata: updates.metadata || currentContent.metadata,
        });
      }

      // Update content
      const { data, error } = await supabase
        .from('cms_content')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating CMS content:', error);
        return null;
      }

      return data as CMSContent;
    } catch (error) {
      logger.error('Error updating CMS content:', error);
      return null;
    }
  }

  async getContent(slug: string): Promise<CMSContent | null> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('cms_content')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        logger.error('Error fetching CMS content:', error);
        return null;
      }

      return data as CMSContent;
    } catch (error) {
      logger.error('Error fetching CMS content:', error);
      return null;
    }
  }

  async getContentById(id: string): Promise<CMSContent | null> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('cms_content')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error('Error fetching CMS content by ID:', error);
        return null;
      }

      return data as CMSContent;
    } catch (error) {
      logger.error('Error fetching CMS content by ID:', error);
      return null;
    }
  }

  async listContent(filters: {
    content_type?: string;
    status?: string;
    author_id?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  } = {}): Promise<CMSContent[]> {
    try {
      const supabase = createClient();

      let query = supabase
        .from('cms_content')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filters.content_type) {
        query = query.eq('content_type', filters.content_type);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.author_id) {
        query = query.eq('author_id', filters.author_id);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error listing CMS content:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error listing CMS content:', error);
      return [];
    }
  }

  async publishContent(contentId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('cms_content')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentId);

      if (error) {
        logger.error('Error publishing CMS content:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error publishing CMS content:', error);
      return false;
    }
  }

  async archiveContent(contentId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('cms_content')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentId);

      if (error) {
        logger.error('Error archiving CMS content:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error archiving CMS content:', error);
      return false;
    }
  }

  async deleteContent(contentId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('cms_content')
        .delete()
        .eq('id', contentId);

      if (error) {
        logger.error('Error deleting CMS content:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error deleting CMS content:', error);
      return false;
    }
  }

  private async createVersion(
    contentId: string,
    authorId: string,
    versionData: {
      title: string;
      content: string;
      excerpt?: string;
      metadata: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const supabase = createClient();

      // Get next version number
      const { data: versions } = await supabase
        .from('cms_content_versions')
        .select('version')
        .eq('content_id', contentId)
        .order('version', { ascending: false })
        .limit(1);

      const nextVersion = (versions?.[0]?.version || 0) + 1;

      const version = {
        content_id: contentId,
        version: nextVersion,
        title: versionData.title,
        content: versionData.content,
        excerpt: versionData.excerpt,
        metadata: versionData.metadata,
        created_at: new Date().toISOString(),
        created_by: authorId,
      };

      const { error } = await supabase
        .from('cms_content_versions')
        .insert(version);

      if (error) {
        logger.error('Error creating content version:', error);
      }
    } catch (error) {
      logger.error('Error creating content version:', error);
    }
  }

  async getContentVersions(contentId: string): Promise<CMSContentVersion[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('cms_content_versions')
        .select('*')
        .eq('content_id', contentId)
        .order('version', { ascending: false });

      if (error) {
        logger.error('Error fetching content versions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching content versions:', error);
      return [];
    }
  }

  async restoreVersion(contentId: string, version: number, authorId: string): Promise<CMSContent | null> {
    try {
      const supabase = createClient();

      // Get the version to restore
      const { data: versionData, error: versionError } = await supabase
        .from('cms_content_versions')
        .select('*')
        .eq('content_id', contentId)
        .eq('version', version)
        .single();

      if (versionError || !versionData) {
        logger.error('Error fetching version to restore:', versionError);
        return null;
      }

      // Update content with version data
      return await this.updateContent(contentId, {
        title: versionData.title,
        content: versionData.content,
        excerpt: versionData.excerpt,
        metadata: versionData.metadata,
      }, authorId);
    } catch (error) {
      logger.error('Error restoring version:', error);
      return null;
    }
  }

  async searchContent(query: string, filters: {
    content_type?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<CMSContent[]> {
    try {
      const supabase = createClient();

      let searchQuery = supabase
        .from('cms_content')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
        .order('updated_at', { ascending: false });

      if (filters.content_type) {
        searchQuery = searchQuery.eq('content_type', filters.content_type);
      }

      if (filters.status) {
        searchQuery = searchQuery.eq('status', filters.status);
      }

      if (filters.limit) {
        searchQuery = searchQuery.limit(filters.limit);
      }

      const { data, error } = await searchQuery;

      if (error) {
        logger.error('Error searching CMS content:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error searching CMS content:', error);
      return [];
    }
  }
}

// Singleton instance
export const cms = new CMSManager();

// React hooks for CMS
import React from 'react';

export function useCMSContent(slug: string) {
  const [content, setContent] = React.useState<CMSContent | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await cms.getContent(slug);
        setContent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch content');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchContent();
    }
  }, [slug]);

  return { content, loading, error };
}

export function useCMSList(filters: Parameters<typeof cms.listContent>[0] = {}) {
  const [content, setContent] = React.useState<CMSContent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await cms.listContent(filters);
        setContent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [JSON.stringify(filters)]);

  return { content, loading, error };
}