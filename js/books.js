requireSession();
renderNav("books");

const notice = document.getElementById("notice");
const formCard = document.getElementById("formCard");
const formTitle = document.getElementById("formTitle");
const bookForm = document.getElementById("bookForm");
const saveBtn = document.getElementById("saveBtn");
const rows = document.getElementById("rows");
const table = document.getElementById("table");
const empty = document.getElementById("empty");
const loading = document.getElementById("loading");
const search = document.getElementById("search");

const canEdit = Session.isLibrarian();
const state = { books: [], authors: [], categories: [], editingId: null };

if (canEdit) {
    document.getElementById("newBtn").classList.remove("hidden");
    document.getElementById("actionsHead").classList.remove("hidden");
} else {
    document.getElementById("readOnly").classList.remove("hidden");
}

async function loadAll() {
    try {
        const [books, authors, categories] = await Promise.all([
            api("/books"), api("/authors"), api("/categories")
        ]);
        state.books = books;
        state.authors = authors;
        state.categories = categories;
        fillSelects();
        renderRows();
    } catch (error) {
        showNotice(notice, error.message, "error");
    } finally {
        loading.classList.add("hidden");
    }
}

async function reloadBooks() {
    state.books = await api("/books");
    renderRows();
}

function fillSelects() {
    document.getElementById("category").innerHTML =
        `<option value="">No category</option>` +
        state.categories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
    document.getElementById("authors").innerHTML =
        state.authors.map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join("");
}

function renderRows() {
    const term = search.value.trim().toLowerCase();
    const visible = state.books.filter((book) =>
        [book.title, book.isbn, ...(book.authorNames || [])]
            .some((text) => String(text || "").toLowerCase().includes(term)));

    rows.innerHTML = visible.map((book) => `
        <tr class="border-b border-gray-200">
            <td class="p-3">${escapeHtml(book.title)}</td>
            <td class="p-3">${escapeHtml(book.isbn)}</td>
            <td class="p-3">${escapeHtml(book.stock)}</td>
            <td class="p-3">${escapeHtml(book.categoryName || "-")}</td>
            <td class="p-3">${escapeHtml((book.authorNames || []).join(", ") || "-")}</td>
            ${canEdit ? `<td class="p-3 whitespace-nowrap">
                <button data-action="edit" data-id="${book.id}" class="text-blue-500 border border-blue-300 rounded-xl px-3 py-1 cursor-pointer hover:bg-blue-700 hover:text-white transition-colors duration-300">Edit</button>
                <button data-action="delete" data-id="${book.id}" class="text-red-600 border border-red-300 rounded-xl px-3 py-1 cursor-pointer hover:bg-red-600 hover:text-white transition-colors duration-300">Delete</button>
            </td>` : ""}
        </tr>`).join("");

    table.classList.toggle("hidden", visible.length === 0);
    empty.classList.toggle("hidden", visible.length > 0);
}

function openForm(book) {
    state.editingId = book ? book.id : null;
    formTitle.textContent = book ? "Edit book" : "Add book";
    document.getElementById("title").value = book ? book.title : "";
    document.getElementById("isbn").value = book ? book.isbn : "";
    document.getElementById("stock").value = book ? book.stock : 1;
    document.getElementById("category").value = book && book.categoryId ? book.categoryId : "";
    const selected = new Set((book ? book.authorIds : []).map(String));
    for (const option of document.getElementById("authors").options) {
        option.selected = selected.has(option.value);
    }
    formCard.classList.remove("hidden");
    formCard.scrollIntoView({ behavior: "smooth" });
}

function closeForm() {
    state.editingId = null;
    bookForm.reset();
    formCard.classList.add("hidden");
}

bookForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearNotice(notice);

    const category = document.getElementById("category").value;
    const body = {
        title: document.getElementById("title").value.trim(),
        isbn: document.getElementById("isbn").value.trim(),
        stock: Number(document.getElementById("stock").value),
        categoryId: category ? Number(category) : null,
        authorIds: [...document.getElementById("authors").selectedOptions].map((o) => Number(o.value))
    };

    saveBtn.disabled = true;
    try {
        const editing = state.editingId !== null;
        await api(editing ? `/books/${state.editingId}` : "/books", {
            method: editing ? "PUT" : "POST",
            body
        });
        closeForm();
        await reloadBooks();
        showNotice(notice, editing ? "Book updated." : "Book created.", "ok");
    } catch (error) {
        showNotice(notice, error.message, "error");
    } finally {
        saveBtn.disabled = false;
    }
});

rows.addEventListener("click", async (e) => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;

    const book = state.books.find((b) => String(b.id) === button.dataset.id);
    if (!book) return;

    if (button.dataset.action === "edit") {
        openForm(book);
    } else if (confirm(`Delete "${book.title}"?`)) {
        clearNotice(notice);
        try {
            await api(`/books/${book.id}`, { method: "DELETE" });
            await reloadBooks();
            showNotice(notice, "Book deleted.", "ok");
        } catch (error) {
            showNotice(notice, error.message, "error");
        }
    }
});

document.getElementById("newBtn").addEventListener("click", () => openForm(null));
document.getElementById("cancelBtn").addEventListener("click", closeForm);
search.addEventListener("input", renderRows);

loadAll();
