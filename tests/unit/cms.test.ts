import { cms, CMSContent } from '@/lib/cms';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } })),
    },
  })),
}));

// Helper to create a chainable mock that supports PostgREST-style chaining
function makeChain(result = null) {
  const obj: any = {};
  obj.select = jest.fn(() => obj);
  obj.eq = jest.fn(() => obj);
  obj.or = jest.fn(() => obj);
  obj.order = jest.fn(() => obj);
  obj.limit = jest.fn(() => Promise.resolve({ data: result, error: null }));
  obj.range = jest.fn(() => Promise.resolve({ data: result, error: null }));
  obj.single = jest.fn(() => Promise.resolve({ data: result, error: null }));
  obj.insert = jest.fn(() => obj);
  obj.update = jest.fn(() => obj);
  obj.delete = jest.fn(() => Promise.resolve({ data: result, error: null }));
  obj.overlaps = jest.fn(() => obj);
  return obj;
}

describe('CMS Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createContent', () => {
    it('should create content successfully', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          // Support insert chain
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: {
                  id: 'cms_test123',
                  slug: 'test-content',
                  title: 'Test Content',
                  content: 'Test content body',
                  status: 'draft',
                  content_type: 'page',
                  author_id: 'test-user',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null
              })),
            })),
          })),
          // Also support select chain for subsequent version queries
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
        })),
      };

      jest.mocked(require('@/lib/supabase/server').createClient).mockReturnValue(mockSupabase as any);

      const contentData = {
        slug: 'test-content',
        title: 'Test Content',
        content: 'Test content body',
        content_type: 'page' as const,
        author_id: 'test-user',
      };

      const result = await cms.createContent(contentData);
      expect(result).toBeTruthy();
      expect(result?.slug).toBe('test-content');
      expect(result?.title).toBe('Test Content');
    });

    it('should handle creation errors', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: new Error('DB Error') })),
            })),
          })),
        })),
      };

      jest.mocked(require('@/lib/supabase/server').createClient).mockReturnValue(mockSupabase as any);

      const contentData = {
        slug: 'test-content',
        title: 'Test Content',
        content: 'Test content body',
        content_type: 'page' as const,
        author_id: 'test-user',
      };

      const result = await cms.createContent(contentData);
      expect(result).toBeNull();
    });
  });

  describe('getContent', () => {
    it('should retrieve published content by slug', async () => {
      const mockContent: CMSContent = {
        id: 'cms_test123',
        slug: 'test-content',
        title: 'Test Content',
        content: 'Test content body',
        status: 'published',
        content_type: 'page',
        author_id: 'test-user',
        published_at: new Date().toISOString(),
        metadata: {},
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSupabase = {
        from: jest.fn(() => makeChain(mockContent)),
      };

      jest.mocked(require('@/lib/supabase/server').createClient).mockReturnValue(mockSupabase as any);

      const result = await cms.getContent('test-content');
      expect(result).toEqual(mockContent);
    });

    it('should return null for non-existent content', async () => {
      const mockSupabase = {
        from: jest.fn(() => makeChain(null)),
      };

      jest.mocked(require('@/lib/supabase/server').createClient).mockReturnValue(mockSupabase as any);

      const result = await cms.getContent('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('updateContent', () => {
    it('should update content successfully', async () => {
      const existingContent: CMSContent = {
        id: 'cms_test123',
        slug: 'test-content',
        title: 'Old Title',
        content: 'Old content',
        status: 'draft',
        content_type: 'page',
        author_id: 'test-user',
        metadata: {},
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSupabase = {
        from: jest.fn()
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: existingContent, error: null })),
              })),
            })),
          })
          // For createVersion: versions query
          .mockReturnValueOnce(makeChain([]))
          // For createVersion: insert new version
          .mockReturnValueOnce({
            insert: jest.fn(() => Promise.resolve({ error: null })),
          })
          // For the update() call
          .mockReturnValueOnce({
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({
                    data: { ...existingContent, title: 'New Title' },
                    error: null
                  })),
                })),
              })),
            })),
          }),
      };

      jest.mocked(require('@/lib/supabase/server').createClient).mockReturnValue(mockSupabase as any);

      const updates = { title: 'New Title' };
      const result = await cms.updateContent('cms_test123', updates, 'test-user');

      expect(result).toBeTruthy();
      expect(result?.title).toBe('New Title');
    });
  });

  describe('listContent', () => {
    it('should list content with filters', async () => {
      const mockContent: CMSContent[] = [
        {
          id: 'cms_test123',
          slug: 'test-content',
          title: 'Test Content',
          content: 'Test content body',
          status: 'published',
          content_type: 'page',
          author_id: 'test-user',
          published_at: new Date().toISOString(),
          metadata: {},
          tags: ['test'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockSupabase = {
        from: jest.fn(() => makeChain(mockContent)),
      };

      jest.mocked(require('@/lib/supabase/server').createClient).mockReturnValue(mockSupabase as any);

      const filters = { status: 'published', limit: 10 };
      const result = await cms.listContent(filters);

      expect(result).toEqual(mockContent);
      expect(result).toHaveLength(1);
    });
  });

  describe('publishContent', () => {
    it('should publish content successfully', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      };

      jest.mocked(require('@/lib/supabase/server').createClient).mockReturnValue(mockSupabase as any);

      const success = await cms.publishContent('cms_test123');
      expect(success).toBe(true);
    });

    it('should handle publish errors', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: new Error('DB Error') })),
          })),
        })),
      };

      jest.mocked(require('@/lib/supabase/server').createClient).mockReturnValue(mockSupabase as any);

      const success = await cms.publishContent('cms_test123');
      expect(success).toBe(false);
    });
  });

  describe('searchContent', () => {
    it('should search content successfully', async () => {
      const mockResults: CMSContent[] = [
        {
          id: 'cms_test123',
          slug: 'test-content',
          title: 'Test Content',
          content: 'Test content body',
          status: 'published',
          content_type: 'page',
          author_id: 'test-user',
          published_at: new Date().toISOString(),
          metadata: {},
          tags: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];


      const mockSupabase = {
        from: jest.fn(() => makeChain(mockResults)),
      };

      jest.mocked(require('@/lib/supabase/server').createClient).mockReturnValue(mockSupabase as any);

      const results = await cms.searchContent('test', { limit: 10 });
      expect(results).toEqual(mockResults);
      expect(results).toHaveLength(1);
    });
  });
});