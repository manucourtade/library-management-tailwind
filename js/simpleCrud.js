// Pantalla de lista + alta/edición/baja para recursos con un solo campo (autores y categorías).
requireSession();

const page = document.getElementById("page");
const { path, singular, plural } = page.dataset;
renderNav(page.dataset.nav);

const notice = document.getElementById("notice");
const formCard = document.getElementById("formCard");
const formTitle = document.getElementById("formTitle");
const itemForm = document.getElementById("itemForm");
const nameInput = document.getElementById("name");
const saveBtn = document.getElementById("saveBtn");
const rows = document.getElementById("rows");
const table = document.getElementById("table");
const empty = document.getElementById("empty");
const loading = document.getElementById("loading");

const canEdit = Session.isLibrarian();
const state = { items: [], editingId: null };

if (canEdit) {
    document.getElementById("newBtn").classList.remove("hidden");
    document.getElementById("actionsHead").classList.remove("hidden");
} else {
    document.getElementById("readOnly").classList.remove("hidden");
}

async function load() {
    try {
        state.items = await api(path);
        render();
    } catch (error) {
        showNotice(notice, error.message, "error");
    } finally {
        loading.classList.add("hidden");
    }
}

function render() {
    rows.innerHTML = state.items.map((item) => {
        const titles = (item.books || []).map((book) => book.title).join(", ");
        return `
        <tr class="border-b border-gray-200">
            <td class="p-3">${escapeHtml(item.name)}</td>
            <td class="p-3">${escapeHtml(titles || "-")}</td>
            ${canEdit ? `<td class="p-3 whitespace-nowrap">
                <button data-action="edit" data-id="${item.id}" class="text-blue-500 border border-blue-300 rounded-xl px-3 py-1 cursor-pointer hover:bg-blue-700 hover:text-white transition-colors duration-300">Edit</button>
                <button data-action="delete" data-id="${item.id}" class="text-red-600 border border-red-300 rounded-xl px-3 py-1 cursor-pointer hover:bg-red-600 hover:text-white transition-colors duration-300">Delete</button>
            </td>` : ""}
        </tr>`;
    }).join("");

    table.classList.toggle("hidden", state.items.length === 0);
    empty.classList.toggle("hidden", state.items.length > 0);
}

function openForm(item) {
    state.editingId = item ? item.id : null;
    formTitle.textContent = item ? `Edit ${singular}` : `Add ${singular}`;
    nameInput.value = item ? item.name : "";
    formCard.classList.remove("hidden");
    nameInput.focus();
}

function closeForm() {
    state.editingId = null;
    itemForm.reset();
    formCard.classList.add("hidden");
}

itemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearNotice(notice);
    saveBtn.disabled = true;
    try {
        const editing = state.editingId !== null;
        await api(editing ? `${path}/${state.editingId}` : path, {
            method: editing ? "PUT" : "POST",
            body: { name: nameInput.value.trim() }
        });
        closeForm();
        state.items = await api(path);
        render();
        showNotice(notice, editing ? "Updated." : "Created.", "ok");
    } catch (error) {
        showNotice(notice, error.message, "error");
    } finally {
        saveBtn.disabled = false;
    }
});

rows.addEventListener("click", async (e) => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;

    const item = state.items.find((i) => String(i.id) === button.dataset.id);
    if (!item) return;

    if (button.dataset.action === "edit") {
        openForm(item);
    } else if (confirm(`Delete "${item.name}"?`)) {
        clearNotice(notice);
        try {
            await api(`${path}/${item.id}`, { method: "DELETE" });
            state.items = await api(path);
            render();
            showNotice(notice, "Deleted.", "ok");
        } catch (error) {
            showNotice(notice, error.message, "error");
        }
    }
});

document.getElementById("newBtn").addEventListener("click", () => openForm(null));
document.getElementById("cancelBtn").addEventListener("click", closeForm);

load();
