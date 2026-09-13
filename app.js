const models = [
  { id: 1, name: "Albireo 1", image: "assets/albireo-1.png", price: 10000, width: 453 },
  { id: 2, name: "Albireo 2", image: "assets/albireo-2.png", price: 12500, width: 453 },
  { id: 4, name: "Albireo 4", image: "assets/albireo-4.png", price: 12500, width: 452 },
  { id: 9, name: "Albireo 9", image: "assets/albireo-9.png", price: 12500, width: 453 },
  { id: 10, name: "Albireo 10", image: "assets/albireo-10.png", price: 12500, width: 453 },
];

const colors = [
  { id: "milk", name: "Молочный", hex: "#ebe8dc" },
  { id: "sand", name: "Песочный", hex: "#d7c5aa" },
  { id: "blush", name: "Пудровый", hex: "#d7b9b4" },
  { id: "sage", name: "Шалфей", hex: "#aeb9a8" },
  { id: "mist", name: "Серо-голубой", hex: "#a8b7c1" },
];

const state = {
  model: models[0],
  color: colors[0],
  size: 60,
  side: "left",
  roomLoaded: false,
  points: [],
};

const els = {
  stage: document.querySelector("#stage"),
  roomUpload: document.querySelector("#roomUpload"),
  roomImage: document.querySelector("#roomImage"),
  doorPlane: document.querySelector("#doorPlane"),
  doorImage: document.querySelector("#doorImage"),
  doorTint: document.querySelector("#doorTint"),
  handles: document.querySelector("#handles"),
  modelList: document.querySelector("#modelList"),
  colorList: document.querySelector("#colorList"),
  colorName: document.querySelector("#colorName"),
  totalPrice: document.querySelector("#totalPrice"),
  quoteSummary: document.querySelector("#quoteSummary"),
  uploadLabel: document.querySelector("#uploadLabel"),
  resetCorners: document.querySelector("#resetCorners"),
  bookingDialog: document.querySelector("#bookingDialog"),
  bookingForm: document.querySelector("#bookingForm"),
  bookingChoice: document.querySelector("#bookingChoice"),
  openBooking: document.querySelector("#openBooking"),
  successToast: document.querySelector("#successToast"),
};

function money(value) {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

function renderModels() {
  els.modelList.innerHTML = models.map(model => `
    <button class="model-card ${model.id === state.model.id ? "selected" : ""}" type="button"
      role="radio" aria-checked="${model.id === state.model.id}" data-model="${model.id}">
      <img src="${model.image}" alt="${model.name}" />
      <span>${model.name.replace("Albireo ", "A ")}</span>
    </button>`).join("");

  els.modelList.querySelectorAll("[data-model]").forEach(button => {
    button.addEventListener("click", () => {
      state.model = models.find(model => model.id === Number(button.dataset.model));
      renderModels();
      updateDoor();
      updateQuote();
    });
  });
}

function renderColors() {
  els.colorList.innerHTML = colors.map(color => `
    <button class="color-chip ${color.id === state.color.id ? "selected" : ""}" type="button"
      role="radio" aria-checked="${color.id === state.color.id}" data-color="${color.id}"
      style="background:${color.hex}" aria-label="${color.name}" title="${color.name}"></button>`).join("");

  els.colorList.querySelectorAll("[data-color]").forEach(button => {
    button.addEventListener("click", () => {
      state.color = colors.find(color => color.id === button.dataset.color);
      renderColors();
      updateDoor();
      updateQuote();
    });
  });
}

function updateDoor() {
  els.doorImage.src = state.model.image;
  els.doorImage.alt = state.model.name;
  els.doorPlane.style.width = state.model.width + "px";
  els.doorTint.style.background = state.color.hex;
  els.colorName.textContent = state.color.name;
  els.doorPlane.classList.toggle("right-handle", state.side === "right");
  if (state.roomLoaded) applyPerspective();
}

function updateQuote() {
  els.totalPrice.textContent = money(state.model.price);
  els.quoteSummary.textContent = `${state.model.name} · ${state.size} см · ${state.color.name.toLowerCase()}`;
  els.bookingChoice.textContent = `${state.model.name}, ${state.size} см, ${state.color.name.toLowerCase()} — ${money(state.model.price)}`;
}

function resetPoints() {
  const w = els.stage.clientWidth;
  const h = els.stage.clientHeight;
  const doorH = h * .79;
  const doorW = doorH * (state.model.width / 1024);
  const cx = w / 2;
  const top = (h - doorH) / 2;
  state.points = [
    { x: cx - doorW / 2, y: top },
    { x: cx + doorW / 2, y: top + 2 },
    { x: cx + doorW / 2 + 4, y: top + doorH },
    { x: cx - doorW / 2 - 4, y: top + doorH },
  ];
  renderHandles();
  applyPerspective();
}

function renderHandles() {
  els.handles.innerHTML = "";
  state.points.forEach((point, index) => {
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "corner-handle";
    handle.setAttribute("aria-label", `Угол ${index + 1}`);
    handle.style.left = point.x + "px";
    handle.style.top = point.y + "px";
    handle.addEventListener("pointerdown", event => startDrag(event, index));
    els.handles.appendChild(handle);
  });
}

function startDrag(event, index) {
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  const move = moveEvent => {
    const rect = els.stage.getBoundingClientRect();
    state.points[index] = {
      x: Math.max(0, Math.min(rect.width, moveEvent.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, moveEvent.clientY - rect.top)),
    };
    renderHandlePositions();
    applyPerspective();
  };
  const up = () => {
    event.currentTarget.removeEventListener("pointermove", move);
    event.currentTarget.removeEventListener("pointerup", up);
    event.currentTarget.removeEventListener("pointercancel", up);
  };
  event.currentTarget.addEventListener("pointermove", move);
  event.currentTarget.addEventListener("pointerup", up);
  event.currentTarget.addEventListener("pointercancel", up);
}

function renderHandlePositions() {
  [...els.handles.children].forEach((handle, index) => {
    handle.style.left = state.points[index].x + "px";
    handle.style.top = state.points[index].y + "px";
  });
}

function solveLinear(matrix, values) {
  const n = values.length;
  const a = matrix.map((row, i) => [...row, values[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    [a[col], a[pivot]] = [a[pivot], a[col]];
    if (Math.abs(a[col][col]) < 1e-10) return null;
    const divisor = a[col][col];
    for (let j = col; j <= n; j++) a[col][j] /= divisor;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = a[row][col];
      for (let j = col; j <= n; j++) a[row][j] -= factor * a[col][j];
    }
  }
  return a.map(row => row[n]);
}

function homography(width, height, points) {
  const source = [[0,0], [width,0], [width,height], [0,height]];
  const matrix = [];
  const values = [];
  source.forEach(([x, y], index) => {
    const { x: X, y: Y } = points[index];
    matrix.push([x, y, 1, 0, 0, 0, -X*x, -X*y]); values.push(X);
    matrix.push([0, 0, 0, x, y, 1, -Y*x, -Y*y]); values.push(Y);
  });
  return solveLinear(matrix, values);
}

function applyPerspective() {
  if (state.points.length !== 4) return;
  const h = homography(state.model.width, 1024, state.points);
  if (!h) return;
  const [a,b,c,d,e,f,g,i] = h;
  els.doorPlane.style.transform = `matrix3d(${a},${d},0,${g},${b},${e},0,${i},0,0,1,0,${c},${f},0,1)`;
}

els.roomUpload.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => {
    els.roomImage.onload = () => {
      state.roomLoaded = true;
      els.stage.classList.add("has-room");
      els.uploadLabel.textContent = "Заменить фотографию";
      els.resetCorners.disabled = false;
      resetPoints();
    };
    els.roomImage.src = reader.result;
  };
  reader.readAsDataURL(file);
});

