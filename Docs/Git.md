Dưới đây là quy trình Git đầy đủ, theo đúng trường hợp project **`boarding-house`** của bạn.

# 1. Kiểm tra Git đã cài chưa

```powershell
git --version
```

Ví dụ:

```text
git version 2.51.0
```

---

# 2. Cấu hình tên và email

Chỉ cần làm một lần trên máy:

```powershell
git config --global user.name "Thien Nguyen"
git config --global user.email "email-cua-ban@example.com"
```

Kiểm tra:

```powershell
git config --global --list
```

---

# 3. Đi vào thư mục project

```powershell
cd "C:\Users\Hi Windows 11 Home\Downloads\boarding-house"
```

Kiểm tra:

```powershell
pwd
```

---

# 4. Khởi tạo Git cho project

Nếu project chưa có Git:

```powershell
git init
```

Kiểm tra:

```powershell
git status
```

---

# 5. Tạo `.gitignore`

Đối với project Python Flask của bạn, nên có:

```gitignore
.venv/
__pycache__/
*.pyc
.env
.vscode/
.idea/
*.db
```

Nếu dữ liệu MVP `db.json` cần đưa lên GitHub thì **không thêm `db.json` vào `.gitignore`**.

Nếu database chứa thông tin nhạy cảm thì không commit.

---

# 6. Xem các file Git đang theo dõi

```powershell
git status
```

Ví dụ:

```text
Untracked files:
  backend/
  frontend/
  README.md
```

---

# 7. Thêm file vào staging

Tất cả:

```powershell
git add .
```

Hoặc chỉ thêm một file:

```powershell
git add backend/server.py
```

Kiểm tra:

```powershell
git status
```

---

# 8. Tạo commit

```powershell
git commit -m "Initial commit"
```

Ví dụ các commit sau:

```powershell
git commit -m "Add Flask backend"
git commit -m "Add Leaflet map"
git commit -m "Add room search"
git commit -m "Add landlord room management"
```

---

# 9. Xem lịch sử commit

```powershell
git log --oneline
```

Ví dụ:

```text
a81d32a Add Leaflet map
58c21de Add Flask backend
21f8ab1 Initial commit
```

---

# 10. Kết nối GitHub

Repository của bạn:

```text
https://github.com/ThienNguyen62/boarding-house.git
```

Thêm remote:

```powershell
git remote add origin https://github.com/ThienNguyen62/boarding-house.git
```

Kiểm tra:

```powershell
git remote -v
```

Kết quả:

```text
origin  https://github.com/ThienNguyen62/boarding-house.git (fetch)
origin  https://github.com/ThienNguyen62/boarding-house.git (push)
```

---

# 11. Đặt branch chính là `main`

```powershell
git branch -M main
```

Kiểm tra:

```powershell
git branch
```

Bạn sẽ thấy:

```text
* main
```

---

# 12. Push lần đầu

```powershell
git push -u origin main
```

Sau lần đầu, chỉ cần:

```powershell
git push
```

---

# 13. Nếu GitHub đã có commit và bị `non-fast-forward`

Đây chính là lỗi bạn vừa gặp.

### Cách an toàn

```powershell
git pull origin main --rebase
```

Sau đó:

```powershell
git push
```

Nếu xảy ra conflict:

```powershell
git status
```

Sửa file conflict, rồi:

```powershell
git add .
git rebase --continue
```

Cuối cùng:

```powershell
git push
```

---

# 14. Nếu GitHub chỉ có README và bạn muốn code local ghi đè

Có thể dùng:

```powershell
git push -u origin main --force
```

Sau đó GitHub sẽ lấy `main` trên máy bạn làm phiên bản chính.

Không nên dùng `--force` với repository có code quan trọng của người khác.

---

# 15. Tạo branch mới

Ví dụ tạo branch `develop`:

```powershell
git switch -c develop
```

Push:

```powershell
git push -u origin develop
```

---

# 16. Xem tất cả branch

Branch local:

```powershell
git branch
```

Branch remote:

```powershell
git branch -r
```

Tất cả:

```powershell
git branch -a
```

---

# 17. Chuyển branch

```powershell
git switch develop
```

Quay lại `main`:

```powershell
git switch main
```

---

# 18. Tạo branch cho một chức năng

Ví dụ bạn đang phát triển map:

```powershell
git switch -c feature/leaflet-map
```

Sau khi làm xong:

```powershell
git add .
git commit -m "Add Leaflet map"
git push -u origin feature/leaflet-map
```

