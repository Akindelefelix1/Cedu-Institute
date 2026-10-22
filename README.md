# Cedu Institution Dashboard

PS C:\Users\akind\Desktop\Cedugames_Admin> 
C:\Users\akind\Desktop\Cedugames_BE
PS C:\Users\akind\Desktop\Cedugames_Users> 
access the siblings folders from here for all  end to end wiring



React/Vite institution workspace connected to the shared CeduGames backend.

## Run locally

```bash
npm install
npm run dev
```

Set `VITE_API_URL` to the URL of `Cedugames_BE` when running against a local or deployed API. The institution app uses the same backend consumed by `Cedugames_Users` and `Cedugames_Admin`.

## Related workspaces

- `C:\Users\akind\Desktop\Cedugames_BE` — Express/TypeScript API and migrations
- `C:\Users\akind\Desktop\Cedugames_Admin` — Super Admin React app
- `C:\Users\akind\Desktop\Cedugames_Users` — learner React/Vite app

Run each workspace from its own folder. The institution flow is end-to-end for authentication, dashboard metrics, join requests, learners, learning structure, question creation/deletion, activity, visibility, and profile updates.

## Included flows

- Institution overview dashboard with activity, progress, requests and quick actions
- Student management, progress table and direct invitations
- Question bank with filters, draft/publish states and a question editor modal
- Practice session builder preview
- Invite codes, email/phone invitations, join requests and code controls
- Institution resource bank and request access to Cedu admin resources
- Institution settings, publishing permissions and auto-approval toggles
- Super Admin view for institution management, review queues and institution activity
- Create account / sign-in entry screen for institution onboarding
