# TrọSmart MVP — Phase 1

## Mục tiêu
Chuẩn hóa authentication và cấu trúc source để các phase sau dễ mở rộng.

## Luồng đăng nhập
1. Người dùng mở `frontend/pages/login.html`.
2. Chọn vai trò để hỗ trợ giao diện demo.
3. Flask kiểm tra email/password trong `backend/data/db.json`.
4. Role thật được lấy từ record user trong JSON.
5. Flask tạo session `trosmart_session`.
6. Login/register thành công đều chuyển về `frontend/index.html`.
7. Homepage đọc `/api/auth/me` để hiển thị menu theo role.

## Luồng đăng ký
- `tenant`: tạo user role `tenant`.
- `landlord`: tạo user role `landlord` và đồng thời tạo landlord profile để các phase quản lý tin có thể dùng ngay.

## Cấu trúc JS
```text
frontend/assets/js/
├── core/
│   ├── api.js          # fetch wrapper / xử lý API
│   └── session.js      # tải và kiểm tra user hiện tại
├── features/
│   ├── auth.js         # login + register
│   ├── home.js         # homepage/search/filter
│   ├── map.js          # map UI
│   ├── room.js         # room detail
│   └── dashboard.js    # workspace theo role
└── chatbot/            # chatbot demo hiện có
```

## JSON
Nguồn dữ liệu chính: `backend/data/db.json`.
`frontend/data/*.json` được giữ lại ở Phase 1 để tránh phá các phần UI cũ; các phase sau sẽ chuyển dần sang API Flask.

## Chạy local
```bat
cd backend
run.bat
```
Sau đó mở `http://127.0.0.1:3000`.
