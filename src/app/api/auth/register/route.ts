import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { registerSchema } from '@/lib/validators/auth.schema';
import { rateLimit } from '@/lib/middleware/rate-limit';

export async function POST(req: NextRequest) {
  try {
    await rateLimit(req, 'auth', 3, 3600000);

    const body = await req.json();
    const validated = registerSchema.parse(body);

    const supabase = await createClient();
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          full_name: validated.full_name,
          role: validated.role || 'attendee',
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: validated.email,
          full_name: validated.full_name,
          role: validated.role || 'attendee',
        });

      if (profileError) {
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      user: authData.user,
      session: authData.session,
      message: 'Registration successful. Please check your email to verify your account.',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
