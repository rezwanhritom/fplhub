document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("login-form");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const loginBtn = document.querySelector(".login-btn");
    const usernameError = document.getElementById("username-error");
    const passwordError = document.getElementById("password-error");

    // Username validation on input/blur
    function checkUsername() {
        const username = usernameInput.value.trim();
        loginBtn.disabled = true;

        if (!username) {
            usernameError.textContent = "";
            usernameError.classList.remove("show");
            return;
        }

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost/fpl_hub/check_username.php", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        xhr.onload = function() {
            console.log("Response:", xhr.responseText); // Debug
            const response = xhr.responseText.trim();
            
            if (response.includes("taken")) {
                usernameError.textContent = "";
                usernameError.classList.remove("show");
                loginBtn.disabled = false;
            } else {
                usernameError.textContent = "Username does not exist";
                usernameError.classList.add("show");
                loginBtn.disabled = true;
            }
        };

        xhr.send("username=" + encodeURIComponent(username));
    }

    // Form submission
    loginForm.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        
        fetch("http://localhost/fpl_hub/login.php", {
            method: "POST",
            body: formData
        })
        .then(response => response.text())
        .then(text => {
            console.log("Raw response:", text); // Debug
            const jsonStart = text.indexOf('{');
            const jsonText = text.slice(jsonStart);
            return JSON.parse(jsonText);
        })
        .then(data => {
            if (data.success) {
                window.location.href = "http://localhost/fpl_hub/frontend/dash.html";
            } else {
                switch(data.errorType) {
                    case "username":
                        usernameError.textContent = "Invalid username";
                        usernameError.classList.add("show");
                        break;
                    case "password":
                        passwordError.textContent = "Invalid password";
                        passwordError.classList.add("show");
                        break;
                    case "google_user":
                        passwordError.textContent = "Please use Continue with Google button";
                        passwordError.classList.add("show");
                        break;
                }
            }
        })
        .catch(error => {
            console.error("Login error:", error);
        });
    });

    // Add event listeners
    usernameInput.addEventListener("input", checkUsername);
    usernameInput.addEventListener("blur", checkUsername);
});