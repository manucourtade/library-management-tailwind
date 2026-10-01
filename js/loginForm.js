if (Session.isActive()) {
    window.location.replace("books.html");
}

const loginForm = document.getElementById("loginForm");
const formError = document.getElementById("formError");

if (new URLSearchParams(window.location.search).get("registered")) {
    showNotice(formError, "Account created. You can log in now.", "ok");
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const button = loginForm.querySelector("button[type=submit]");

    clearNotice(formError);
    button.disabled = true;
    button.textContent = "Logging in... (the server can take up to a minute to wake up)";

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (response.status === 401) throw new Error("Wrong username or password.");
        if (!response.ok) throw new Error(await readError(response));

        Session.save(await response.json());
        window.location.href = "books.html";
    } catch (error) {
        const message = error instanceof TypeError
            ? "Cannot reach the server. If it was idle, wait a minute and try again."
            : error.message;
        showNotice(formError, message, "error");
        button.disabled = false;
        button.textContent = "Log in";
    }
});
