# TrọSmart MVP

## Phase hiện tại
Phase 3 — Quản lý tin đăng cho chủ trọ.

## Stack
- Python + Flask
- JSON file database
- Vanilla HTML/CSS/JavaScript
- Map hiện có của MVP được giữ lại

## Cấu trúc
```text
backend/
  data/                # dữ liệu JSON tách theo nhóm
  server.py           # Flask API
frontend/
  index.html          # homepage dùng chung cho cả 2 role
  pages/              # các trang riêng
  assets/js/core/     # API + session dùng chung
  assets/js/features/ # auth/home/map/room/dashboard
Docs/                  # tài liệu phase + cấu trúc
```

## Chạy nhanh trên Windows
```bat
cd backend
run.bat
```

Sau đó mở:
`http://127.0.0.1:3000`

## Tài khoản demo
- Người thuê: `tenant@tro.vn` / `123456`
- Người thuê 2: `tenant2@tro.vn` / `123456`
- Chủ trọ: `landlord@tro.vn` / `123456`
- Chủ trọ 2: `landlord2@tro.vn` / `123456`

## Phase 3 đã hoàn thành
- Chủ trọ quản lý tin trên frontend: xem, tạo, sửa, ẩn, hiển thị lại.
- Backend kiểm tra quyền sở hữu tin trước khi thay đổi.
- Có form nhập đầy đủ thông tin phòng và vị trí.
- Dữ liệu nghiệp vụ được tách thành từng file JSON; `data_store.py` gom chúng thành một giao diện dữ liệu cho Flask.
- Các luồng tenant/home/map/room/request của phase trước được giữ nguyên.

## Phase 1 đã hoàn thành
- Login thật qua Flask + session.
- Register `tenant` và `landlord`.
- Role lấy từ `users.json` phía server, không tin role từ frontend khi login.
- Login/register thành công → homepage.
- Homepage hiển thị navigation theo role.
- Tạo landlord profile tự động khi đăng ký role `landlord`.
- Dọn merge-conflict marker khỏi source.
- Tổ chức JS thành `core/` và `features/`.

## Dữ liệu
Nguồn dữ liệu hệ thống nằm tại:
`backend/data/{users,landlords,rooms,saved_rooms,rental_requests}.json`

Các chức năng nghiệp vụ của MVP dùng API Flask + các JSON trong `backend/data/`. Bộ lọc nằm ở `backend/data/config/filter_options.json` và không còn cấu hình option trực tiếp trong HTML.

## Phase 4 additions
- Chủ trọ có thể tải ảnh phòng trực tiếp từ form đăng tin (JPG/JPEG/PNG/WEBP, tối đa 5MB).
- Ảnh được lưu local trong `backend/uploads/rooms/` và URL được lưu ở `room.image` trong JSON.
- Bản đồ sử dụng Leaflet + OpenStreetMap, marker lấy tọa độ thật từ `/api/rooms`.


Phase 6: guest root, `/user/` authenticated workspace, circular role menu, logout-to-root, 9-room pagination, and 25 additional Hai Bà Trưng listings.
