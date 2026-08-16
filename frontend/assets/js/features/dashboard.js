(async () => {
  const $ = (selector) => document.querySelector(selector);
  const money = (n) => new Intl.NumberFormat('vi-VN').format(Number(n || 0)) + ' đ';
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
  const user = await Session.load();

  if (!user) {
    location.href = 'login.html';
    return;
  }

  $('#name').textContent = user.name;
  $('#role').textContent = user.role === 'tenant' ? 'Người thuê' : 'Chủ trọ';
  $('#avatar').textContent = user.name?.[0] || 'U';

  $('#logout').addEventListener('click', async () => {
    await API.post('/api/auth/logout');
    location.href = '../index.html';
  });

  const tenantViews = [
    ['home', '⌂ Tổng quan'],
    ['saved', '♡ Tin đã lưu'],
    ['requests', '◌ Yêu cầu'],
    ['profile', '○ Hồ sơ']
  ];
  const landlordViews = [
    ['home', '⌂ Tổng quan'],
    ['listings', '▦ Quản lý tin'],
    ['requests', '◌ Yêu cầu thuê'],
    ['profile', '○ Hồ sơ']
  ];
  const views = user.role === 'tenant' ? tenantViews : landlordViews;
  $('#nav').innerHTML = views.map((item) => `<button data-v="${item[0]}">${item[1]}</button>`).join('');

  const getRooms = async (path = '/api/rooms') => (await API.get(path)).data || [];
  const toast = (message, type = 'info') => {
    let el = $('#dashToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'dashToast';
      document.body.appendChild(el);
    }
    el.className = `dash-toast ${type}`;
    el.textContent = message;
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => el.remove(), 2500);
  };

  const item = (room) => `
    <div class="item">
      <img src="${escapeHtml(room.image || '')}" alt="">
      <div><strong>${escapeHtml(room.title)}</strong><span>${escapeHtml(room.district || '')} · ${Number(room.area || 0)}m² · ${room.status === 'hidden' ? 'Đang ẩn' : 'Đang hiển thị'}</span></div>
      <b>${money(room.price)}</b>
      <a href="room.html?id=${encodeURIComponent(room.id)}">Xem →</a>
    </div>`;

  const requestBadge = (status) => {
    const labels = { pending: 'Mới', contacted: 'Đã liên hệ', rejected: 'Từ chối' };
    return `<span class="badge">${labels[status] || status}</span>`;
  };

  const renderTenantRequests = async () => {
    const response = await API.get('/api/my/requests');
    const requests = response.data || [];
    $('#title').textContent = 'Yêu cầu đã gửi';
    $('#content').innerHTML = `<div class="panel"><h3>Yêu cầu liên hệ (${requests.length})</h3>${requests.map((r) => `
      <div class="item">
        <div style="flex:1"><strong>${escapeHtml(r.room_title)}</strong><span>${escapeHtml(r.message)}</span><span>${escapeHtml(r.created_at || '')}</span></div>
        ${requestBadge(r.status)}
        <a href="room.html?id=${encodeURIComponent(r.room_id)}">Xem phòng →</a>
      </div>`).join('') || '<p class="empty">Bạn chưa gửi yêu cầu nào.</p>'}</div>`;
  };

  const renderLandlordRequests = async () => {
    const response = await API.get('/api/landlord/requests');
    const requests = response.data || [];
    $('#title').textContent = 'Yêu cầu thuê';
    $('#content').innerHTML = `<div class="panel"><h3>Người thuê quan tâm (${requests.length})</h3>${requests.map((r) => `
      <div class="item">
        <div style="flex:1"><strong>${escapeHtml(r.tenant_name)} · ${escapeHtml(r.room_title)}</strong><span>${escapeHtml(r.tenant_email)}</span><span>${escapeHtml(r.message)}</span><span>${escapeHtml(r.created_at || '')}</span></div>
        ${requestBadge(r.status)}
        <select class="request-status" data-id="${escapeHtml(r.id)}" style="padding:7px;border:1px solid #e4e7ec;border-radius:8px;font:inherit">
          <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>Mới</option>
          <option value="contacted" ${r.status === 'contacted' ? 'selected' : ''}>Đã liên hệ</option>
          <option value="rejected" ${r.status === 'rejected' ? 'selected' : ''}>Từ chối</option>
        </select>
      </div>`).join('') || '<p class="empty">Chưa có người thuê nào gửi yêu cầu.</p>'}</div>`;

    document.querySelectorAll('.request-status').forEach((select) => {
      select.addEventListener('change', async () => {
        try {
          await API.put(`/api/requests/${encodeURIComponent(select.dataset.id)}`, { status: select.value });
          await renderLandlordRequests();
          toast('Đã cập nhật yêu cầu', 'success');
        } catch (error) {
          toast(error.message || 'Không thể cập nhật yêu cầu', 'error');
        }
      });
    });
  };

  const renderSaved = async () => {
    const response = await API.get('/api/saved');
    const rooms = response.data || [];
    $('#title').textContent = 'Tin đã lưu';
    $('#content').innerHTML = `<div class="panel"><h3>Phòng đã lưu (${rooms.length})</h3>${rooms.map(item).join('') || '<p class="empty">Chưa có tin đã lưu.</p>'}</div>`;
  };

  const roomForm = (room = null) => {
    const editing = Boolean(room);
    const r = room || {};
    $('#title').textContent = editing ? 'Chỉnh sửa tin phòng' : 'Đăng tin phòng mới';
    $('#content').innerHTML = `
      <div class="panel listing-form-wrap">
        <div class="listing-form-header">
          <div><h3>${editing ? 'Cập nhật thông tin phòng' : 'Thông tin phòng'}</h3><p>Chỉ cần nhập các thông tin cần thiết cho bản MVP.</p></div>
          <button class="btn outline" id="cancelListing">← Quay lại danh sách</button>
        </div>
        <form id="listingForm" class="listing-form">
          <div class="form-section"><h4>Thông tin cơ bản</h4><div class="form-grid">
            <label>Tiêu đề *<input name="title" required value="${escapeHtml(r.title || '')}" placeholder="Ví dụ: Phòng khép kín gần Bách Khoa"></label>
            <label>Loại phòng<select name="type"><option ${r.type === 'Phòng trọ' ? 'selected' : ''}>Phòng trọ</option><option ${r.type === 'Studio' ? 'selected' : ''}>Studio</option><option ${r.type === 'Căn hộ mini' ? 'selected' : ''}>Căn hộ mini</option><option ${r.type === 'Ở ghép' ? 'selected' : ''}>Ở ghép</option></select></label>
            <label>Giá thuê / tháng *<input name="price" type="number" min="0" step="10000" required value="${Number(r.price || 0) || ''}" placeholder="4000000"></label>
            <label>Diện tích (m²) *<input name="area" type="number" min="1" step="0.5" required value="${Number(r.area || 0) || ''}" placeholder="25"></label>
            <label>Tiền cọc<input name="deposit" type="number" min="0" step="10000" value="${Number(r.deposit || 0) || ''}" placeholder="4000000"></label>
            <label>Ngày có thể nhận<input name="available_from" type="date" value="${escapeHtml(r.available_from || '')}"></label>
          </div></div>

          <div class="form-section"><h4>Địa điểm</h4><div class="form-grid">
            <label class="field-full">Địa chỉ *<input name="address" required value="${escapeHtml(r.address || '')}" placeholder="Số nhà, ngõ, đường, quận, thành phố"></label>
            <label>Quận / huyện<input name="district" value="${escapeHtml(r.district || '')}" placeholder="Hai Bà Trưng"></label>
            <label>Phường<input name="ward" value="${escapeHtml(r.ward || '')}" placeholder="Bách Khoa"></label>
            <label>Vĩ độ<input name="latitude" type="number" step="0.000001" value="${Number(r.latitude || 21.0285)}"></label>
            <label>Kinh độ<input name="longitude" type="number" step="0.000001" value="${Number(r.longitude || 105.8542)}"></label>
          </div></div>

          <div class="form-section"><h4>Chi phí & tiện nghi</h4><div class="form-grid">
            <label>Tiền điện<input name="electricity" type="number" min="0" value="${Number(r.electricity || 0) || ''}" placeholder="4000"></label>
            <label>Tiền nước<input name="water" type="number" min="0" value="${Number(r.water || 0) || ''}" placeholder="30000"></label>
            <label>Phí dịch vụ<input name="service_fee" type="number" min="0" value="${Number(r.service_fee || 0) || ''}" placeholder="100000"></label>
            <label>Giới tính<select name="gender"><option ${r.gender === 'Tất cả' || !r.gender ? 'selected' : ''}>Tất cả</option><option ${r.gender === 'Nam' ? 'selected' : ''}>Nam</option><option ${r.gender === 'Nữ' ? 'selected' : ''}>Nữ</option></select></label>
            <label class="checkbox-field"><input name="furnished" type="checkbox" ${r.furnished ? 'checked' : ''}> Có nội thất</label>
            <div class="image-upload-field field-full">
              <label>Ảnh phòng <input id="roomImage" name="image_file" type="file" accept="image/png,image/jpeg,image/webp"></label>
              <input id="roomImageUrl" type="hidden" value="${escapeHtml(r.image || '')}">
              <small class="field-hint">Chọn ảnh từ máy, tối đa 5MB. Ảnh sẽ được lưu trong backend/uploads/rooms.</small>
              <div id="roomImagePreview" class="room-image-preview" ${r.image ? '' : 'hidden'}><img src="${escapeHtml(r.image || '')}" alt="Ảnh phòng"><button type="button" id="removeRoomImage">×</button></div>
            </div>
            <label class="field-full">Tiện ích <input name="amenities" value="${escapeHtml((r.amenities || []).join(', '))}" placeholder="Điều hòa, Nóng lạnh, Wi-Fi"></label>
            <label class="field-full">Xung quanh <input name="nearby" value="${escapeHtml((r.nearby || []).join(', '))}" placeholder="ĐH Bách Khoa 700m, Vincom 1.8km"></label>
          </div></div>

          <div class="form-section"><h4>Mô tả</h4><label><textarea name="description" rows="6" required placeholder="Mô tả phòng, lối đi, an ninh, giờ giấc...">${escapeHtml(r.description || '')}</textarea></label></div>
          <div class="form-actions"><button type="button" class="btn outline" id="cancelListing2">Hủy</button><button type="submit" class="btn primary">${editing ? 'Lưu thay đổi' : 'Đăng tin'}</button></div>
        </form>
      </div>`;

    const cancel = () => renderLandlordListings();
    $('#cancelListing').addEventListener('click', cancel);
    $('#cancelListing2').addEventListener('click', cancel);

    const imageInput = $('#roomImage');
    const imagePreview = $('#roomImagePreview');
    const imagePreviewImg = imagePreview?.querySelector('img');
    imageInput?.addEventListener('change', () => {
      const file = imageInput.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast('Ảnh tối đa 5MB', 'error');
        imageInput.value = '';
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      imagePreviewImg.src = objectUrl;
      imagePreview.hidden = false;
    });
    $('#removeRoomImage')?.addEventListener('click', () => {
      imageInput.value = '';
      $('#roomImageUrl').value = '';
      imagePreview.hidden = true;
      imagePreviewImg.removeAttribute('src');
    });

    $('#listingForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = event.submitter;
      button.disabled = true;
      const formData = new FormData(event.currentTarget);
      const imageFile = formData.get('image_file');
      const data = Object.fromEntries(formData.entries());
      delete data.image_file;
      data.image = $('#roomImageUrl').value.trim();
      data.amenities = String(data.amenities || '').split(',').map((x) => x.trim()).filter(Boolean);
      data.nearby = String(data.nearby || '').split(',').map((x) => x.trim()).filter(Boolean);
      data.price = Number(data.price || 0);
      data.area = Number(data.area || 0);
      data.deposit = Number(data.deposit || data.price || 0);
      data.electricity = Number(data.electricity || 0);
      data.water = Number(data.water || 0);
      data.service_fee = Number(data.service_fee || 0);
      data.latitude = Number(data.latitude || 21.0285);
      data.longitude = Number(data.longitude || 105.8542);
      data.furnished = formData.get('furnished') === 'on';
      try {
        if (imageFile && imageFile.size > 0) {
          const uploadData = new FormData();
          uploadData.append('image', imageFile);
          const uploadResponse = await fetch('/api/uploads/room-image', { method: 'POST', body: uploadData });
          const uploadPayload = await uploadResponse.json();
          if (!uploadResponse.ok) throw new Error(uploadPayload.message || 'Không thể tải ảnh lên');
          data.image = uploadPayload.data.url;
        }
        if (editing) {
          await API.put(`/api/rooms/${encodeURIComponent(room.id)}`, data);
          toast('Đã cập nhật tin phòng', 'success');
        } else {
          await API.post('/api/rooms', data);
          toast('Đã đăng tin phòng', 'success');
        }
        await renderLandlordListings();
      } catch (error) {
        toast(error.message || 'Không thể lưu tin phòng', 'error');
        button.disabled = false;
      }
    });
  };

  const renderLandlordListings = async () => {
    const rooms = await getRooms('/api/my/rooms?includeHidden=true');
    $('#title').textContent = 'Quản lý tin đăng';
    $('#content').innerHTML = `
      <div class="listing-toolbar"><div><p class="section-kicker">TIN ĐĂNG CỦA BẠN</p><h2>${rooms.length} tin</h2><p class="section-muted">Tạo, chỉnh sửa, ẩn và bật lại tin phòng ngay tại đây.</p></div><button class="btn primary" id="createListing">+ Đăng tin mới</button></div>
      <div class="listing-grid">${rooms.map((room) => `
        <article class="listing-card ${room.status === 'hidden' ? 'is-hidden' : ''}">
          <div class="listing-card-image"><img src="${escapeHtml(room.image || '')}" alt=""><span class="listing-status">${room.status === 'hidden' ? 'Đang ẩn' : 'Đang hiển thị'}</span></div>
          <div class="listing-card-body"><div class="listing-card-title"><h3>${escapeHtml(room.title)}</h3><b>${money(room.price)}</b></div><p>${escapeHtml(room.address || '')}</p><p class="listing-meta">${Number(room.area || 0)}m² · ${escapeHtml(room.type || '')} · ${Number(room.views || 0)} lượt xem</p><div class="listing-tags">${(room.amenities || []).slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
            <div class="listing-actions"><a class="btn outline" href="room.html?id=${encodeURIComponent(room.id)}">Xem</a><button class="btn outline edit-listing" data-id="${escapeHtml(room.id)}">Sửa</button><button class="btn ${room.status === 'hidden' ? 'primary' : 'outline'} toggle-listing" data-id="${escapeHtml(room.id)}" data-status="${room.status}">${room.status === 'hidden' ? 'Hiển thị lại' : 'Ẩn tin'}</button></div>
          </div>
        </article>`).join('') || '<div class="panel"><p class="empty">Bạn chưa có tin phòng nào. Hãy tạo tin đầu tiên.</p></div>'}</div>`;

    $('#createListing').addEventListener('click', () => roomForm());
    document.querySelectorAll('.edit-listing').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          const room = (await API.get(`/api/rooms/${encodeURIComponent(button.dataset.id)}`)).data;
          roomForm(room);
        } catch (error) {
          toast(error.message || 'Không thể tải tin phòng', 'error');
        }
      });
    });
    document.querySelectorAll('.toggle-listing').forEach((button) => {
      button.addEventListener('click', async () => {
        const nextStatus = button.dataset.status === 'hidden' ? 'active' : 'hidden';
        const action = nextStatus === 'hidden' ? 'ẩn' : 'hiển thị lại';
        if (!window.confirm(`Bạn có chắc muốn ${action} tin này?`)) return;
        try {
          await API.put(`/api/rooms/${encodeURIComponent(button.dataset.id)}/status`, { status: nextStatus });
          await renderLandlordListings();
          toast(nextStatus === 'hidden' ? 'Đã ẩn tin' : 'Đã hiển thị lại tin', 'success');
        } catch (error) {
          toast(error.message || 'Không thể cập nhật trạng thái tin', 'error');
        }
      });
    });
  };

  const render = async (view = 'home') => {
    const query = new URLSearchParams(location.search);
    const requested = query.get('view');
    if (requested && view === 'home' && views.some((x) => x[0] === requested)) view = requested;

    document.querySelectorAll('#nav button').forEach((button) => button.classList.toggle('active', button.dataset.v === view));

    try {
      if (view === 'listings' && user.role === 'landlord') {
        await renderLandlordListings();
        if (new URLSearchParams(location.search).get('action') === 'create') roomForm();
        return;
      }
      if (view === 'saved' && user.role === 'tenant') {
        await renderSaved();
        return;
      }
      if (view === 'requests') {
        if (user.role === 'tenant') await renderTenantRequests();
        else await renderLandlordRequests();
        return;
      }
      if (view === 'profile') {
        $('#title').textContent = 'Hồ sơ';
        $('#content').innerHTML = `<div class="panel"><h3>${escapeHtml(user.name)}</h3><p>${escapeHtml(user.email)}</p><p>Vai trò: ${user.role === 'tenant' ? 'Người thuê' : 'Chủ trọ'}</p></div>`;
        return;
      }

      const rooms = user.role === 'landlord' ? await getRooms('/api/my/rooms') : await getRooms();
      let savedCount = 0;
      let requestCount = 0;
      if (user.role === 'tenant') {
        const [savedResponse, requestResponse] = await Promise.all([API.get('/api/saved'), API.get('/api/my/requests')]);
        savedCount = (savedResponse.data || []).length;
        requestCount = (requestResponse.data || []).length;
      } else {
        requestCount = (await API.get('/api/landlord/requests')).data?.length || 0;
      }

      $('#title').textContent = 'Tổng quan';
      $('#content').innerHTML = `
        <div class="dash-grid">
          <div class="stat"><small>${user.role === 'tenant' ? 'Phòng đã lưu' : 'Tin đang hiển thị'}</small><b>${user.role === 'tenant' ? savedCount : rooms.length}</b></div>
          <div class="stat"><small>${user.role === 'tenant' ? 'Yêu cầu đã gửi' : 'Yêu cầu thuê'}</small><b>${requestCount}</b></div>
          <div class="stat"><small>${user.role === 'tenant' ? 'Tin phù hợp' : 'Lượt xem'}</small><b>${user.role === 'tenant' ? rooms.length : rooms.reduce((sum, room) => sum + Number(room.views || 0), 0)}</b></div>
          <div class="stat"><small>${user.role === 'tenant' ? 'Vai trò' : 'Tin đang ẩn'}</small><b>${user.role === 'tenant' ? 'Tenant' : Math.max(0, (await getRooms('/api/my/rooms?includeHidden=true')).length - rooms.length)}</b></div>
        </div>
        <div class="panel"><div class="panel-heading"><h3>${user.role === 'tenant' ? 'Tin đăng hiện có' : 'Tin đăng của bạn'}</h3>${user.role === 'landlord' ? '<button class="btn primary" id="quickCreate">+ Đăng tin</button>' : ''}</div>${rooms.slice(0, 5).map(item).join('') || '<p class="empty">Chưa có dữ liệu.</p>'}</div>`;
      if (user.role === 'landlord') $('#quickCreate').addEventListener('click', () => roomForm());
    } catch (error) {
      console.error(error);
      $('#content').innerHTML = `<div class="panel"><h3>Không thể tải dữ liệu</h3><p>${escapeHtml(error.message)}</p></div>`;
    }
  };

  document.querySelectorAll('#nav button').forEach((button) => {
    button.addEventListener('click', () => render(button.dataset.v));
  });

  render();
})();
