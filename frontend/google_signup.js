document.addEventListener("DOMContentLoaded", function () {
    const usernameInput = document.getElementById("username");
    const submitButton = document.getElementById("submitBtn");
    const usernameError = document.getElementById("usernameError");
    const signupForm = document.getElementById("signupForm");

    // Function to validate username availability
    function checkUsernameAvailability() {
        const username = usernameInput.value.trim();

        // Ensure the submit button is disabled by default
        submitButton.disabled = true;

        // If the username is empty, reset the error and leave the button disabled
        if (username === "") {
            usernameError.textContent = "";
            return;
        }

        // Send AJAX request to check if username exists
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost/fpl_hub/check_username.php", true); // Correct URL
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

    // Event listener for blur event (when the username field loses focus)
    usernameInput.addEventListener("blur", checkUsernameAvailability);

    // Also check username availability on form input to ensure button reacts immediately
    usernameInput.addEventListener("input", checkUsernameAvailability);

    // Prevent form submission if there's an error
    signupForm.addEventListener("submit", function (e) {
        if (usernameError.textContent !== "") {
            e.preventDefault(); // Prevent form submission if there's an error
        }
    });
});
