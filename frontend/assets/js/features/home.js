(() => {
  const $ = (selector) => document.querySelector(selector);
  const ROOT = document.body.dataset.appRoot || '';
  const page = (path) => `${ROOT}${path}`;
  const money = (n) => new Intl.NumberFormat('vi-VN').format(Number(n || 0)) + ' đ';

  let rooms = [];
  let landlords = [];
  let user = null;
  let savedIds = new Set();
  let visibleCount = 9;

  const escapeHtml = (value = '') => String(value).replace(/[&<>'\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));

  const formatNoticeTime = (value) => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }).format(d); };

  const loadNotifications = async () => {
    const wrap = $('#noticeWrap'); const button = $('#notice'); const menu = $('#noticeMenu');
    if (!wrap || !button || !menu || !user) return;
    try {
      const response = await API.get('/api/notifications');
      const items = response.data || []; const unread = Number(response.unread || 0);
      const badge = button.querySelector('em'); if (badge) { badge.textContent = unread > 9 ? '9+' : unread; badge.hidden = unread === 0; }
      menu.innerHTML = `<div class="notice-menu-head"><strong>Thông báo</strong>${unread ? '<button id="readAllNotices">Đánh dấu đã đọc</button>' : ''}</div>${items.length ? items.slice(0,8).map((item) => `<button class="notice-item ${item.read ? '' : 'unread'}" data-notice-id="${escapeHtml(item.id)}"><span class="notice-dot"></span><span><b>${escapeHtml(item.title || 'Thông báo')}</b><small>${escapeHtml(item.message || '')}</small><i>${formatNoticeTime(item.created_at)}</i></span></button>`).join('') : '<div class="notice-empty">Chưa có thông báo mới.</div>'}`;
      menu.querySelector('#readAllNotices')?.addEventListener('click', async () => { await API.put('/api/notifications/read-all'); await loadNotifications(); });
      menu.querySelectorAll('.notice-item').forEach((item) => item.addEventListener('click', async () => { const noticeId = item.dataset.noticeId; await API.put(`/api/notifications/${encodeURIComponent(noticeId)}/read`); menu.hidden = true; await loadNotifications(); }));
    } catch (error) { console.warn('notification', error); }
  };

  const toast = (message) => {
    let element = $('#toast');
    if (!element) {
      element = document.createElement('div');
      element.id = 'toast';
      document.body.appendChild(element);
    }
    element.textContent = message;
    element.style.opacity = '1';
    element.style.transform = 'none';
    setTimeout(() => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(8px)';
    }, 1800);
  };

  const loadSavedState = async () => {
    savedIds = new Set();
    if (!user || user.role !== 'tenant') return;
    try {
      const response = await API.get('/api/saved');
      savedIds = new Set(response.room_ids || []);
    } catch (error) {
      console.warn('Không thể tải tin đã lưu:', error);
    }
  };

  const loadRooms = async () => {
    const filters = RoomFilters.values();
    const params = RoomFilters.toQuery(filters);
    const response = await API.get(`/api/rooms?${params.toString()}`);
    rooms = response.data || [];
  };

  const profileInitials = (name = '') => name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase() || 'U';

  const menuItems = () => {
    if (!user) return '';
    if (user.role === 'tenant') return `
      <div class="profile-menu-label">NGƯỜI THUÊ</div>
      <a href="#" data-menu-placeholder="Bài đăng yêu thích">♡ <span>Bài đăng yêu thích</span></a>
      <a href="${page('pages/dashboard.html?view=saved')}">▱ <span>Tin đã lưu</span></a>
      <a href="#" data-menu-placeholder="Ưu đãi">✦ <span>Ưu đãi</span></a>
      <a href="#" data-menu-placeholder="Đánh giá từ tôi">★ <span>Đánh giá từ tôi</span></a>
      <a href="#" data-menu-placeholder="Xem hóa đơn">▤ <span>Xem hóa đơn</span></a>
      <div class="profile-menu-divider"></div>
      <button type="button" id="menuLogout">↪ <span>Đăng xuất</span></button>`;
    return `
      <div class="profile-menu-label">CHỦ TRỌ</div>
      <a href="${page('pages/dashboard.html?view=listings')}">▦ <span>Quản lí phòng trọ</span></a>
      <a href="${page('pages/dashboard.html?view=requests')}">♙ <span>Quản lí khách thuê</span></a>
      <a href="#" data-menu-placeholder="Quản lý hóa đơn">▤ <span>Quản lý hóa đơn</span></a>
      <a href="#" data-menu-placeholder="Xác thực chính chủ">✓ <span>Xác thực chính chủ</span></a>
      <a href="#" data-menu-placeholder="Báo cáo sự cố">⚠ <span>Báo cáo sự cố</span></a>
      <a href="${page('pages/dashboard.html?view=listings&action=create')}">＋ <span>Tạo bài đăng</span></a>
      <div class="profile-menu-divider"></div>
      <button type="button" id="menuLogout">↪ <span>Đăng xuất</span></button>`;
  };

  const bindProfileMenu = () => {
    const trigger = $('#profileTrigger');
    const menu = $('#profileMenu');
    if (!trigger || !menu) return;
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      menu.hidden = !menu.hidden;
      trigger.setAttribute('aria-expanded', String(!menu.hidden));
    });
    const closeMenu = () => { menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
    document.addEventListener('click', closeMenu);
    menu.addEventListener('click', (event) => event.stopPropagation());
    menu.querySelectorAll('[data-menu-placeholder]').forEach((item) => {
      item.addEventListener('click', (event) => {
        event.preventDefault();
        menu.hidden = true;
        toast(`${item.dataset.menuPlaceholder}: khu vực này sẽ được bổ sung ở phase tiếp theo.`);
      });
    });
    menu.querySelector('#menuLogout')?.addEventListener('click', async () => {
      await API.post('/api/auth/logout');
      location.href = '/';
    });
  };

  const updateNav = async () => {
    user = await Session.load();
    const nav = document.querySelector('header.nav nav');
    if (!nav) return;

    if (!user) {
      nav.innerHTML = `
        <a href="${page('pages/map.html')}">◉ Bản đồ</a>
        <button id="saved" aria-label="Tin đã lưu">♡</button>
        <button id="notice" aria-label="Thông báo">♢<em></em></button>
        <a class="btn primary" href="${page('pages/login.html')}">Đăng nhập</a>`;
      return;
    }

    const initials = profileInitials(user.name);
    nav.innerHTML = `
      <a href="${page('pages/map.html')}">◉ Bản đồ</a>
      <div id="noticeWrap" class="notice-wrap">
        <button id="notice" class="notice-button" aria-label="Thông báo">⌁<em></em></button>
        <div id="noticeMenu" class="notice-menu" hidden></div>
      </div>
      <div class="profile-menu">
        <button class="profile-trigger" id="profileTrigger" aria-expanded="false" aria-label="Mở menu tài khoản">
          <span class="profile-avatar">${initials}</span>
          <span class="profile-trigger-text">${user.name} · ${user.role === 'landlord' ? 'Chủ trọ' : 'Người thuê'}</span>
          <span class="profile-chevron">⌄</span>
        </button>
        <div class="profile-menu-panel" id="profileMenu" hidden>${menuItems()}</div>
      </div>`;
    bindProfileMenu();
    const noticeButton = $('#notice'); const noticeMenu = $('#noticeMenu');
    noticeButton?.addEventListener('click', (event) => { event.stopPropagation(); if (noticeMenu) noticeMenu.hidden = !noticeMenu.hidden; });
    noticeMenu?.addEventListener('click', (event) => event.stopPropagation());
    document.addEventListener('click', (event) => { if (noticeMenu && !event.target.closest('#noticeWrap')) noticeMenu.hidden = true; });
    loadNotifications();
  };

  const toggleSaved = async (id) => {
    if (!user) {
      location.href = page(`pages/login.html?role=tenant&next=${encodeURIComponent('/user/')}`);
      return;
    }
    if (user.role !== 'tenant') {
      toast('Tính năng lưu tin dành cho người thuê.');
      return;
    }
    try {
      if (savedIds.has(id)) {
        await API.delete(`/api/saved/${encodeURIComponent(id)}`);
        savedIds.delete(id);
        toast('Đã bỏ lưu tin');
      } else {
        await API.post(`/api/saved/${encodeURIComponent(id)}`);
        savedIds.add(id);
        toast('Đã lưu tin');
      }
      renderRooms();
    } catch (error) {
      toast(error.message || 'Không thể cập nhật tin đã lưu');
    }
  };

  const renderRooms = () => {
    const total = rooms.length;
    const shown = rooms.slice(0, visibleCount);
    $('#count').textContent = `${total} phòng`;
    $('#rooms').innerHTML = shown.map((room) => {
      const landlord = room.landlord || landlords.find((x) => x.id === room.landlord_id) || {};
      const isSaved = savedIds.has(room.id);
      return `
        <article class="card">
          <div class="photo" style="background-image:url('${room.image || ''}')">
            <span class="verified">${room.verified ? '✓ Đã xác thực' : 'Tin mới'}</span>
            <button class="save ${isSaved ? 'saved' : ''}" data-id="${room.id}" title="${isSaved ? 'Bỏ lưu' : 'Lưu tin'}">${isSaved ? '♥' : '♡'}</button>
          </div>
          <div class="body">
            <div class="price">${money(room.price)} <i>/ tháng</i></div>
            <div class="title">${room.title}</div>
            <div class="meta2">${room.area}m² · ${room.type} · ★ ${room.rating || 0} · 💬 ${room.comments_count || 0}</div>
            <div class="address">⌖ ${room.address}</div>
            <div class="tags">${(room.amenities || []).slice(0, 3).map((x) => `<span class="tag">${x}</span>`).join('')}</div>
            <div class="card-foot">
              <span class="mini"><img src="${landlord.avatar || ''}" alt="">${landlord.name || 'Chủ trọ'}</span>
              <a href="${page(`pages/room.html?id=${encodeURIComponent(room.id)}`)}">Chi tiết →</a>
            </div>
          </div>
        </article>`;
    }).join('') || '<div style="grid-column:1/-1;text-align:center;padding:50px;color:#667085">Không tìm thấy phòng phù hợp.</div>';

    const moreWrap = $('#loadMoreWrap');
    const moreButton = $('#loadMore');
    if (moreWrap && moreButton) {
      const hasMore = shown.length < total;
      moreWrap.hidden = !hasMore;
      if (hasMore) {
        const remaining = total - shown.length;
        moreButton.textContent = remaining > 9 ? 'Xem thêm 9 phòng →' : `Xem thêm ${remaining} phòng →`;
      }
    }

    document.querySelectorAll('.save').forEach((button) => {
      button.addEventListener('click', () => toggleSaved(button.dataset.id));
    });
  };

  const applyFilters = async () => {
    visibleCount = 9;
    try {
      await loadRooms();
      renderRooms();
    } catch (error) {
      console.error(error);
      toast('Không thể tải dữ liệu phòng');
    }
  };

  const animateCounters = () => {
    document.querySelectorAll('.counter').forEach((counter) => {
      const target = Number(counter.dataset.target);
      const decimal = counter.dataset.decimal === 'true';
      const start = performance.now();
      const duration = 1400;
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const value = target * ease;
        counter.textContent = decimal ? value.toFixed(1) : Math.floor(value).toLocaleString('en-US');
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  const applyUserHomeCopy = () => {
    if (document.body.dataset.userHome !== 'true' || !user) return;
    const tenant = user.role === 'tenant';
    const eyebrow = $('#userRoleEyebrow');
    const title = $('#userRoleTitle');
    const subtitle = $('#userRoleSubtitle');
    const description = $('#userRoleDescription');
    if (eyebrow) eyebrow.textContent = tenant ? 'KHÔNG GIAN NGƯỜI THUÊ' : 'KHÔNG GIAN CHỦ TRỌ';
    if (title) title.textContent = tenant ? 'Tìm phòng phù hợp với nhu cầu.' : 'Quản lý việc đăng phòng hiệu quả.';
    if (subtitle) subtitle.textContent = tenant ? 'theo cách của bạn.' : 'tiếp cận đúng người thuê.';
    if (description) description.textContent = tenant
      ? 'Tìm kiếm, lọc, xem bản đồ và tiếp tục các thao tác thuê trọ ngay trong không gian cá nhân.'
      : 'Trang tìm trọ vẫn giữ nguyên, đồng thời được định hướng thành không gian cá nhân cho chủ trọ trong các phase tiếp theo.';
  };

  const init = async () => {
    await RoomFilters.loadOptions();
    await updateNav();
    if (document.body.dataset.userHome === 'true' && !user) {
      location.href = '/';
      return;
    }
    applyUserHomeCopy();
    await loadSavedState();

    try {
      await loadRooms();
      const landlordResponse = await API.get('/api/landlords');
      landlords = landlordResponse.data || [];
      renderRooms();
      $('#landlords').innerHTML = landlords.map((landlord) => `
        <div class="landlord">
          <img src="${landlord.avatar || ''}" alt="">
          <h3>${landlord.name} ✓</h3>
          <p>★ ${landlord.rating || 0} · ${landlord.reviews || 0} đánh giá</p>
          <small>${landlord.rooms || 0} tin · phản hồi ${landlord.response_rate || 0}%</small>
        </div>`).join('');
    } catch (error) {
      console.error(error);
      $('#rooms').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:50px;color:#667085">Không thể tải dữ liệu phòng. Hãy kiểm tra Flask.</div>';
    }

    ['search', 'heroSearch'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', () => {
        if (id === 'heroSearch') $('#search').value = $('#heroSearch').value;
        applyFilters();
      });
    });
    ['district', 'price', 'type', 'area'].forEach((id) => document.getElementById(id)?.addEventListener('change', applyFilters));
    $('#find')?.addEventListener('click', () => {
      $('#search').value = $('#heroSearch').value;
      $('#listings')?.scrollIntoView({ behavior: 'smooth' });
      applyFilters();
    });
    $('#reset')?.addEventListener('click', () => {
      RoomFilters.clearHomeFilters();
      applyFilters();
    });
    $('#saved')?.addEventListener('click', () => {
      if (!user) {
        location.href = page('pages/login.html?role=tenant&next=/user/');
        return;
      }
      if (user.role === 'tenant') location.href = page('pages/dashboard.html?view=saved');
      else toast('Tin đã lưu dành cho người thuê.');
    });
    $('#notice')?.addEventListener('click', () => {
      if (!user) return toast('Đăng nhập để xem yêu cầu của bạn.');
      location.href = page('pages/dashboard.html?view=requests');
    });
    $('#heroScroll')?.addEventListener('click', () => $('#listings')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    document.querySelectorAll('.hero-chip').forEach((chip) => chip.addEventListener('click', () => { $('#heroSearch').value = chip.dataset.query || ''; $('#search').value = chip.dataset.query || ''; $('#listings')?.scrollIntoView({ behavior:'smooth', block:'start' }); applyFilters(); }));
    $('#loadMore')?.addEventListener('click', () => {
      visibleCount = Math.min(visibleCount + 9, rooms.length);
      renderRooms();
    });
    setTimeout(animateCounters, 650);
  };

  init();
})();
