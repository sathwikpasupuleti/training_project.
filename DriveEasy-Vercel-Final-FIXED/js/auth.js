/**
 * DriveEasy - Authentication Script
 * Handles Login & Registration forms using window.userService.
 * NO direct Axios calls.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupLoginForm();
  setupRegisterForm();
  
  // Detect if opened from register.html or login.html
  if (window.location.pathname.includes('register.html')) {
    setTab('register');
  } else {
    setTab('login');
  }
});

function setupTabs() {
  const loginTab = document.getElementById('tab-login-btn');
  const registerTab = document.getElementById('tab-register-btn');
  const promptBtn = document.getElementById('switch-prompt-btn');

  loginTab?.addEventListener('click', () => setTab('login'));
  registerTab?.addEventListener('click', () => setTab('register'));
  promptBtn?.addEventListener('click', () => {
    const isLoginActive = loginTab?.classList.contains('active');
    setTab(isLoginActive ? 'register' : 'login');
  });
}

function setTab(mode) {
  const loginTab = document.getElementById('tab-login-btn');
  const registerTab = document.getElementById('tab-register-btn');
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');
  const heroTitle = document.getElementById('auth-main-title');
  const heroSub = document.getElementById('auth-main-sub');
  const promptLabel = document.getElementById('switch-prompt-label');
  const promptBtn = document.getElementById('switch-prompt-btn');

  if (mode === 'login') {
    loginTab?.classList.add('active');
    registerTab?.classList.remove('active');
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';

    if (heroTitle) heroTitle.textContent = 'Welcome Back!';
    if (heroSub) heroSub.textContent = 'Login to manage your bookings, explore self-drive rentals, and hit the open road.';
    if (promptLabel) promptLabel.textContent = "Don't have an account?";
    if (promptBtn) promptBtn.textContent = 'Register';
  } else {
    registerTab?.classList.add('active');
    loginTab?.classList.remove('active');
    if (registerForm) registerForm.style.display = 'block';
    if (loginForm) loginForm.style.display = 'none';

    if (heroTitle) heroTitle.textContent = 'Join DriveEasy';
    if (heroSub) heroSub.textContent = 'Create an account in 60 seconds to unlock exclusive self-drive rates.';
    if (promptLabel) promptLabel.textContent = 'Already registered?';
    if (promptBtn) promptBtn.textContent = 'Login';
  }
}

function setupLoginForm() {
  const form = document.getElementById('form-login');
  const submitBtn = document.getElementById('login-submit-btn');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;

    try {
      window.validateEmail(email);
      window.validateRequired(password, 'Password');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Signing In...';
      }

      // Call User Service
      const user = await window.userService.loginUser(email, password);

      window.utils.setCurrentUser(user);
      window.utils.showToast(`Welcome back, ${user.name}!`, 'success');

      setTimeout(() => {
        if (user.role === 'admin') {
          window.location.href = '/views/dashboard.html';
        } else {
          window.location.href = '/views/index.html';
        }
      }, 700);
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Login</span><span class="material-symbols-outlined" style="font-size: 18px;">arrow_forward</span>';
      }
      window.utils.showToast(err.message, 'error');
    }
  });
}

function setupRegisterForm() {
  const form = document.getElementById('form-register');
  const submitBtn = document.getElementById('register-submit-btn');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name')?.value;
    const email = document.getElementById('reg-email')?.value;
    const phone = document.getElementById('reg-phone')?.value;
    const pass = document.getElementById('reg-password')?.value;
    const confirm = document.getElementById('reg-confirm-password')?.value;

    try {
      window.validateRequired(name, 'Full Name');
      window.validateEmail(email);
      window.validatePhone(phone);
      window.validateRequired(pass, 'Password');

      if (pass.length < 6) {
        throw new window.ValidationException('Password must be at least 6 characters long', 'password');
      }

      if (pass !== confirm) {
        throw new window.ValidationException('Passwords do not match', 'confirmPassword');
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Creating Account...';
      }

      // Duplicate email check
      const existing = await window.userService.getUsers({ email });
      if (existing && existing.length > 0) {
        throw new window.ValidationException('An account with this email already exists', 'email');
      }

      const newUser = {
        name,
        email,
        phone,
        password: pass,
        role: 'user'
      };

      const created = await window.userService.registerUser(newUser);
      window.utils.setCurrentUser(created);
      window.utils.showToast('Account created successfully!', 'success');

      setTimeout(() => {
        window.location.href = '/views/index.html';
      }, 800);
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Create Account</span><span class="material-symbols-outlined" style="font-size: 18px;">check_circle</span>';
      }
      window.utils.showToast(err.message, 'error');
    }
  });
}

window.togglePassVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon = btn.querySelector('.material-symbols-outlined');
  if (input && icon) {
    if (input.type === 'password') {
      input.type = 'text';
      icon.textContent = 'visibility_off';
    } else {
      input.type = 'password';
      icon.textContent = 'visibility';
    }
  }
};

window.mockSocialAuth = function(provider) {
  window.utils.showToast(`Connecting with ${provider}...`);
  setTimeout(() => {
    const demoUser = {
      id: Date.now(),
      name: `${provider} User`,
      email: `user@${provider.toLowerCase()}.com`,
      phone: '+91 98888 77777',
      role: 'user'
    };
    window.utils.setCurrentUser(demoUser);
    window.utils.showToast(`Logged in with ${provider}!`, 'success');
    setTimeout(() => {
      window.location.href = '/views/index.html';
    }, 600);
  }, 900);
};
