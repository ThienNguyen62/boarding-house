# Phase 4 — Room image upload + real Leaflet map

## What changed
- Landlords can upload a room image from their computer when creating or editing a listing.
- Images are validated as JPG/JPEG/PNG/WEBP and limited to 5MB.
- Uploaded files are stored in `backend/uploads/rooms/`.
- `db.json` stores the image path in `room.image`.
- The homepage, dashboard listing cards and room detail all reuse the same `room.image`, so new listings render with the same card style as existing listings.
- The map page uses real Leaflet tiles from OpenStreetMap and real room coordinates from the Flask API.
- Map search/filter results and markers stay synchronized.

## Test flow
1. Login as `landlord@tro.vn` / `123456`.
2. Open `Quản lý tin` → `Đăng tin mới`.
3. Choose a JPG/PNG/WEBP image and submit the listing.
4. Confirm the image appears in the landlord listing card.
5. Open the homepage and confirm the new listing uses the same room card layout as existing listings.
6. Open `Bản đồ` and confirm the listing appears at its latitude/longitude.
