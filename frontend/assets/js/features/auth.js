(() => {
  const $ = (selector) => document.querySelector(selector);
  const loginForm = $('#loginForm');
  const registerForm = $('#registerForm');
  const modeTitle = $('#modeTitle');
  const modeDescription = $('#modeDescription');
  const switchMode = $('#switchMode');
  const modeText = $('#modeText');
  const roleHint = $('#roleHint');
  const loginRole = $('#loginRole');
  const registerRole = $('#registerRole');
  const loginEmail = $('#loginEmail');
  const registerEmail = $('#registerEmail');

  let mode = 'login';

  const nextPath = () => {
    const next = new URLSearchParams(location.search).get('next');
    return next || '/user/';
  };

  const setMode = (nextMode) => {
    mode = nextMode;
    const isLogin = mode === 'login';
    loginForm.hidden = !isLogin;
    registerForm.hidden = isLogin;
    $('#step').textContent = isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ';
    modeTitle.textContent = isLogin ? 'Đăng nhập tài khoản' : 'Tạo tài khoản TrọSmart';
    modeDescription.textContent = isLogin
      ? 'Nhập tài khoản đã có trong hệ thống để tiếp tục.'
      : 'Chọn vai trò và tạo tài khoản demo để vào trang chủ.';
    switchMode.textContent = isLogin ? 'Đăng ký tài khoản' : 'Đăng nhập';
    modeText.textContent = isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?';
    roleHint.textContent = isLogin
      ? 'Vai trò được lấy từ tài khoản phía máy chủ, không tin vào lựa chọn của frontend khi đăng nhập.'
      : 'Vai trò bạn đăng ký sẽ được lưu trong dữ liệu người dùng của hệ thống.';
  };

  switchMode.addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));

  document.querySelectorAll('[data-role]').forEach((button) => {
    button.addEventListener('click', () => {
      const role = button.dataset.role;
      if (loginRole) loginRole.value = role;
      if (registerRole) registerRole.value = role;
      document.querySelectorAll('[data-role]').forEach((b) => b.classList.toggle('active', b === button));
    });
  });

  const params = new URLSearchParams(location.search);
  const requestedRole = params.get('role');
  if (requestedRole === 'landlord' || requestedRole === 'tenant') {
    const button = document.querySelector(`[data-role="${requestedRole}"]`);
    if (button) button.click();
  } else {
    document.querySelector('[data-role="tenant"]')?.click();
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = loginForm.querySelector('button[type="submit"]');
    submit.disabled = true;

    try {
      await API.post('/api/auth/login', {
        email: loginEmail.value.trim(),
        password: $('#loginPassword').value
      });
      location.href = nextPath();
    } catch (error) {
      alert(error.message || 'Không thể đăng nhập.');
    } finally {
      submit.disabled = false;
    }
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = registerForm.querySelector('button[type="submit"]');
    submit.disabled = true;

    const password = $('#registerPassword').value;
    const confirmPassword = $('#registerPasswordConfirm').value;
    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp.');
      submit.disabled = false;
      return;
    }

    try {
      await API.post('/api/auth/register', {
        name: $('#registerName').value.trim(),
        email: registerEmail.value.trim(),
        password,
        role: registerRole.value
      });
      location.href = nextPath();
    } catch (error) {
      alert(error.message || 'Không thể tạo tài khoản.');
    } finally {
      submit.disabled = false;
    }
  });

  setMode('login');
})();