---

# 19. Merge branch

Ví dụ merge `develop` vào `main`.

Trước tiên:

```powershell
git switch main
```

Lấy code mới:

```powershell
git pull origin main
```

Merge:

```powershell
git merge develop
```

Sau đó:

```powershell
git push origin main
```

---

# 20. Xóa branch

Xóa branch local:

```powershell
git branch -d develop
```

Xóa branch remote:

```powershell
git push origin --delete develop
```

---

# 21. Lấy code mới nhất từ GitHub

Nếu GitHub có code mới:

```powershell
git pull
```

Hoặc rõ ràng hơn:

```powershell
git pull origin main
```

---

# 22. `fetch` khác `pull` như thế nào?

```powershell
git fetch
```

Chỉ tải thông tin mới từ GitHub, **không thay đổi code hiện tại**.

```powershell
git pull
```

Tải code mới và tích hợp vào branch hiện tại.

Thông thường:

```text
fetch = xem trước
pull  = lấy về
```

---

# 23. Xem remote

```powershell
git remote -v
```

---

# 24. Đổi URL remote

Nếu URL sai:

```powershell
git remote set-url origin https://github.com/ThienNguyen62/boarding-house.git
```

---

# 25. Xóa remote

```powershell
git remote remove origin
```

Sau đó thêm lại:

```powershell
git remote add origin https://github.com/ThienNguyen62/boarding-house.git
```

---

# 26. Xem thay đổi trước khi commit

```powershell
git diff
```

Xem thay đổi đã `git add`:

```powershell
git diff --cached
```

---

# 27. Xem file nào đã thay đổi

```powershell
git status
```

Đây là lệnh bạn nên dùng rất thường xuyên.

---

# 28. Bỏ `git add`

Nếu lỡ:

```powershell
git add .
```

nhưng chưa commit:

```powershell
git restore --staged .
```

---

# 29. Bỏ thay đổi của một file

Cẩn thận vì thao tác này xóa thay đổi chưa commit:

```powershell
git restore backend/server.py
```

---

# 30. Hoàn tác commit gần nhất

Nếu chưa push:

```powershell
git reset --soft HEAD~1
```

Commit sẽ bị bỏ nhưng code vẫn còn.

Nếu muốn bỏ cả commit và staging:

```powershell
git reset HEAD~1
```

---

# 31. Xem commit hiện tại

```powershell
git log --oneline --decorate --graph --all
```

Đây là lệnh rất hữu ích khi bị rối branch.

---

# 32. Quy trình hằng ngày tôi khuyên bạn dùng

Mỗi khi bắt đầu làm:

```powershell
git pull
```

Làm code.

Kiểm tra:

```powershell
git status
```

Xem thay đổi:

```powershell
git diff
```

Thêm:

```powershell
git add .
```

Commit:

```powershell
git commit -m "Update room search"
```

Push:

```powershell
git push
```

Tức là:

```text
GitHub
  ↓
git pull
  ↓
Code
  ↓
git add .
  ↓
git commit
  ↓
git push
  ↓
GitHub
```

---

# 33. Quy trình phát triển Trọ Thông Minh nên dùng

Với project của bạn, tôi khuyên:

```text
main
│
├── feature/auth
├── feature/leaflet-map
├── feature/room-search
└── feature/landlord
```

Ví dụ làm Leaflet:

```powershell
git switch main
git pull

git switch -c feature/leaflet-map
```

Làm xong:

```powershell
git add .
git commit -m "Add Leaflet room map"
git push -u origin feature/leaflet-map
```

Sau đó merge vào `main`.

---

# 34. Bộ lệnh bạn thực sự cần nhớ

Bạn không cần nhớ tất cả. Với dự án hiện tại, 12 lệnh này là đủ:

```powershell
git status
git init
git add .
git commit -m "message"
git log --oneline
git remote -v
git remote add origin URL
git branch
git switch main
git switch -c branch-name
git pull
git push
```

Và khi gặp lỗi `non-fast-forward`:

```powershell
git pull origin main --rebase
git push
```

Nếu repository GitHub mới tạo chỉ có README và bạn **chắc chắn muốn code local ghi đè**, dùng:

```powershell
git push -u origin main --force
```

Với repository của bạn hiện tại, sau khi push thành công, quy trình thường xuyên nhất sẽ chỉ là:

```powershell
git pull
git add .
git commit -m "Mo ta thay doi"
git push
```
