/**
 * Example: Using the Supabase mock
 */
import { createClient } from '@supabase/supabase-js';
import { mockSupabaseQuery, resetMockDatabase } from '@/__mocks__/@supabase/supabase-js';

describe('Supabase mock example', () => {
  beforeEach(() => {
    resetMockDatabase();
  });

  it('should mock a select query', async () => {
    const supabase = createClient('url', 'key');
    mockSupabaseQuery(supabase, 'events', [
      { id: '1', title: 'Event 1' },
      { id: '2', title: 'Event 2' },
    ]);

    const { data } = await supabase.from('events').select('*');
    expect(data).toHaveLength(2);
    expect(data[0].title).toBe('Event 1');
  });

  it('should filter with .eq()', async () => {
    const supabase = createClient('url', 'key');
    mockSupabaseQuery(supabase, 'events', [
      { id: '1', status: 'published' },
      { id: '2', status: 'draft' },
    ]);

    const { data } = await supabase.from('events').select('*').eq('status', 'published');
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('1');
  });

  it('should insert rows', async () => {
    const supabase = createClient('url', 'key');
    const { data } = await supabase.from('events').insert({ id: '3', title: 'New Event' }).select();

    expect(data[0].id).toBe('3');
  });
});
