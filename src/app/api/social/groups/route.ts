import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { GroupMember } from '@/types/api';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('group_members')
      .select('*, group:groups(*)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ groups: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { data, error } = await supabase
      .from('groups')
      .insert({
        ...body,
        creator_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as admin member
    const groupMember: GroupMember = {
      group_id: data.id,
      user_id: user.id,
      role: 'admin',
    };
    await createClient().from('group_members').insert(groupMember);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
