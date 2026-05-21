# AI Studio / Agent Guidelines for BYD Project

## Core Architectural Philosophies

1. **Performance & Data Integrity (Instant Feel)**
   - **TanStack Query**: ALL API fetching MUST use `useQuery` / `useMutation`. No manual `useEffect` fetching.
   - **Optimistic UI**: Use `onMutate` to update UI immediately. Rollback on failure.
   - **Debouncing**: Debounce heavy operations (e.g., progress slider updates) to prevent API spam.
   - **Persistence**: Query cache MUST be persisted in IndexedDB using `persistQueryClient`.

2. **Premium UI/UX**
   - **Animations**: Use `motion/react` (Framer Motion). Prefer `Layout Projections` for card expansions and `AnimatePresence` for transitions.
   - **Skeleton Loaders**: Replace black loading screens with `animate-pulse` skeletons that mirror the target layout.
   - **Styling**: Strict adherence to "Deep Dark" theme: Pitch Black background, glassmorphism, 1px thin glowing borders, and high-precision 8px grid spacing.

3. **Data Consistency**
   - **Supabase**: Always use upserts with the full object payload for updates to avoid data loss.
   - **Atomicity**: Ensure progress updates include the full row state.

4. **Security & Reliability**
   - **Error Boundaries**: Wrap major UI modules in React Error Boundaries.
   - **Global State**: Use `Zustand` (`uiStore.ts`) for non-data transient UI states (modals, toggles).

## Maintenance Rules
- Never use mock data if the user asks for real user data (e.g., "my stats"). Build real integrations.
- When creating new UI, prioritize minimalism and negative space.
- Always implement loading/error states in React components.
