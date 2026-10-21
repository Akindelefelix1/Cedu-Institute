# Cedu Institution Dashboard

PS C:\Users\akind\Desktop\Cedugames_Admin> 
C:\Users\akind\Desktop\Cedugames_BE
PS C:\Users\akind\Desktop\Cedugames_Users> 
access the siblings folders from here for all  end to end wiring


Institution questions now use a rich editor matching the Admin workflow: formatted text, media attachments, shapes, answer explanations, read-aloud, and draft or publish status. The selected class and learning area stay fixed as the question’s placement.
The Question Bank’s Preview button now opens the saved question with its options, correct answer, and attachments.

Institution questions now use a rich editor matching the Admin workflow: formatted text, media attachments, shapes, answer explanations, read-aloud, and draft or publish status. The selected class and learning area stay fixed as the question’s placement.
The Question Bank’s Preview button now opens the saved question with its options, correct answer, and attachments.

Class settings and placement now save through the level update API; renaming a class also updates its current URL.
“View class activity” now opens activity filtered to that class using its levelId.
Dashboard and question-bank add actions now lead to class placement, where questions are saved to the institution. They no longer open an editor that only changed local state.
Rich question editing now initializes the correct answer, publish status, media, and shapes from saved question data.


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
