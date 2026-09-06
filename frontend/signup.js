document.addEventListener("DOMContentLoaded", function () {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm_password");
    const submitButton = document.getElementById("submitBtn");
    const usernameError = document.getElementById("usernameError");
    const passwordError = document.getElementById("passwordError");
    const passwordStrength = document.getElementById("passwordStrength");
    const passwordCriteria = document.getElementById("passwordCriteria");
    const signupForm = document.getElementById("signupForm");

    function checkUsernameAvailability() {
        const username = usernameInput.value.trim();
        submitButton.disabled = true;
        
        if (username === "") {
            usernameError.textContent = "";
            return;
        }
        
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost/fpl_hub/check_username.php", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        xhr.onload = function () {
            console.log(xhr.responseText); // Debugging: log the response
            if (xhr.status === 200) {
                const response = xhr.responseText.trim();
                if (response === "Database connection successful!taken") {
                    usernameError.textContent = "Username is already taken. Please choose another.";
                    submitButton.disabled = true; // Keep it disabled
                } else if (response === "Database connection successful!available") {
                    usernameError.textContent = ""; // Clear error
                    submitButton.disabled = false; // Enable submit button
                } else {
                    usernameError.textContent = "Error checking username availability.";
                    submitButton.disabled = true;
                }
            } else {
                usernameError.textContent = "Error checking username availability.";
                submitButton.disabled = true;
            }
        };        

        xhr.onerror = function () {
            usernameError.textContent = "Network error. Please try again later.";
        };

        xhr.send("username=" + encodeURIComponent(username));
    }

    function validateForm() {
        const isUsernameValid = usernameError.textContent === "";
        const isPasswordStrong = passwordCriteria.textContent === "Strong password!";
        const isPasswordMatch = passwordError.textContent === "";
        const areFieldsFilled = usernameInput.value.trim() !== "" && 
                                passwordInput.value !== "" && 
                                confirmPasswordInput.value !== "";
    
        console.log("Validation State:", { isUsernameValid, isPasswordStrong, isPasswordMatch, areFieldsFilled });
    
        submitButton.disabled = !(isUsernameValid && isPasswordStrong && isPasswordMatch && areFieldsFilled);
    }
    
    // Ensure `passwordCriteria` updates correctly:
    function validatePasswordStrength() {
        const password = passwordInput.value;
        let strength = 0;
        const criteria = [];
    
        if (password.length >= 8) strength++;
        else criteria.push("At least 8 characters");
    
        if (/[A-Z]/.test(password)) strength++;
        else criteria.push("One uppercase letter");
    
        if (/[a-z]/.test(password)) strength++;
        else criteria.push("One lowercase letter");
    
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        else criteria.push("One special character");
    
        document.getElementById("password-strength-bar").value = strength * 25;
        passwordCriteria.textContent = criteria.length ? `Missing: ${criteria.join(", ")}` : "Strong password!";
    
        validateForm();
    }
    

    function validatePasswordMatch() {
        if (confirmPasswordInput.value !== passwordInput.value) {
            passwordError.textContent = "Passwords do not match!";
        } else {
            passwordError.textContent = "";
        }
        validateForm();
    }

    function validateForm() {
        if (
            usernameError.textContent === "" &&
            passwordCriteria.textContent === "Strong password!" &&
            passwordError.textContent === "" &&
            usernameInput.value.trim() !== "" &&
            passwordInput.value !== "" &&
            confirmPasswordInput.value !== ""
        ) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    }

    usernameInput.addEventListener("blur", checkUsernameAvailability);
    usernameInput.addEventListener("input", checkUsernameAvailability);
    passwordInput.addEventListener("input", validatePasswordStrength);
    confirmPasswordInput.addEventListener("input", validatePasswordMatch);
    signupForm.addEventListener("submit", function (e) {
        if (submitButton.disabled) {
            e.preventDefault();
        }
    });
});
