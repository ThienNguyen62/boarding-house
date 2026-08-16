# TrọSmart MVP

## Chạy nhanh trên Windows
```bat
cd backend
chạy server.py
run.bat
```

Sau đó mở:
`http://127.0.0.1:3000`

## Tài khoản demo
- Người thuê: `tenant@tro.vn` / `123456`
- Người thuê 2: `tenant2@tro.vn` / `123456`
- Chủ trọ: `landlord@tro.vn` / `123456`
- Chủ trọ 2: `landlord2@tro.vn` / `123456`


## Dữ liệu
Nguồn dữ liệu hệ thống nằm tại:
`backend/data/{users,landlords,rooms,saved_rooms,rental_requests}.json`

Các chức năng nghiệp vụ của MVP dùng API Flask + các JSON trong `backend/data/`. Bộ lọc nằm ở `backend/data/config/filter_options.json` và không còn cấu hình option trực tiếp trong HTML.


