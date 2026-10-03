const API_BASE_URL = (window.APP_CONFIG?.API_BASE_URL ?? "").replace(/\/+$/, "");
const PAGE_SIZE = 10;

const calculatorForm = document.querySelector("#calculator-form");
const expressionInput = document.querySelector("#expression");
const resultElement = document.querySelector("#result");
const feedbackElement = document.querySelector("#calculator-feedback");
const historyList = document.querySelector("#history-list");
const historyStatus = document.querySelector("#history-status");
const historyCount = document.querySelector("#history-count");
const keys = document.querySelectorAll(".key");
const modeTabs = document.querySelectorAll(".mode-tab");
const modePanels = document.querySelectorAll(".mode-panel");
const themeToggle = document.querySelector("#theme-toggle");
const baseConversionForm = document.querySelector("#base-conversion-form");
const baseValueInput = document.querySelector("#base-value");
const fromBaseSelect = document.querySelector("#from-base");
const toBaseSelect = document.querySelector("#to-base");
const baseResultElement = document.querySelector("#base-result");
const baseFeedbackElement = document.querySelector("#base-feedback");
const historySearchForm = document.querySelector("#history-search-form");
const historySearchInput = document.querySelector("#history-search");
const historyPrevButton = document.querySelector("#history-prev");
const historyNextButton = document.querySelector("#history-next");
const historyPageLabel = document.querySelector("#history-page");

const historyState = {
  page: 1,
  totalPages: 1,
  query: "",
};

class ApiError extends Error {
  constructor(message) {
    super(message);
    this.name = "ApiError";
  }
}

function applyTheme(theme) {
  const normalizedTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = normalizedTheme;
  themeToggle.textContent = normalizedTheme === "light" ? "深色模式" : "浅色模式";
  themeToggle.setAttribute(
    "aria-pressed",
    normalizedTheme === "light" ? "true" : "false",
  );
  localStorage.setItem("calculator-theme", normalizedTheme);
}

function initializeTheme() {
  const savedTheme = localStorage.getItem("calculator-theme");
  applyTheme(savedTheme ?? "dark");
}

function setMode(mode) {
  modeTabs.forEach((tab) => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
  modePanels.forEach((panel) => {
    panel.hidden = panel.dataset.modePanel !== mode;
  });
}

function animateKey(button) {
  button.classList.remove("is-pressed");
  void button.offsetWidth;
  button.classList.add("is-pressed");
  window.setTimeout(() => button.classList.remove("is-pressed"), 180);
}

function setOutput(element, value, state = "idle") {
  element.textContent = value;
  element.dataset.state = state;
}

function setElementFeedback(element, message = "", state = "") {
  element.textContent = message;
  element.dataset.state = state;
}

function setResult(value, state = "idle") {
  setOutput(resultElement, value, state);
}

function setFeedback(message = "", state = "") {
  setElementFeedback(feedbackElement, message, state);
}

async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("无法连接后端，请确认服务已经启动");
  }

  if (response.status === 204) {
    return null;
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(`后端返回异常状态：${response.status}`);
    }
  }

  if (!response.ok) {
    throw new ApiError(body?.message ?? `请求失败：${response.status}`);
  }

  return body;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

function createHistoryItem(record) {
  const listItem = document.createElement("li");
  listItem.className = "history-item";

  const main = document.createElement("div");
  main.className = "history-item-main";

  const expression = document.createElement("p");
  expression.className = "history-expression";
  expression.textContent = record.expression;

  const result = document.createElement("p");
  result.className = "history-result";
  result.textContent = `= ${String(record.result)}`;

  const meta = document.createElement("time");
  meta.className = "history-time";
  meta.dateTime = record.createdAt;
  meta.textContent = formatDateTime(record.createdAt);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "删除";
  deleteButton.setAttribute(
    "aria-label",
    `删除计算记录：${record.expression} = ${record.result}`,
  );
  deleteButton.addEventListener("click", () => {
    deleteHistory(record.id, deleteButton);
  });

  main.append(expression, result, meta);
  listItem.append(main, deleteButton);
  return listItem;
}

function renderHistory(records, pagination) {
  historyList.replaceChildren();
  historyCount.textContent = `${pagination.total} 条`;
  historyPageLabel.textContent =
    `第 ${pagination.page} / ${pagination.totalPages} 页`;
  historyPrevButton.disabled = pagination.page <= 1;
  historyNextButton.disabled = pagination.page >= pagination.totalPages;

  if (records.length === 0) {
    historyStatus.hidden = false;
    historyStatus.textContent = historyState.query
      ? "没有找到匹配的历史记录"
      : "暂无计算历史";
    return;
  }

  historyStatus.hidden = true;
  records.forEach((record) => {
    historyList.append(createHistoryItem(record));
  });
}

async function loadHistory() {
  historyStatus.hidden = false;
  historyStatus.textContent = "正在读取历史记录…";

  try {
    const parameters = new URLSearchParams({
      page: String(historyState.page),
      pageSize: String(PAGE_SIZE),
    });
    if (historyState.query) {
      parameters.set("q", historyState.query);
    }

    const body = await apiRequest(`/api/history?${parameters.toString()}`);
    historyState.totalPages = body.pagination.totalPages;
    renderHistory(body.data, body.pagination);
  } catch (error) {
    historyList.replaceChildren();
    historyCount.textContent = "0 条";
    historyPageLabel.textContent = "第 1 / 1 页";
    historyPrevButton.disabled = true;
    historyNextButton.disabled = true;
    historyStatus.hidden = false;
    historyStatus.textContent =
      error instanceof ApiError ? error.message : "历史记录读取失败";
  }
}

