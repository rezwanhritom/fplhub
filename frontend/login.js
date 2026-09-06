document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.querySelector('.auth-submit');
  const usernameError = document.getElementById('username-error');
  const passwordError = document.getElementById('password-error');

  document.getElementById('google-login')?.addEventListener('click', () => {
    location.href = FPLHUB.url('google_login.php');
  });

  function checkUsername() {
    const username = usernameInput.value.trim();
    loginBtn.disabled = true;
    usernameError.textContent = '';
    if (!username) return;

    fetch(FPLHUB.url('check_username.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=' + encodeURIComponent(username),
    })
      .then((r) => r.text())
      .then((text) => {
        const response = text.trim();
        if (response.includes('taken')) {
          loginBtn.disabled = !passwordInput.value;
        } else {
          usernameError.textContent = 'Username does not exist';
          loginBtn.disabled = true;
        }
      })
      .catch(() => {
        usernameError.textContent = 'Could not verify username';
      });
  }

  function syncButton() {
    if (usernameError.textContent) {
      loginBtn.disabled = true;
      return;
    }
    loginBtn.disabled = !(usernameInput.value.trim() && passwordInput.value);
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    passwordError.textContent = '';
    fetch(FPLHUB.url('login.php'), { method: 'POST', body: new FormData(loginForm) })
      .then((r) => r.text())
      .then((text) => {
        const jsonStart = text.indexOf('{');
        return JSON.parse(text.slice(jsonStart));
      })
      .then((data) => {
        if (data.success) {
          location.href = FPLHUB.page('dash.html');
          return;
        }
        if (data.errorType === 'username') usernameError.textContent = 'Invalid username';
        if (data.errorType === 'password') passwordError.textContent = 'Invalid password';
        if (data.errorType === 'google_user') {
          passwordError.textContent = 'Please use Continue with Google';
        }
      })
      .catch((err) => console.error(err));
  });

  usernameInput.addEventListener('input', () => {
    checkUsername();
    syncButton();
  });
  passwordInput.addEventListener('input', syncButton);
  usernameInput.addEventListener('blur', checkUsername);
});
