# Project Structure

```text
boarding-house/
├── backend/
│   ├── server.py              # tiny entry point
│   ├── app_factory.py         # Flask application wiring
│   ├── common.py              # shared auth/data helpers
│   ├── data_store.py          # JSON collection store
│   ├── routes/
│   │   ├── auth.py
│   │   ├── catalog.py
│   │   ├── rooms.py
│   │   ├── landlord_rooms.py
│   │   ├── saved.py
│   │   ├── requests.py
│   │   ├── comments.py
│   │   ├── notifications.py
│   │   ├── uploads.py
│   │   └── pages.py
│   ├── data/
│   │   ├── users.json
│   │   ├── landlords.json
│   │   ├── rooms.json
│   │   ├── saved_rooms.json
│   │   ├── rental_requests.json
│   │   ├── comments.json
│   │   ├── notifications.json
│   │   └── config/filter_options.json
│   └── uploads/rooms/
├── frontend/
│   ├── index.html
│   ├── user/index.html
│   ├── pages/
│   └── assets/
└── Docs/
```
