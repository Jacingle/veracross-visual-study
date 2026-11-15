<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- All school data comes from `src/lib/sis-data.ts` (single shared dataset) so every page shows the same records; replace with Lovable Cloud tables later without changing page structure.
- Pages wrap content in `PortalShell` (portal) or the class-site layout; colors come only from `--vc-*` / `cat-*` tokens in `src/styles.css`.
- Classes (sections) live in the school store (`sections`), seeded from `sis-data`; pages read them via `useMySections`/`useSection`, never static `COURSES`/`ALL_SECTIONS`, so admin-created classes work everywhere.
- School years/terms are generated in `src/lib/terms.ts`; a class's `terms` decide current/future/past, attendance dates and grading periods.
- Save browser-local school state in IndexedDB with a localStorage fallback so cropped photos do not exceed the small localStorage quota.
- Serialize school writes and read IndexedDB first; localStorage is only a fallback so large photos cannot revive stale settings.
- Website page bodies and publishing flags share the section's website settings; portal views render only published pages for students.
- Demo impersonation retains the original administrator session and filters records as the target; never impersonate administrators.
