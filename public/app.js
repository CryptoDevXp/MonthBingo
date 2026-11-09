const monthInput = document.getElementById("monthInput");
const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const saveButton = document.getElementById("saveButton");
const monthListElement = document.getElementById("monthList");
const newBoardButton = document.getElementById("newBoardButton");
const printButton = document.getElementById("printButton");

const pastelColors = [
  "#F7D8D8",
  "#FDE7C9",
  "#FCF3C8",
  "#DDEFD8",
  "#D9F0F3",
  "#DDE4FF",
  "#E7D6F8",
  "#F7D9EA",
  "#F7E5D8",
  "#DFF5DC",
  "#DCEBFF",
  "#F7D9D9",
  "#D7F0E2",
  "#F8E4C4",
  "#E5DDFB",
  "#D9EAFD"
];

let currentCells = Array(16).fill("");
let currentBoardId = null;

const todayMonth = () => new Date().toISOString().slice(0, 7);

const formatMonthLabel = (monthValue) => {
  if (!monthValue) {
    return "";
  }

  const [year, month] = monthValue.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(date);
};

const setStatus = (message, isError = false) => {
  statusElement.textContent = message;
  statusElement.style.color = isError ? "#a14444" : "#6f6a82";
};

function renderBoard() {
  boardElement.innerHTML = "";

  currentCells.forEach((value, index) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.contentEditable = true;
    cell.dataset.index = String(index);
    cell.style.background = pastelColors[index % pastelColors.length];
    cell.textContent = value;

    cell.addEventListener("input", () => {
      currentCells[index] = cell.textContent.trim();
    });

    cell.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        cell.blur();
      }
    });

    boardElement.appendChild(cell);
  });
}

async function deleteBoard(boardId, monthId) {
  const label = formatMonthLabel(monthId);
  const confirmed = window.confirm(`Board für ${label} wirklich löschen?`);

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/board?id=${encodeURIComponent(boardId)}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Löschen fehlgeschlagen.");
    }

    if (currentBoardId === boardId) {
      const freshMonth = todayMonth();
      monthInput.value = freshMonth;
      currentBoardId = null;
      currentCells = Array(16).fill("");
      renderBoard();
      setStatus(`Board für ${label} gelöscht. Neues Board für ${formatMonthLabel(freshMonth)} vorbereitet.`);
    } else {
      setStatus(`Board für ${label} gelöscht.`);
    }

    await loadMonthList();
    if (monthInput.value === todayMonth()) {
      await loadBoard(monthInput.value);
    }
  } catch (error) {
    setStatus(error.message || "Löschen fehlgeschlagen.", true);
  }
}

function updateMonthList(boards) {
  monthListElement.innerHTML = "";

  if (!boards.length) {
    const item = document.createElement("li");
    item.className = "empty-state";
    item.textContent = "Noch keine Boards.";
    monthListElement.appendChild(item);
    return;
  }

  const grouped = {};
  boards.forEach((board) => {
    grouped[board.month] = grouped[board.month] || [];
    grouped[board.month].push(board);
  });

  boards.forEach((board) => {
    const listItem = document.createElement("li");
    listItem.className = "month-item";

    const button = document.createElement("button");
    button.type = "button";
    const boardCount = grouped[board.month].length;
    const boardIndex = grouped[board.month].findIndex((entry) => entry.id === board.id) + 1;
    button.textContent = boardCount > 1 ? `${formatMonthLabel(board.month)} • Board ${boardIndex}` : formatMonthLabel(board.month);
    if (board.id === currentBoardId) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      monthInput.value = board.month;
      loadBoard(board.month, board.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Löschen";
    deleteButton.title = `Board für ${formatMonthLabel(board.month)} löschen`;
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteBoard(board.id, board.month);
    });

    listItem.appendChild(button);
    listItem.appendChild(deleteButton);
    monthListElement.appendChild(listItem);
  });
}

async function loadMonthList() {
  try {
    const response = await fetch("/api/boards");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Monatsübersicht konnte nicht geladen werden.");
    }

    const boards = Array.isArray(data.boards)
      ? data.boards.filter((board) => board && board.month).sort((a, b) => {
          if (a.month === b.month) {
            return Number(a.id) - Number(b.id);
          }
          return b.month.localeCompare(a.month);
        })
      : [];

    updateMonthList(boards);
  } catch (error) {
    setStatus(error.message || "Monatsübersicht konnte nicht geladen werden.", true);
  }
}

async function loadBoard(month, boardId = null) {
  try {
    const query = new URLSearchParams();
    if (boardId !== null && boardId !== undefined) {
      query.set("id", String(boardId));
    } else {
      query.set("month", month);
    }

    const response = await fetch(`/api/board?${query.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Board konnte nicht geladen werden.");
    }

    currentBoardId = data.id ?? null;
    currentCells = Array.isArray(data.cells) && data.cells.length === 16 ? data.cells : Array(16).fill("");
    renderBoard();
    setStatus(`Board für ${formatMonthLabel(month)} geladen`);
    await loadMonthList();
  } catch (error) {
    currentBoardId = null;
    currentCells = Array(16).fill("");
    renderBoard();
    setStatus(error.message || "Fehler beim Laden des Boards.", true);
  }
}

async function saveBoard() {
  const month = monthInput.value;

  if (!month) {
    setStatus("Bitte wähle zuerst einen Monat aus.", true);
    return;
  }

  try {
    const response = await fetch("/api/board", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: currentBoardId, month, cells: currentCells })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Speichern fehlgeschlagen.");
    }

    currentBoardId = data.id ?? currentBoardId;
    setStatus(`Erfolgreich gespeichert für ${formatMonthLabel(month)}`);
    await loadMonthList();
  } catch (error) {
    setStatus(error.message || "Speichern fehlgeschlagen.", true);
  }
}

async function createNewBoard() {
  const month = monthInput.value || todayMonth();
  monthInput.value = month;

  try {
    const response = await fetch("/api/board", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ month, cells: Array(16).fill("") })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Neues Board konnte nicht erstellt werden.");
    }

    currentBoardId = data.id ?? null;
    currentCells = Array.isArray(data.cells) && data.cells.length === 16 ? data.cells : Array(16).fill("");
    renderBoard();
    setStatus(`Neues zusätzliches Board für ${formatMonthLabel(month)} erstellt`);
    await loadMonthList();
  } catch (error) {
    setStatus(error.message || "Neues Board konnte nicht erstellt werden.", true);
  }
}

monthInput.value = todayMonth();
monthInput.addEventListener("change", () => {
  currentBoardId = null;
  loadBoard(monthInput.value);
});
saveButton.addEventListener("click", saveBoard);
newBoardButton.addEventListener("click", createNewBoard);
printButton.addEventListener("click", () => window.print());

loadMonthList();
loadBoard(monthInput.value);
