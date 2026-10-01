// Código compartido por todas las páginas: URL del backend, sesión y llamadas autenticadas.

const API_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:8080"
    : "https://library-management-api-3d5q.onrender.com";

const Session = {
    save(data) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
    },
    token() {
        return localStorage.getItem("token");
    },
    username() {
        return localStorage.getItem("username") || "";
    },
    payload() {
        try {
            const part = (this.token() || "").split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
            return JSON.parse(atob(part));
        } catch {
            return null;
        }
    },
    role() {
        const payload = this.payload();
        return payload ? payload.role : null;
    },
    isLibrarian() {
        return this.role() === "LIBRARIAN";
    },
    isExpired() {
        const payload = this.payload();
        return !payload || payload.exp * 1000 < Date.now();
    },
    isActive() {
        return Boolean(this.token()) && !this.isExpired();
    },
    clear() {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
    }
};

function goToLogin() {
    Session.clear();
    window.location.replace("index.html");
}

// Las páginas privadas llaman a esto al principio: sin sesión válida vuelven al login.
function requireSession() {
    if (!Session.isActive()) {
        goToLogin();
    }
}

async function readError(response) {
    try {
        const body = await response.json();
        if (body && body.message) return body.message;
    } catch {
        // la respuesta no era JSON
    }
    return "Something went wrong. Please try again.";
}

// fetch con el token puesto. Devuelve el JSON (o null si la respuesta es 204).
async function api(path, { method = "GET", body } = {}) {
    if (!Session.isActive()) {
        goToLogin();
        throw new Error("Your session expired. Please log in again.");
    }

    let response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Session.token()}`
            },
            body: body ? JSON.stringify(body) : undefined
        });
    } catch {
        throw new Error("Cannot reach the server. If it was idle, wait a minute and try again.");
    }

    if (response.status === 401) {
        goToLogin();
        throw new Error("Your session expired. Please log in again.");
    }
    if (response.status === 403) {
        throw new Error("You don't have permission to do that.");
    }
    if (!response.ok) {
        throw new Error(await readError(response));
    }
    return response.status === 204 ? null : response.json();
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
}

function showNotice(element, message, kind = "error") {
    const colors = kind === "ok"
        ? "text-green-700 bg-green-100 border-green-200"
        : "text-red-700 bg-red-100 border-red-200";
    element.className = `border rounded-xl p-3 mb-4 ${colors}`;
    element.textContent = message;
}

function clearNotice(element) {
    element.className = "hidden";
    element.textContent = "";
}

// Barra de navegación de las páginas privadas.
function renderNav(active) {
    const link = (href, label, key) => {
        const style = key === active
            ? "bg-blue-500 text-white"
            : "text-blue-500 hover:bg-blue-700 hover:text-white";
        return `<a href="${href}" class="rounded-xl px-4 py-2 transition-colors duration-300 ${style}">${label}</a>`;
    };
    const role = Session.isLibrarian() ? "Librarian" : "Member";

    document.getElementById("nav").innerHTML = `
        <nav class="font-display flex flex-wrap items-center justify-between gap-4 bg-gray-100 shadow-lg
            border border-cyan-50 rounded-xl max-w-6xl mx-auto mt-5 p-4">
            <div class="flex flex-wrap gap-2">
                ${link("books.html", "Books", "books")}
                ${link("authors.html", "Authors", "authors")}
                ${link("categories.html", "Categories", "categories")}
            </div>
            <div class="flex items-center gap-3">
                <span>${escapeHtml(Session.username())}
                    <span class="text-sm text-gray-500">(${role})</span></span>
                <button id="logoutBtn" type="button" class="text-blue-500 border border-blue-300 rounded-xl px-4 py-2
                    cursor-pointer hover:bg-blue-700 hover:text-white transition-colors duration-300">Log out</button>
            </div>
        </nav>`;
    document.getElementById("logoutBtn").addEventListener("click", goToLogin);
}
