document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm_password');
  const submitButton = document.getElementById('submitBtn');
  const usernameError = document.getElementById('usernameError');
  const passwordError = document.getElementById('passwordError');
  const passwordCriteria = document.getElementById('passwordCriteria');

  document.getElementById('google-signup')?.addEventListener('click', () => {
    location.href = FPLHUB.url('google_login.php');
  });

  let usernameOk = false;

  function validatePasswordStrength() {
    const password = passwordInput.value;
    let strength = 0;
    const criteria = [];
    if (password.length >= 8) strength++;
    else criteria.push('8+ chars');
    if (/[A-Z]/.test(password)) strength++;
    else criteria.push('uppercase');
    if (/[a-z]/.test(password)) strength++;
    else criteria.push('lowercase');
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    else criteria.push('symbol');
    document.getElementById('password-strength-bar').value = strength * 25;
    passwordCriteria.textContent = criteria.length
      ? `Missing: ${criteria.join(', ')}`
      : 'Strong password!';
    syncSubmit();
  }

  function validateMatch() {
    if (confirmPasswordInput.value && confirmPasswordInput.value !== passwordInput.value) {
      passwordError.textContent = 'Passwords do not match!';
    } else {
      passwordError.textContent = '';
    }
    syncSubmit();
  }

  function syncSubmit() {
    const strong = passwordCriteria.textContent === 'Strong password!';
    const match = passwordError.textContent === '';
    submitButton.disabled = !(
      usernameOk &&
      strong &&
      match &&
      usernameInput.value &&
      passwordInput.value &&
      confirmPasswordInput.value &&
      document.getElementById('fullname').value &&
      document.getElementById('email').value &&
      document.getElementById('fantasy_team').value
    );
  }

  function checkUsernameAvailability() {
    const username = usernameInput.value.trim();
    usernameOk = false;
    submitButton.disabled = true;
    if (!username) {
      usernameError.textContent = '';
      return;
    }
    fetch(FPLHUB.url('check_username.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=' + encodeURIComponent(username),
    })
      .then((r) => r.text())
      .then((text) => {
        const response = text.trim();
        if (response.includes('taken')) {
          usernameError.textContent = 'Username is already taken.';
          usernameOk = false;
        } else if (response.includes('available')) {
          usernameError.textContent = '';
          usernameOk = true;
        } else {
          usernameError.textContent = 'Could not check username.';
          usernameOk = false;
        }
        syncSubmit();
      });
  }

  usernameInput.addEventListener('input', checkUsernameAvailability);
  passwordInput.addEventListener('input', () => {
    validatePasswordStrength();
    validateMatch();
  });
  confirmPasswordInput.addEventListener('input', validateMatch);
  ['fullname', 'email', 'fantasy_team'].forEach((id) => {
    document.getElementById(id).addEventListener('input', syncSubmit);
  });
});
