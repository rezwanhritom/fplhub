document.addEventListener('DOMContentLoaded', function () {
  const usernameInput = document.getElementById('username');
  const submitButton = document.getElementById('submitBtn');
  const usernameError = document.getElementById('usernameError');
  const signupForm = document.getElementById('signupForm');

  signupForm.action = FPLHUB.url('google_signup.php');

  function checkUsernameAvailability() {
    const username = usernameInput.value.trim();
    submitButton.disabled = true;

    if (username === '') {
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
          usernameError.textContent = 'Username is already taken. Please choose another.';
          submitButton.disabled = true;
        } else if (response.includes('available')) {
          usernameError.textContent = '';
          submitButton.disabled = false;
        } else {
          usernameError.textContent = 'Error checking username availability.';
          submitButton.disabled = true;
        }
      })
      .catch(() => {
        usernameError.textContent = 'Network error. Please try again later.';
        submitButton.disabled = true;
      });
  }

  usernameInput.addEventListener('blur', checkUsernameAvailability);
  usernameInput.addEventListener('input', checkUsernameAvailability);

  signupForm.addEventListener('submit', function (e) {
    if (usernameError.textContent !== '') {
      e.preventDefault();
    }
  });
});
