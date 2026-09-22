const API_BASE_URL = (window.APP_CONFIG?.API_BASE_URL ?? "").replace(/\/+$/, "");

const calculatorForm = document.querySelector("#calculator-form");
const expressionInput = document.querySelector("#expression");
const resultElement = document.querySelector("#result");
const feedbackElement = document.querySelector("#calculator-feedback");
const historyList = document.querySelector("#history-list");
const historyStatus = document.querySelector("#history-status");
const historyCount = document.querySelector("#history-count");
const keys = document.querySelectorAll(".key");

class ApiError extends Error {
  constructor(message) {
    super(message);
    this.name = "ApiError";
  }
}

function setResult(value, state = "idle") {
  resultElement.textContent = value;
  resultElement.dataset.state = state;
}

function setFeedback(message = "", state = "") {
  feedbackElement.textContent = message;
  feedbackElement.dataset.state = state;
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

function renderHistory(records) {
  historyList.replaceChildren();
  historyCount.textContent = `${records.length} 条`;

  if (records.length === 0) {
    historyStatus.hidden = false;
    historyStatus.textContent = "暂无计算历史";
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
    const body = await apiRequest("/api/history");
    renderHistory(body.data);
  } catch (error) {
    historyList.replaceChildren();
    historyCount.textContent = "0 条";
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

calculatorForm.addEventListener("submit", calculate);

keys.forEach((button) => {
  button.addEventListener("click", () => {
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

loadHistory();
