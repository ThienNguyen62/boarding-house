(async () => {
  const $ = (selector) => document.querySelector(selector);
  const id = new URLSearchParams(location.search).get('id') || 'R001';
  const money = (n) => new Intl.NumberFormat('vi-VN').format(Number(n || 0)) + ' đ';
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  let user = null;
  let saved = false;

  const showToast = (message) => {
    let element = $('#toast');
    if (!element) { element = document.createElement('div'); element.id = 'toast'; document.body.appendChild(element); }
    element.textContent = message;
    element.style.cssText = 'position:fixed;right:20px;bottom:20px;background:#101828;color:#fff;padding:12px 15px;border-radius:12px;z-index:100;box-shadow:0 15px 35px rgba(16,24,40,.18);';
    setTimeout(() => element.remove(), 2200);
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || '';
    return new Intl.DateTimeFormat('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(date);
  };

  async function loadComments() {
    const target = $('#commentsList');
    if (!target) return;
    try {
      const response = await API.get(`/api/rooms/${encodeURIComponent(id)}/comments`);
      const comments = response.data || [];
      $('#commentsCount').textContent = comments.length;
      target.innerHTML = comments.length ? comments.map((comment) => `
        <article class="comment-item">
          <div class="comment-avatar">${escapeHtml((comment.user_name || 'U').trim().split(/\s+/).slice(-1)[0]?.[0] || 'U').toUpperCase()}</div>
          <div class="comment-body">
            <div class="comment-head"><strong>${escapeHtml(comment.user_name || 'Người dùng')}</strong><span>${formatDate(comment.created_at)}</span></div>
            <p>${escapeHtml(comment.content)}</p>
          </div>
        </article>`).join('') : '<div class="comments-empty">Chưa có bình luận. Hãy là người đầu tiên chia sẻ trải nghiệm.</div>';
    } catch (error) {
      target.innerHTML = '<div class="comments-empty">Không thể tải bình luận.</div>';
    }
  }

  async function postComment() {
    const input = $('#commentInput'); const button = $('#commentSubmit');
    if (!user) { location.href = `login.html?role=tenant&next=${encodeURIComponent(`room.html?id=${encodeURIComponent(id)}`)}`; return; }
    if (!input.value.trim()) { showToast('Hãy nhập nội dung bình luận.'); return; }
    button.disabled = true;
    try {
      await API.post(`/api/rooms/${encodeURIComponent(id)}/comments`, { content: input.value.trim() });
      input.value = '';
      await loadComments();
      showToast('Đã đăng bình luận');
    } catch (error) { showToast(error.message || 'Không thể đăng bình luận'); }
    finally { button.disabled = false; }
  }

  try {
    user = await Session.load();
    const response = await API.get(`/api/rooms/${encodeURIComponent(id)}`);
    const room = response.data; const landlord = room.landlord || {};
    document.title = `${room.title} — TrọSmart`;
    if (user?.role === 'tenant') { const savedResponse = await API.get('/api/saved'); saved = (savedResponse.room_ids || []).includes(room.id); }

    $('#detail').innerHTML = `
      <div class="detail-top">
        <div class="detail-img" style="background-image:url('${escapeHtml(room.image || '')}')"></div>
        <div class="summary">
          <small>${room.verified ? '✓ TIN ĐĂNG ĐÃ XÁC THỰC' : 'TIN ĐĂNG CHƯA XÁC THỰC'}</small>
          <h1>${escapeHtml(room.title)}</h1>
          <div>${room.area}m² · ${escapeHtml(room.type)} · ★ ${room.rating || 0}</div>
          <div class="bigprice">${money(room.price)} <small>/ tháng</small></div>
          <p>${escapeHtml(room.address)}</p>
          <div class="tags">${(room.amenities || []).map((x) => `<span class="tag">${escapeHtml(x)}</span>`).join('')}</div>
          <button class="btn primary" style="width:100%;margin-top:20px" id="contact">Liên hệ chủ trọ</button>
          <button class="btn outline" style="width:100%;margin-top:8px" id="save">${saved ? '♥ Đã lưu' : '♡ Lưu tin'}</button>
          <div class="room-listing-verification ${room.verified ? 'is-verified' : 'is-unverified'}"><span class="room-verification-icon">${room.verified ? '✓' : '!'}</span><div><strong>${room.verified ? 'TIN ĐĂNG ĐÃ XÁC THỰC' : 'TIN ĐĂNG CHƯA XÁC THỰC'}</strong><p>${room.verified ? 'Tin đăng đã được TrọSmart duyệt ngay trong quy trình MVP.' : 'Tin đăng chưa được chủ trọ xác minh.'}</p></div></div>
        </div>
      </div>
      <div id="contactPanel" class="box" style="display:none;margin-top:18px"><h3>Gửi yêu cầu cho chủ trọ</h3><p style="color:#667085;font-size:11px">Chủ trọ sẽ nhìn thấy yêu cầu trong mục “Yêu cầu thuê”.</p><textarea id="requestMessage" rows="4" style="width:100%;padding:12px;border:1px solid #e4e7ec;border-radius:10px;resize:vertical" placeholder="Ví dụ: Tôi muốn xem phòng vào chiều thứ Bảy."></textarea><button class="btn primary" id="sendRequest" style="margin-top:10px">Gửi yêu cầu</button></div>
      <div class="detail-grid">
        <div>
          <div class="box"><h3>Mô tả</h3><p>${escapeHtml(room.description || '')}</p><h3>Chi phí</h3><div class="amenities"><div class="amenity">Tiền cọc: <b>${money(room.deposit || room.price)}</b></div><div class="amenity">Điện: <b>${room.electricity || 0} đ/kWh</b></div><div class="amenity">Nước: <b>${room.water || 0} đ/người</b></div><div class="amenity">Phí dịch vụ: <b>${money(room.service_fee || 0)}</b></div></div></div>
          <div class="box"><h3>Tiện ích</h3><div class="amenities">${(room.amenities || []).map((x) => `<div class="amenity">✓ ${escapeHtml(x)}</div>`).join('')}</div></div>
          <div class="box"><h3>Xung quanh</h3><div class="amenities">${(room.nearby || []).map((x) => `<div class="amenity">⌖ ${escapeHtml(x)}</div>`).join('')}</div></div>
        </div>
        <aside><div class="box landlord-box"><h3>Chủ trọ</h3><div class="landlord-profile"><img src="${escapeHtml(landlord.avatar || '')}" alt=""><div><strong>${escapeHtml(landlord.name || 'Chủ trọ')}</strong><small>★ ${landlord.rating || 0} · ${landlord.reviews || 0} đánh giá</small></div></div>${landlord.verified ? `<div class="landlord-verified-panel"><span class="landlord-verified-icon">✓</span><div><strong>Chủ trọ đã xác thực</strong><p>Đã xác minh thông tin tài khoản bằng số điện thoại và CCCD.</p></div></div>` : `<div class="landlord-unverified-panel"><span>!</span><div><strong>Tài khoản chưa xác thực</strong><p>Ưu tiên tham khảo các tin có nhãn đã xác thực.</p></div></div>`}<p>Phản hồi ${landlord.response_rate || '—'}% · ${escapeHtml(landlord.response_time || '—')}</p></div><div class="box"><h3>Thông tin phòng</h3><div class="amenities"><div class="amenity">Giới tính: <b>${escapeHtml(room.gender || '—')}</b></div><div class="amenity">Nội thất: <b>${room.furnished ? 'Có' : 'Cơ bản'}</b></div><div class="amenity">Nhận phòng: <b>${escapeHtml(room.available_from || '—')}</b></div><div class="amenity">Lượt xem: <b>${room.views || 0}</b></div></div></div></aside>
      </div>
      <section class="comments-section box" id="commentsSection">
        <div class="comments-header"><div><small>CỘNG ĐỒNG</small><h2>Bình luận về phòng <span class="comments-count" id="commentsCount">0</span></h2><p>Tham khảo trải nghiệm và câu hỏi từ những người đã xem tin.</p></div></div>
        <div class="comment-composer">
          <div class="comment-avatar comment-avatar-main">${escapeHtml((user?.name || 'U').trim().split(/\s+/).slice(-1)[0]?.[0] || 'U').toUpperCase()}</div>
          <div class="comment-compose-body">
            <textarea id="commentInput" rows="3" placeholder="Chia sẻ điều bạn muốn biết về phòng này..."></textarea>
            <div class="comment-actions"><span>${user ? `Đang bình luận với tên ${escapeHtml(user.name)}` : 'Đăng nhập để viết bình luận'}</span><button class="btn primary" id="commentSubmit">${user ? 'Đăng bình luận' : 'Đăng nhập để bình luận'}</button></div>
          </div>
        </div>
        <div id="commentsList" class="comments-list"></div>
      </section>`;

    $('#contact').addEventListener('click', () => {
      if (!user) { location.href = `login.html?role=tenant&next=${encodeURIComponent(`room.html?id=${encodeURIComponent(room.id)}`)}`; return; }
      if (user.role !== 'tenant') return showToast('Chức năng liên hệ dành cho người thuê.');
      const panel = $('#contactPanel'); panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    $('#sendRequest').addEventListener('click', async () => { const button = $('#sendRequest'); button.disabled = true; try { await API.post('/api/requests', { room_id: room.id, message: $('#requestMessage').value.trim() }); showToast('Đã gửi yêu cầu cho chủ trọ'); $('#requestMessage').value = ''; $('#contactPanel').style.display = 'none'; } catch (error) { showToast(error.message || 'Không thể gửi yêu cầu'); } finally { button.disabled = false; } });
    $('#save').addEventListener('click', async () => { if (!user) { location.href = `login.html?role=tenant&next=${encodeURIComponent(`room.html?id=${encodeURIComponent(room.id)}`)}`; return; } if (user.role !== 'tenant') return showToast('Tính năng lưu tin dành cho người thuê.'); try { if (saved) { await API.delete(`/api/saved/${encodeURIComponent(room.id)}`); saved = false; } else { await API.post(`/api/saved/${encodeURIComponent(room.id)}`); saved = true; } $('#save').textContent = saved ? '♥ Đã lưu' : '♡ Lưu tin'; showToast(saved ? 'Đã lưu tin' : 'Đã bỏ lưu tin'); } catch (error) { showToast(error.message || 'Không thể cập nhật tin'); } });
    $('#commentSubmit').addEventListener('click', postComment);
    $('#commentInput').addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') postComment(); });
    await loadComments();
  } catch (error) { console.error(error); $('#detail').innerHTML = '<div class="box"><h3>Không thể tải tin trọ</h3><p>Hãy kiểm tra Flask đang chạy và mã phòng còn tồn tại.</p></div>'; }
})();
