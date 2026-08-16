# Phase 5 — Split JSON data, filter module, user home

## 1. Data layout
- `backend/data/users.json` — tài khoản người dùng
- `backend/data/landlords.json` — hồ sơ chủ trọ
- `backend/data/rooms.json` — tin phòng
- `backend/data/saved_rooms.json` — phòng đã lưu
- `backend/data/rental_requests.json` — yêu cầu thuê
- `backend/data/config/filter_options.json` — lựa chọn của bộ lọc

`backend/data_store.py` giữ API `load_db()/save_db()` để các endpoint cũ tiếp tục chạy mà không phải viết lại toàn bộ logic.

## 2. Filters
- `frontend/assets/js/features/filters.js` chứa logic UI của bộ lọc.
- `/api/filter-options` đọc cấu hình từ `backend/data/config/filter_options.json`.
- Homepage dùng `districts/prices/types/areas`; Leaflet Map dùng `districts/map_prices/types/map_areas`.
- Có thể thêm/bớt quận, mức giá, loại phòng, diện tích bằng cách sửa JSON thay vì sửa HTML.

## 3. User home
- Tài khoản đăng nhập/đăng ký được đưa tới `/user/`.
- File giao diện: `frontend/user/index.html`.
- Trang mới vẫn giữ search, filter, listing, map links, save và request của hệ thống hiện có.
- Phase này chỉ định hướng giao diện, chưa thêm nghiệp vụ mới.

## 4. Migration
Nếu cần tách lại từ một `db.json` cũ: chạy `python backend/tools/migrate_legacy_db.py` trước khi xóa file cũ.
