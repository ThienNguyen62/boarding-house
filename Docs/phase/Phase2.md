# Phase 2 — Người thuê: lưu tin và liên hệ

## Mục tiêu

Phase 2 hoàn thiện luồng người thuê trên MVP bằng cách chuyển `Tin đã lưu` và `Liên hệ chủ trọ` từ trạng thái frontend/localStorage sang backend Flask + `backend/data/db.json`.

## Chức năng đã hoàn thành

### Người thuê
- Đăng nhập/đăng ký và về homepage như Phase 1.
- Lưu/bỏ lưu tin từ homepage.
- Lưu/bỏ lưu tin từ trang chi tiết phòng.
- Xem danh sách tin đã lưu trong dashboard.
- Gửi yêu cầu liên hệ cho chủ trọ từ trang chi tiết.
- Xem các yêu cầu đã gửi và trạng thái trong dashboard.

### Chủ trọ
- CRUD tin đăng cũ vẫn hoạt động.
- Xem các yêu cầu thuê gửi vào các tin của mình.
- Cập nhật trạng thái: `pending`, `contacted`, `rejected`.

### Bản đồ
- Không còn đọc `frontend/data/rooms.json`.
- Bản đồ lấy dữ liệu phòng từ `GET /api/rooms` để dùng cùng nguồn dữ liệu với homepage và room detail.
- Tin mới tạo từ backend có tọa độ và được tạo vị trí marker dự phòng trên bản đồ mô phỏng.

## API mới

```text
GET    /api/saved
POST   /api/saved/<room_id>
DELETE /api/saved/<room_id>

POST   /api/requests
GET    /api/my/requests
GET    /api/landlord/requests
PUT    /api/requests/<request_id>
```

## JSON mới

`backend/data/db.json` có thêm:

```json
"saved_rooms": [],
"rental_requests": []
```

Mọi dữ liệu MVP có liên quan đến user/room/request đều đi qua Flask rồi mới ghi JSON.

## Test nhanh

### Test người thuê

1. Login `tenant@tro.vn / 123456`.
2. Ở homepage bấm trái tim một phòng.
3. Vào `Tin đã lưu` và kiểm tra phòng xuất hiện.
4. Mở chi tiết một phòng.
5. Bấm `Liên hệ chủ trọ`.
6. Nhập lời nhắn và gửi.
7. Vào `Yêu cầu` để xem request.

### Test chủ trọ

1. Logout.
2. Login `landlord@tro.vn / 123456`.
3. Vào `Yêu cầu thuê`.
4. Kiểm tra request từ người thuê.
5. Đổi trạng thái sang `Đã liên hệ`.

### Kiểm tra không làm hỏng chức năng cũ

- Homepage vẫn tải danh sách phòng từ API.
- Search/filter vẫn gọi `/api/rooms`.
- Map vẫn tải `/api/rooms`.
- Room detail vẫn tải `/api/rooms/<id>`.
- CRUD phòng của chủ trọ vẫn giữ nguyên.
- Authentication/session vẫn giữ nguyên.
