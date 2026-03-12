// Lightweight Supabase mock factory for tests
type ThenableResult = {
  then: (cb: (res: any) => any) => any;
  eq: (..._args: any[]) => ThenableResult;
};

function makeThenable(result: any): ThenableResult {
  const t: any = {
    then: (cb: (res: any) => any) => Promise.resolve(cb(result)),
    eq: (..._args: any[]) => t,
  };
  return t;
}

export function createSupabaseMock(overrides: any = {}) {
  const defaultAuth = {
    signUp: jest.fn(async (opts: any) => ({ data: { user: { id: 'test-user' }, session: null }, error: null })),
    getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
    getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
  };

  const from = (table: string) => ({
    insert: jest.fn(async (payload: any) => ({ data: payload, error: null })),
    select: jest.fn(async () => ({ data: [], error: null })),
    delete: jest.fn(() => makeThenable({ data: null, error: null })),
    update: jest.fn(() => makeThenable({ data: null, error: null })),
    // support chaining with `.eq()` calls
    eq: jest.fn(() => makeThenable({ data: null, error: null })),
  });

  const client = {
    from,
    auth: defaultAuth,
    // allow custom overrides for tests
    __mockOverrides: overrides,
  };

  // Apply simple overrides
  Object.assign(client, overrides);

  return client as any;
}

export function resetSupabaseMock(mock: any) {
  if (!mock) return;
  if (mock.auth) {
    Object.values(mock.auth).forEach((fn: any) => {
      if (fn && fn.mockClear) fn.mockClear();
    });
  }
}
