# Phase 7

## Backend modularization
`backend/server.py` is the small entry point. Flask wiring lives in `app_factory.py`; shared helpers live in `common.py`; feature route modules live under `backend/routes/`.

## Comments
- Active room comments are public to guests.
- Logged-in users can post comments.
- Room owners receive an unread notification when someone comments on their listing.
- Data is stored in `backend/data/comments.json` and `backend/data/notifications.json`.

## User home
- Logged-in tenant and landlord both use `/user/`.
- Existing search/filter/map/listing functions remain available.
- Hero is redesigned with subtle motion and role-aware copy.
- Logout clears the session and returns to `/` as guest.
