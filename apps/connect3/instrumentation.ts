export async function register() {
  // Next.js 15 / Turbopack passes --localstorage-file to Node.js 22 without a
  // valid path. This creates a broken globalThis.localStorage stub where
  // getItem / setItem / removeItem are not functions. @supabase/auth-js calls
  // localStorage.getItem() at module-load time (locks.js), crashing every SSR
  // render. Replace the broken stub with a proper in-memory implementation.
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    typeof globalThis.localStorage !== "undefined" &&
    typeof (globalThis.localStorage as Storage).getItem !== "function"
  ) {
    const store: Record<string, string> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const key of Object.keys(store)) delete store[key];
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      get length() {
        return Object.keys(store).length;
      },
    };
  }
}
