# Phase 3 — Quản lý tin đăng cho chủ trọ

## Mục tiêu
Hoàn thiện luồng frontend + backend cho chủ trọ: xem danh sách tin, đăng tin mới, sửa tin, ẩn/hiển thị lại tin.

## Backend
- `GET /api/my/rooms?includeHidden=true` — lấy toàn bộ tin của chủ trọ, gồm cả tin đang ẩn.
- `POST /api/rooms` — tạo tin mới.
- `PUT /api/rooms/<room_id>` — sửa tin.
- `PUT /api/rooms/<room_id>/status` — chuyển `active` / `hidden`.
- `DELETE /api/rooms/<room_id>` — tương thích với phase trước, đặt tin thành `hidden`.
- Cập nhật số tin đang hiển thị trong hồ sơ landlord.
- Kiểm tra quyền sở hữu bằng `owner_user_id` trước mọi thao tác sửa/trạng thái/xóa.

## Frontend
Khu vực `dashboard.html` khi đăng nhập bằng role `landlord` có:
- Tổng quan.
- Quản lý tin.
- Đăng tin mới.
- Sửa tin.
- Ẩn tin.
- Hiển thị lại tin.
- Xem tin.
- Danh sách yêu cầu thuê vẫn hoạt động.

Form tạo/sửa gồm:
- Tiêu đề, loại phòng, giá, diện tích, tiền cọc.
- Ngày nhận phòng.
- Địa chỉ, quận, phường, tọa độ.
- Điện, nước, phí dịch vụ.
- Giới tính, nội thất, URL ảnh.
- Tiện ích, địa điểm xung quanh.
- Mô tả.

## Quy tắc dữ liệu
`backend/data/db.json` vẫn là nguồn dữ liệu duy nhất cho nghiệp vụ. Frontend không tự đọc một bản `rooms.json` riêng cho các chức năng quản lý tin.

## Kiểm tra
- Python syntax: OK.
- JavaScript syntax: OK với Node.js.
- JSON: OK.
- Không còn Git conflict marker thực sự trong source.