document.querySelectorAll("[data-size]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-size]").forEach(item => {
      item.classList.toggle("selected", item === button);
      item.setAttribute("aria-checked", String(item === button));
    });
    state.size = Number(button.dataset.size);
    updateQuote();
  });
});

document.querySelectorAll("[data-side]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-side]").forEach(item => {
      item.classList.toggle("selected", item === button);
      item.setAttribute("aria-checked", String(item === button));
    });
    state.side = button.dataset.side;
    updateDoor();
  });
});

els.resetCorners.addEventListener("click", resetPoints);
els.openBooking.addEventListener("click", () => {
  updateQuote();
  els.bookingDialog.showModal();
});

els.bookingForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(els.bookingForm));
  const request = {
    ...data,
    model: state.model.name,
    size: state.size,
    color: state.color.name,
    price: state.model.price,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem("albireo-demo-request", JSON.stringify(request));
  els.bookingDialog.close();
  els.successToast.classList.add("show");
  setTimeout(() => els.successToast.classList.remove("show"), 4200);
  els.bookingForm.reset();
});

window.addEventListener("resize", () => {
  if (state.roomLoaded) resetPoints();
});

function registerWebMCP() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const register = tool => Promise.resolve(context.registerTool(tool)).catch(() => {});
  register({
    name: "configure_door",
    title: "Настроить дверь",
    description: "Выбирает модель Albireo, ширину полотна, пастельный цвет и сторону ручки в видимом конфигураторе.",
    inputSchema: {
      type: "object",
      properties: {
        modelId: { type: "integer", enum: [1,2,4,9,10] },
        size: { type: "integer", enum: [60,80] },
        colorId: { type: "string", enum: colors.map(color => color.id) },
        handleSide: { type: "string", enum: ["left","right"] },
      },
      required: ["modelId","size","colorId","handleSide"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const model = models.find(item => item.id === input.modelId);
      const color = colors.find(item => item.id === input.colorId);
      if (!model || !color || ![60,80].includes(input.size) || !["left","right"].includes(input.handleSide)) throw new Error("Некорректная конфигурация");
      state.model = model; state.color = color; state.size = input.size; state.side = input.handleSide;
      renderModels(); renderColors(); updateDoor(); updateQuote();
      document.querySelector(`[data-size="${state.size}"]`)?.click();
      document.querySelector(`[data-side="${state.side}"]`)?.click();
      return { model: model.name, size: state.size, color: color.name, handleSide: state.side, price: model.price };
    },
  });
  register({
    name: "read_current_quote",
    title: "Получить расчёт",
    description: "Возвращает текущую тестовую комплектацию и предварительную стоимость без изменения страницы.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute() {
      return { model: state.model.name, size: state.size, color: state.color.name, price: state.model.price, currency: "RUB" };
    },
  });
}

renderModels();
renderColors();
updateDoor();
updateQuote();
registerWebMCP();

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(() => {}));
