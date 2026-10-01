const registerForm = document.getElementById("registerForm");
const formError = document.getElementById("formError");

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const button = registerForm.querySelector("button[type=submit]");

    clearNotice(formError);
    button.disabled = true;
    button.textContent = "Creating account... (the server can take up to a minute to wake up)";

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (response.status === 409) throw new Error("That username is already taken.");
        if (!response.ok) throw new Error(await readError(response));

        window.location.href = "index.html?registered=1";
    } catch (error) {
        const message = error instanceof TypeError
            ? "Cannot reach the server. If it was idle, wait a minute and try again."
            : error.message;
        showNotice(formError, message, "error");
        button.disabled = false;
        button.textContent = "Register";
    }
});
