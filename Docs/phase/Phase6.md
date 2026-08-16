# Phase 6

- Guest root `/` remains the public homepage.
- Authenticated user home is `/user/`; direct access requires login.
- Login/register redirect to `/user/` by default.
- Logout clears session and redirects to `/`.
- Authenticated nav uses a circular initials avatar; clicking opens role-specific menu.
- Tenant menu: Bài đăng yêu thích, Tin đã lưu, Ưu đãi, Đánh giá từ tôi, Xem hóa đơn, Đăng xuất.
- Landlord menu: Quản lí phòng trọ, Quản lí khách thuê, Quản lý hóa đơn, Xác thực chính chủ, Báo cáo sự cố, Tạo bài đăng, Đăng xuất.
- Placeholder menu items currently show a toast; existing saved/listings/request flows remain active.
- Homepage room grid shows 9 rooms first and expands by 9 with `Xem thêm`.
- Added 25 Hai Bà Trưng rooms; ownership is distributed between landlord accounts U003/L003 and U004/L004. Existing room ownership was normalized to those account-linked landlord profiles.