async function deleteHistory(recordId, button) {
  button.disabled = true;
  setFeedback("正在删除历史记录…");

  try {
    await apiRequest(`/api/history/${recordId}`, { method: "DELETE" });
    setFeedback("历史记录已删除", "success");
    if (historyList.children.length === 1 && historyState.page > 1) {
      historyState.page -= 1;
    }
    await loadHistory();
  } catch (error) {
    setFeedback(
      error instanceof ApiError ? error.message : "删除失败，请稍后重试",
      "error",
    );
    button.disabled = false;
  }
}

async function calculate(event) {
  event.preventDefault();

  const expression = expressionInput.value.trim();
  if (!expression) {
    setFeedback("请输入要计算的表达式", "error");
    expressionInput.focus();
    return;
  }

  const submitButton = calculatorForm.querySelector('[type="submit"]');
  calculatorForm.setAttribute("aria-busy", "true");
  submitButton.disabled = true;
  setResult("计算中…", "loading");
  setFeedback();

  try {
    const body = await apiRequest("/api/calculations", {
      method: "POST",
      body: JSON.stringify({ expression }),
    });

    setResult(String(body.data.result), "success");
    setFeedback("计算完成，记录已保存", "success");
    historyState.page = 1;
    await loadHistory();
  } catch (error) {
    setResult("计算失败", "error");
    setFeedback(
      error instanceof ApiError ? error.message : "计算失败，请稍后重试",
      "error",
    );
  } finally {
    calculatorForm.removeAttribute("aria-busy");
    submitButton.disabled = false;
  }
}

function insertValue(value) {
  const start = expressionInput.selectionStart ?? expressionInput.value.length;
  const end = expressionInput.selectionEnd ?? expressionInput.value.length;
  expressionInput.value =
    expressionInput.value.slice(0, start) + value + expressionInput.value.slice(end);

  const nextPosition = start + value.length;
  expressionInput.focus();
  expressionInput.setSelectionRange(nextPosition, nextPosition);
}

function runKeyAction(button) {
  const action = button.dataset.action;

  if (action === "clear") {
    expressionInput.value = "";
    setResult("—");
    setFeedback();
    expressionInput.focus();
    return;
  }

  if (action === "backspace") {
    const start = expressionInput.selectionStart ?? expressionInput.value.length;
    const end = expressionInput.selectionEnd ?? expressionInput.value.length;

    if (start !== end) {
      expressionInput.value =
        expressionInput.value.slice(0, start) + expressionInput.value.slice(end);
    } else if (start > 0) {
      expressionInput.value =
        expressionInput.value.slice(0, start - 1) +
        expressionInput.value.slice(start);
    }

    const nextPosition = start === end ? Math.max(0, start - 1) : start;
    expressionInput.focus();
    expressionInput.setSelectionRange(nextPosition, nextPosition);
    return;
  }

  if (action === "value") {
    insertValue(button.dataset.value ?? "");
  }
}

async function handleBaseConversion(event) {
  event.preventDefault();

  const value = baseValueInput.value.trim();
  const submitButton = baseConversionForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  setOutput(baseResultElement, "转换中…", "loading");
  setElementFeedback(baseFeedbackElement);

  try {
    const body = await apiRequest("/api/conversions/base", {
      method: "POST",
      body: JSON.stringify({
        value,
        fromBase: Number(fromBaseSelect.value),
        toBase: Number(toBaseSelect.value),
      }),
    });
    setOutput(baseResultElement, String(body.data.result), "success");
    setElementFeedback(baseFeedbackElement, "转换完成，记录已保存", "success");
    historyState.page = 1;
    await loadHistory();
  } catch (error) {
    setOutput(baseResultElement, "转换失败", "error");
    setElementFeedback(
      baseFeedbackElement,
      error instanceof ApiError ? error.message : "转换失败，请稍后重试",
      "error",
    );
  } finally {
    submitButton.disabled = false;
  }
}

calculatorForm.addEventListener("submit", calculate);
baseConversionForm.addEventListener("submit", handleBaseConversion);

keys.forEach((button) => {
  button.addEventListener("click", () => {
    animateKey(button);
    if (button.type !== "submit") {
      runKeyAction(button);
    }
  });
});

expressionInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    expressionInput.value = "";
    setResult("—");
    setFeedback();
  }
});

modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setMode(tab.dataset.mode);
  });
});

themeToggle.addEventListener("click", () => {
  const nextTheme =
    document.documentElement.dataset.theme === "light" ? "dark" : "light";
  applyTheme(nextTheme);
});

historySearchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  historyState.query = historySearchInput.value.trim();
  historyState.page = 1;
  loadHistory();
});

historyPrevButton.addEventListener("click", () => {
  if (historyState.page > 1) {
    historyState.page -= 1;
    loadHistory();
  }
});

historyNextButton.addEventListener("click", () => {
  if (historyState.page < historyState.totalPages) {
    historyState.page += 1;
    loadHistory();
  }
});

initializeTheme();
setMode("calculator");
loadHistory();
