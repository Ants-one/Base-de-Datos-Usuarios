
const authSection = document.querySelector("#auth-section");
const appSection = document.querySelector("#app-section");
const userLabel = document.querySelector("#user-label");
const categoryList = document.querySelector("#category-list");

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "No se pudo completar la operación.");
  }

  return data;
}

function showMessage(elementId, message, isError = true) {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.classList.toggle("success", !isError);
}

function showAuthenticated(user) {
  authSection.hidden = true;
  appSection.hidden = false;
  userLabel.textContent = user.name;
  loadCategories();
}

function showGuest() {
  authSection.hidden = false;
  appSection.hidden = true;
  userLabel.textContent = "";
}

async function loadSession() {
  try {
    const { user } = await request("/api/auth/me");

    if (user) showAuthenticated(user);
    else showGuest();
  } catch {
    showGuest();
  }
}

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const formElement = event.currentTarget;
  const form = new FormData(formElement);

  try {
    const { user } = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(form))
    });

    formElement.reset();
    showMessage("login-message", "");
    showAuthenticated(user);
  } catch (error) {
    showMessage("login-message", error.message);
  }
});

document.querySelector("#register-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const formElement = event.currentTarget;
  const form = new FormData(formElement);

  try {
    const { user } = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(form))
    });

    formElement.reset();
    showMessage("register-message", "");
    showAuthenticated(user);
  } catch (error) {
    showMessage("register-message", error.message);
  }
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  try {
    await request("/api/auth/logout", { method: "POST" });
    showGuest();
  } catch (error) {
    showMessage("category-message", error.message);
  }
});

async function loadCategories() {
  try {
    const result = await request("/api/categories");
    const categories = Array.isArray(result) ? result : result.categories;

    if (!Array.isArray(categories)) {
      throw new Error("La respuesta de categorías no es válida.");
    }

    categoryList.replaceChildren();

    categories.forEach((category) => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      const descriptionCell = document.createElement("td");
      const actionsCell = document.createElement("td");
      const editButton = document.createElement("button");
      const deleteButton = document.createElement("button");

      nameCell.textContent = category.name;
      descriptionCell.textContent = category.description || "Sin descripción";

      editButton.type = "button";
      editButton.className = "small-button";
      editButton.textContent = "Editar";
      editButton.addEventListener("click", () => editCategory(category));

      deleteButton.type = "button";
      deleteButton.className = "small-button danger";
      deleteButton.textContent = "Eliminar";
      deleteButton.addEventListener("click", () => deleteCategory(category.id));

      actionsCell.append(editButton, deleteButton);
      row.append(nameCell, descriptionCell, actionsCell);
      categoryList.append(row);
    });

    document.querySelector("#category-count").textContent =
      `${categories.length} ${categories.length === 1 ? "categoría" : "categorías"}`;

    document.querySelector("#empty-state").hidden = categories.length > 0;
  } catch (error) {
    showMessage("category-message", error.message);
  }
}

function editCategory(category) {
  const form = document.querySelector("#category-form");

  form.elements.id.value = category.id;
  form.elements.name.value = category.name;
  form.elements.description.value = category.description || "";

  document.querySelector("#save-button").textContent = "Guardar cambios";
  document.querySelector("#cancel-edit").hidden = false;

  form.elements.name.focus();
}

function resetCategoryForm() {
  const form = document.querySelector("#category-form");

  form.reset();
  form.elements.id.value = "";

  document.querySelector("#save-button").textContent = "Añadir categoría";
  document.querySelector("#cancel-edit").hidden = true;
}

document.querySelector("#cancel-edit").addEventListener("click", resetCategoryForm);

document.querySelector("#category-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const id = form.elements.id.value;

  const body = {
    name: form.elements.name.value,
    description: form.elements.description.value
  };

  try {
    await request(id ? `/api/categories/${id}` : "/api/categories", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(body)
    });

    resetCategoryForm();
    showMessage("category-message", "Categoría guardada correctamente.", false);
    await loadCategories();
  } catch (error) {
    showMessage("category-message", error.message);
  }
});

async function deleteCategory(id) {
  if (!window.confirm("¿Seguro que deseas eliminar esta categoría?")) return;

  try {
    await request(`/api/categories/${id}`, { method: "DELETE" });
    showMessage("category-message", "Categoría eliminada.", false);
    await loadCategories();
  } catch (error) {
    showMessage("category-message", error.message);
  }
}

loadSession();