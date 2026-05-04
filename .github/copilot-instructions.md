# UI & FRONTEND CONVENTIONS

You MUST strictly follow these conventions when generating, modifying, or refactoring code. If any rule is violated during generation, you MUST refactor the code before returning the final output.

## 1. Data Fetching & Server State

- MUST use `useSWR` for all client-side data fetching.
- NEVER use `useEffect` + `fetch` for data retrieval.
- Fetch logic MUST be abstracted into custom hooks (e.g., `useUser`).
- Hooks MUST be colocated with the feature or placed in a `/hooks` directory.
- Prefer `mutate` from SWR for optimistic updates and cache invalidation instead of manually syncing server data into local React state.

## 2. Loading States

- MUST use skeleton components for initial loading states.
- NEVER use generic spinners for initial page or layout loads.
- Skeletons MUST match the layout and dimensions of the final UI to prevent layout shift.

## 3. Component Structure & Size

- Components MUST NOT be large monoliths. Aim for under ~100 lines of code.
- If a component grows beyond this limit or takes on multiple responsibilities, it MUST be split into:
  - Subcomponents (pure UI)
  - Custom hooks (business logic / state)
  - Utility functions (pure functions outside the component tree)
- Keep UI rendering and complex business logic cleanly separated.

## 4. State Management

- State MUST be defined at the lowest possible level in the component tree.
- NEVER mirror server state into local state unnecessarily; rely on SWR cache.
- Prefer derived state (variables calculated during render) over duplicating state.
- Avoid central "orchestrator" components that manage state for an entire page.
- "Too Much State" Rule: If a single component has more than 5 `useState` calls, it MUST be refactored by extracting logic into a hook or splitting the component.

## 5. Prop Drilling & Context

- Do not pass props through more than 2 levels of intermediate components.
- If state needs to be accessed by 3+ nested components, introduce React Context.
- Context providers MUST be scoped locally to the specific feature, NOT placed globally at the app root unless strictly necessary (e.g., auth or theme).

## 6. The `useEffect` Diet

- NEVER use `useEffect` for data fetching.
- NEVER use `useEffect` to transform or derive data. If it can be computed during render, do it during render.
- NEVER use `setState` inside `useEffect` to chain state updates.
- `useEffect` is strictly reserved for true side effects: external subscriptions, manual DOM manipulation, or syncing with non-React systems.

## 7. Memoization (`useCallback` / `useMemo`)

- Do NOT use `useCallback` or `useMemo` by default or preemptively.
- Only use memoization when:
  - Referential stability is strictly required (e.g., a function passed to an effect dependency array).
  - A specific, measured performance bottleneck exists (e.g., heavy calculations or memoized expensive children).
- Avoid premature optimization.

## 8. Reusability & Composition

- Prefer composition (passing `children` or slots) over massive components with dozens of configuration props.
- If logic or UI is generic or reused in multiple places, immediately extract it into shared components, hooks, or utils.

---

## EXAMPLES

### ✅ GOOD PATTERN (Hooks + Skeletons + SWR)

    // hooks/useUser.ts
    export function useUser() {
      return useSWR('/api/user', fetcher);
    }

    // components/UserSkeleton.tsx
    export function UserSkeleton() {
      return <div className="animate-pulse h-6 w-32 bg-gray-200 rounded" />;
    }

    // components/UserProfile.tsx
    export function UserProfile() {
      const { data, isLoading } = useUser();

      if (isLoading) return <UserSkeleton />;
      return <div>{data.name}</div>;
    }

### ❌ BAD PATTERN (Effect Fetching + Local State Sync + Spinner)

    export function BadUserProfile() {
      const [data, setData] = useState(null);
      const [isLoading, setIsLoading] = useState(true);

      useEffect(() => {
        fetch('/api/user')
          .then(res => res.json())
          .then(data => {
            setData(data);
            setIsLoading(false);
          });
      }, []);

      if (isLoading) return <Spinner />;
      return <div>{data.name}</div>;
    }

---

## AGENT OUTPUT EXPECTATIONS

1. Follow ALL rules above strictly.
2. Self-correct and refactor internally before outputting the final code.
3. Use clear, semantic naming for files, variables, and components.
4. Output clean, modular code with logical and visual separation.
