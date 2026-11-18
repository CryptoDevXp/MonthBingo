const monthInput = document.getElementById("monthInput");
const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const saveButton = document.getElementById("saveButton");
const monthListElement = document.getElementById("monthList");
const newBoardButton = document.getElementById("newBoardButton");
const printButton = document.getElementById("printButton");
const exportButton = document.getElementById("exportButton");
const importButton = document.getElementById("importButton");
const importFileInput = document.getElementById("importFileInput");
const installButton = document.getElementById("installButton");
const installPrompt = document.getElementById("installPrompt");
const installPromptAction = document.getElementById("installPromptAction");
const installPromptDismiss = document.getElementById("installPromptDismiss");
const languageSelect = document.getElementById("languageSelect");
const monthLabel = document.getElementById("monthLabel");
const serverModeBadge = document.getElementById("serverModeBadge");
const editButton = document.getElementById("editButton");

let deferredInstallPrompt = null;
let installPromptDismissed = false;
let currentLanguage = "de";
let isEditMode = false;

const LANGUAGE_STORAGE_KEY = "month-bingo-language";
const DEFAULT_LANGUAGE = "de";
const translations = {
  de: {
    month: "Monat",
    language: "Sprache",
    new: "Neu",
    save: "Speichern",
    installApp: "App installieren",
    print: "Drucken / PDF",
    exportData: "Exportieren",
    importData: "Importieren",
    exportSuccess: "Boards erfolgreich exportiert.",
    importSuccess: "Boards erfolgreich importiert.",
    importError: "Importdatei ist ungültig oder beschädigt.",
    noImportFile: "Keine Datei zum Import ausgewählt.",
    importReplaceConfirm: "Es gibt {count} bereits vorhandene Board(s). Überschreiben?",
    importCancelled: "Import abgebrochen.",
    serverModeBadge: "Server-Modus aktiv",
    savedBoards: "Gespeicherte Boards",
    monthlyOverview: "Monatsübersicht",
    monthlyPlanner: "Monatsplaner",
    installTitle: "Monatsbingo installieren",
    installDescription: "Speicher die App auf deinem Startbildschirm und nutze sie wie eine normale App.",
    install: "Installieren",
    later: "Später",
    emptyState: "Noch keine Boards.",
    boardDeleteConfirm: "Board für {label} wirklich löschen?",
    boardDeleteSuccess: "Board für {label} gelöscht.",
    boardDeleteSuccessFresh: "Board für {label} gelöscht. Neues Board für {freshLabel} vorbereitet.",
    boardDeleteTitle: "Board für {label} löschen",
    deleteAction: "Löschen",
    deleteFallback: "Server nicht erreichbar. Lokale Löschung wurde übernommen.",
    boardLoadFailure: "Kein Board für {label} gefunden.",
    boardLoaded: "Board für {label} lokal geladen",
    boardLoadedServer: "Board für {label} geladen",
    serverFallback: "Server nicht erreichbar. Lokale Version wird verwendet.",
    serverFallbackMissing: "Server nicht erreichbar. Kein lokales Board für {label} gefunden.",
    selectMonth: "Bitte wähle zuerst einen Monat aus.",
    installBlocked: "Die App kann in diesem Browser nicht installiert werden. Auf Mobilgeräten meist über 'Teilen' > 'Zum Startbildschirm'.",
    installAccepted: "Installationsdialog akzeptiert. Die App wird installiert.",
    installCancelled: "Installation abgebrochen.",
    installFailed: "Die Installation konnte nicht gestartet werden.",
    saveSuccess: "Erfolgreich gespeichert für {label}",
    saveSuccessLocal: "Erfolgreich lokal gespeichert für {label}",
    saveFallback: "Server nicht erreichbar. Lokal gespeichert und fortgesetzt.",
    newBoardLocal: "Neues zusätzliches Board für {label} lokal erstellt",
    newBoardServer: "Neues zusätzliches Board für {label} erstellt",
    newBoardLocalFallback: "Server nicht erreichbar. Neues lokal gespeichertes Board wurde erstellt.",
    appInstalled: "App wurde installiert.",
    loadMonthListError: "Monatsübersicht konnte nicht geladen werden.",
    loadBoardError: "Board konnte nicht geladen werden.",
    boardDeleteError: "Löschen fehlgeschlagen.",
    saveError: "Speichern fehlgeschlagen.",
    createBoardError: "Neues Board konnte nicht erstellt werden.",
    editModeOn: "Bearbeitungsmodus aktiviert.",
    editModeOff: "Bearbeitungsmodus deaktiviert.",
    lockCells: "Zellen sperren",
    unlockCells: "Zellen entsperren",
    edit: "Bearbeiten"
  },
  en: {
    month: "Month",
    language: "Language",
    new: "New",
    save: "Save",
    installApp: "Install app",
    print: "Print / PDF",
    exportData: "Export",
    importData: "Import",
    exportSuccess: "Boards exported successfully.",
    importSuccess: "Boards imported successfully.",
    importError: "The import file is invalid or corrupted.",
    noImportFile: "No file selected for import.",
    importReplaceConfirm: "There are {count} existing board(s). Replace them?",
    importCancelled: "Import cancelled.",
    serverModeBadge: "Server mode active",
    savedBoards: "Saved boards",
    monthlyOverview: "Monthly overview",
    monthlyPlanner: "Monthly planner",
    installTitle: "Install Month Bingo",
    installDescription: "Save the app to your home screen and use it like a regular app.",
    install: "Install",
    later: "Later",
    emptyState: "No boards yet.",
    boardDeleteConfirm: "Delete board for {label}?",
    boardDeleteSuccess: "Board for {label} deleted.",
    boardDeleteSuccessFresh: "Board for {label} deleted. A new board for {freshLabel} is ready.",
    boardDeleteTitle: "Delete board for {label}",
    deleteAction: "Delete",
    deleteFallback: "Server unavailable. Local deletion was applied.",
    boardLoadFailure: "No board found for {label}.",
    boardLoaded: "Board for {label} loaded locally",
    boardLoadedServer: "Board for {label} loaded",
    serverFallback: "Server unavailable. Local version is used.",
    serverFallbackMissing: "Server unavailable. No local board found for {label}.",
    selectMonth: "Please select a month first.",
    installBlocked: "This app cannot be installed in this browser. On mobile devices, use 'Share' > 'Add to Home Screen'.",
    installAccepted: "Install prompt accepted. The app is being installed.",
    installCancelled: "Installation cancelled.",
    installFailed: "The installation could not be started.",
    saveSuccess: "Saved successfully for {label}",
    saveSuccessLocal: "Saved locally successfully for {label}",
    saveFallback: "Server unavailable. Saved locally and continued.",
    newBoardLocal: "New additional board for {label} created locally",
    newBoardServer: "New additional board for {label} created",
    newBoardLocalFallback: "Server unavailable. A new local board was created.",
    appInstalled: "App installed.",
    loadMonthListError: "Could not load the monthly overview.",
    loadBoardError: "Could not load the board.",
    boardDeleteError: "Delete failed.",
    saveError: "Save failed.",
    createBoardError: "Could not create a new board.",
    editModeOn: "Edit mode enabled.",
    editModeOff: "Edit mode disabled.",
    lockCells: "Lock cells",
    unlockCells: "Unlock cells",
    edit: "Edit"
  }
};

const t = (key, replacements = {}) => {
  const dictionary = translations[currentLanguage] ?? translations[DEFAULT_LANGUAGE];
  let text = dictionary[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;

  Object.entries(replacements).forEach(([placeholder, value]) => {
    text = text.replace(new RegExp(`\\{${placeholder}\\}`, "g"), String(value));
  });

  return text;
};

const getLanguageTag = () => (currentLanguage === "en" ? "en-US" : "de-DE");

const isValidLanguage = (value) => value === "de" || value === "en";

const getStoredLanguage = () => {
  try {
    const storedValue = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isValidLanguage(storedValue) ? storedValue : null;
  } catch (error) {
    return null;
  }
};

const getDefaultLanguageFromSettings = (settings) => {
  if (!settings || typeof settings !== "object") {
    return DEFAULT_LANGUAGE;
  }

  return isValidLanguage(settings.defaultLanguage) ? settings.defaultLanguage : DEFAULT_LANGUAGE;
};

const applyLanguage = () => {
  const language = isValidLanguage(currentLanguage) ? currentLanguage : DEFAULT_LANGUAGE;
  currentLanguage = language;
  document.documentElement.lang = language;
  document.title = language === "en" ? "Month Bingo" : "Monatsbingo";

  if (monthLabel) {
    monthLabel.textContent = t("month");
  }

  if (languageSelect) {
    languageSelect.value = currentLanguage;
  }

  if (installPromptAction) {
    installPromptAction.textContent = t("install");
  }

  if (installPromptDismiss) {
    installPromptDismiss.textContent = t("later");
  }

  if (newBoardButton) {
    newBoardButton.textContent = t("new");
  }

  if (saveButton) {
    saveButton.textContent = t("save");
  }

  if (installButton) {
    installButton.textContent = t("installApp");
  }

  if (serverModeBadge) {
    serverModeBadge.textContent = t("serverModeBadge");
    if (!isServerModeUiActive()) {
      serverModeBadge.hidden = true;
    }
  }

  if (exportButton) {
    exportButton.textContent = t("exportData");
  }

  if (importButton) {
    importButton.textContent = t("importData");
  }

  if (printButton) {
    printButton.textContent = t("print");
  }

  if (installPrompt) {
    const title = installPrompt.querySelector("strong");
    const description = installPrompt.querySelector("span");
    if (title) title.textContent = t("installTitle");
    if (description) description.textContent = t("installDescription");
  }

  const overviewHeading = document.querySelector(".sidebar h2");
  if (overviewHeading) {
    overviewHeading.textContent = t("savedBoards");
  }

  const overviewEyebrow = document.querySelector(".sidebar .eyebrow");
  if (overviewEyebrow) {
    overviewEyebrow.textContent = t("monthlyOverview");
  }

  const topbarEyebrow = document.querySelector(".topbar .eyebrow");
  if (topbarEyebrow) {
    topbarEyebrow.textContent = t("monthlyPlanner");
  }

  if (monthListElement && monthListElement.children.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "empty-state";
    emptyMessage.textContent = t("emptyState");
    monthListElement.appendChild(emptyMessage);
  }

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  } catch (error) {
    console.warn("Language preference could not be saved:", error);
  }
};

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

const STORAGE_KEY = "month-bingo-boards-v1";
const defaultCells = () => Array(16).fill("");
const defaultChecked = () => Array(16).fill(false);
let storageMode = "local";
let currentCells = defaultCells();
let currentChecked = defaultChecked();
let currentBoardId = null;
let isEditing = false;

const todayMonth = () => new Date().toISOString().slice(0, 7);

const formatMonthLabel = (monthValue) => {
  if (!monthValue) {
    return "";
  }

  const [year, month] = monthValue.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat(getLanguageTag(), { month: "long", year: "numeric" }).format(date);
};

const setStatus = (message, isError = false) => {
  statusElement.textContent = message;
  statusElement.style.color = isError ? "#a14444" : "#6f6a82";
};

const sameBoardId = (left, right) => String(left) === String(right);

const getLocalBoards = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((board) => board && typeof board.month === "string")
      .map((board) => ({
        ...board,
        id: board.id ?? `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        cells: Array.isArray(board.cells) && board.cells.length === 16 ? board.cells.slice() : defaultCells(),
        checked: normalizeChecked(board.checked)
      }));
  } catch (error) {
    console.warn("Lokaler Speicher konnte nicht gelesen werden:", error);
    return [];
  }
};

const persistLocalBoards = (boards) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
  } catch (error) {
    console.warn("Lokaler Speicher konnte nicht geschrieben werden:", error);
  }
};

const normalizeImportedBoards = (rawBoards) => {
  if (!Array.isArray(rawBoards)) {
    return [];
  }

  return rawBoards
    .map((board) => {
      if (!board || typeof board !== "object" || typeof board.month !== "string") {
        return null;
      }

      const cells = Array.isArray(board.cells) && board.cells.length === 16
        ? board.cells.map((cell) => (typeof cell === "string" ? cell : ""))
        : defaultCells();

      return {
        id: board.id !== undefined && board.id !== null ? String(board.id) : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        month: board.month,
        cells,
        checked: normalizeChecked(board.checked)
      };
    })
    .filter(Boolean);
};

const normalizeBoardSnapshot = (board) => ({
  id: board && board.id !== undefined && board.id !== null ? board.id : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  month: board && typeof board.month === "string" ? board.month : todayMonth(),
  cells: Array.isArray(board && board.cells) && board.cells.length === 16 ? board.cells.slice() : defaultCells(),
  checked: normalizeChecked(board.checked)
});

const syncLocalBackupFromServer = (serverBoards) => {
  if (!Array.isArray(serverBoards)) {
    return;
  }

  const localBoards = getLocalBoards();
  const merged = [...localBoards];

  serverBoards.forEach((board) => {
    const normalizedBoard = normalizeBoardSnapshot(board);
    const existingIndex = merged.findIndex((entry) => sameBoardId(entry.id, normalizedBoard.id));

    if (existingIndex >= 0) {
      merged[existingIndex] = normalizedBoard;
      return;
    }

    merged.push(normalizedBoard);
  });

  persistLocalBoards(merged);
};

const isServerModeActive = (settings) => {
  if (!settings || typeof settings !== "object") {
    return false;
  }

  return settings.serverMode === true || String(settings.serverMode).toLowerCase() === "true";
};

const getStorageModeFromSettings = (settings) => (isServerModeActive(settings) ? "server" : "local");
const isServerModeUiActive = () => storageMode === "server";

async function loadAppSettings() {
  try {
    const response = await fetch("/appsettings.json", { cache: "no-store" });
    if (!response.ok) {
      return { serverMode: false, defaultLanguage: DEFAULT_LANGUAGE };
    }

    return await response.json();
  } catch (error) {
    console.info("No appsettings.json found, using local storage.", error);
    return { serverMode: false, defaultLanguage: DEFAULT_LANGUAGE };
  }
}

async function initializeStorageMode() {
  const settings = await loadAppSettings();
  storageMode = getStorageModeFromSettings(settings);
  const defaultLanguage = getDefaultLanguageFromSettings(settings);
  currentLanguage = getStoredLanguage() || defaultLanguage;
  applyLanguage();

  if (isServerModeUiActive()) {
    installPromptDismissed = true;
    if (installButton) {
      installButton.hidden = true;
    }
    hideInstallPrompt();
  }

  if (serverModeBadge) {
    serverModeBadge.hidden = true;
    serverModeBadge.textContent = t("serverModeBadge");
    if (isServerModeUiActive()) {
      serverModeBadge.hidden = false;
    }
  }
}

const shouldHideInstallUi = () => isServerModeUiActive() || window.matchMedia("(display-mode: standalone)").matches;

const exportBoardData = () => {
  const boards = getLocalBoards();
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    boards
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `month-bingo-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(t("exportSuccess"));
};

const getImportConflictCount = (importedBoards) => {
  const localBoards = getLocalBoards();
  return importedBoards.filter((board) => localBoards.some((entry) => sameBoardId(entry.id, board.id))).length;
};

const importBoardData = async (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    setStatus(t("noImportFile"), true);
    return;
  }

  try {
    const rawText = await file.text();
    const parsed = JSON.parse(rawText);
    const rawBoards = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.boards) ? parsed.boards : null;

    if (!rawBoards) {
      throw new Error("Invalid import payload");
    }

    const importedBoards = normalizeImportedBoards(rawBoards);
    if (!importedBoards.length) {
      throw new Error("No valid boards found");
    }

    const conflictCount = getImportConflictCount(importedBoards);
    if (conflictCount > 0 && !window.confirm(t("importReplaceConfirm", { count: conflictCount }))) {
      setStatus(t("importCancelled"), true);
      return;
    }

    const mergedBoards = [...getLocalBoards()];
    importedBoards.forEach((board) => {
      const existingIndex = mergedBoards.findIndex((entry) => sameBoardId(entry.id, board.id));
      if (existingIndex >= 0) {
        mergedBoards[existingIndex] = board;
        return;
      }
      mergedBoards.push(board);
    });

    persistLocalBoards(mergedBoards);
    setStatus(t("importSuccess"));
    await loadMonthList();
    if (monthInput.value) {
      await loadBoard(monthInput.value);
    }
  } catch (error) {
    console.warn("Import fehlgeschlagen:", error);
    setStatus(t("importError"), true);
  } finally {
    event.target.value = "";
  }
};

const setBoardEditing = (enabled, announce = false) => {
  isEditing = enabled;
  boardElement.querySelectorAll(".cell").forEach((cell) => {
    cell.contentEditable = enabled ? "true" : "false";
    cell.setAttribute("aria-disabled", enabled ? "false" : "true");
    cell.classList.toggle("locked", !enabled);
  });
  boardElement.querySelectorAll(".cell-text").forEach((text) => {
    text.contentEditable = enabled ? "true" : "false";
  });

  if (editButton) {
    editButton.textContent = isEditing ? t("lockCells") : t("edit");
  }

  if (announce) {
    setStatus(enabled ? t("editModeOn") : t("editModeOff"));
  }
};

function renderBoard() {
  boardElement.innerHTML = "";

  currentCells.forEach((value, index) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.contentEditable = isEditing ? "true" : "false";
    cell.setAttribute("aria-disabled", isEditing ? "false" : "true");
    cell.classList.toggle("locked", !isEditing);
    cell.style.background = pastelColors[index % pastelColors.length];

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "cell-checkbox";
    checkbox.checked = currentChecked[index] && value.trim().length > 0;
    checkbox.disabled = value.trim().length === 0;

    const text = document.createElement("span");
    text.className = "cell-text";
    text.contentEditable = isEditing ? "true" : "false";
    text.textContent = value;
    text.classList.toggle("completed", checkbox.checked);

    checkbox.addEventListener("change", () => {
      if (!text.textContent.trim()) {
        checkbox.checked = false;
        return;
      }
      currentChecked[index] = checkbox.checked;
      text.classList.toggle("completed", checkbox.checked);
    });

    const updateCheckboxFromText = () => {
      const nextText = text.textContent.trim();
      currentCells[index] = nextText;
      checkbox.disabled = nextText.length === 0;
      if (!nextText) {
        checkbox.checked = false;
        currentChecked[index] = false;
        text.classList.remove("completed");
      }
    };

    text.addEventListener("input", updateCheckboxFromText);
    text.addEventListener("keyup", updateCheckboxFromText);
    text.addEventListener("blur", updateCheckboxFromText);

    const observer = new MutationObserver(updateCheckboxFromText);
    observer.observe(text, { childList: true, characterData: true, subtree: true });

    text.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        text.blur();
      }
    });

    cell.appendChild(checkbox);
    cell.appendChild(text);
    boardElement.appendChild(cell);
  });

  setBoardEditing(isEditing);
}

async function deleteBoard(boardId, monthId) {
  const label = formatMonthLabel(monthId);
  const confirmed = window.confirm(t("boardDeleteConfirm", { label }));

  if (!confirmed) {
    return;
  }

  try {
    if (storageMode === "local") {
      const boards = getLocalBoards().filter((board) => !sameBoardId(board.id, boardId));
      persistLocalBoards(boards);

      if (sameBoardId(currentBoardId, boardId)) {
        const freshMonth = todayMonth();
        monthInput.value = freshMonth;
        currentBoardId = null;
        currentCells = defaultCells();
        renderBoard();
        setStatus(t("boardDeleteSuccessFresh", { label, freshLabel: formatMonthLabel(freshMonth) }));
      } else {
        setStatus(t("boardDeleteSuccess", { label }));
      }

      await loadMonthList();
      if (monthInput.value === todayMonth()) {
        await loadBoard(monthInput.value);
      }
      return;
    }

    const response = await fetch(`/api/board?id=${encodeURIComponent(boardId)}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || t("boardDeleteError"));
    }

    if (sameBoardId(currentBoardId, boardId)) {
      const freshMonth = todayMonth();
      monthInput.value = freshMonth;
      currentBoardId = null;
      currentCells = defaultCells();
      renderBoard();
      setStatus(t("boardDeleteSuccessFresh", { label, freshLabel: formatMonthLabel(freshMonth) }));
    } else {
      setStatus(t("boardDeleteSuccess", { label }));
    }

    const boards = getLocalBoards().filter((board) => !sameBoardId(board.id, boardId));
    persistLocalBoards(boards);
    await loadMonthList();
    if (monthInput.value === todayMonth()) {
      await loadBoard(monthInput.value);
    }
  } catch (error) {
    console.warn("Server-Löschung fehlgeschlagen, lokale Kopie wird angepasst:", error);
    storageMode = "local";
    const boards = getLocalBoards().filter((board) => !sameBoardId(board.id, boardId));
    persistLocalBoards(boards);
    setStatus(t("deleteFallback"), true);
    await loadMonthList();
  }
}

function updateMonthList(boards) {
  monthListElement.innerHTML = "";

  if (!boards.length) {
    const item = document.createElement("li");
    item.className = "empty-state";
    item.textContent = t("emptyState");
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
    const boardIndex = grouped[board.month].findIndex((entry) => sameBoardId(entry.id, board.id)) + 1;
    button.textContent = boardCount > 1 ? `${formatMonthLabel(board.month)} • Board ${boardIndex}` : formatMonthLabel(board.month);
    if (sameBoardId(board.id, currentBoardId)) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      monthInput.value = board.month;
      loadBoard(board.month, board.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = t("deleteAction");
    deleteButton.title = t("boardDeleteTitle", { label: formatMonthLabel(board.month) });
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
    if (storageMode === "local") {
      const boards = getLocalBoards().sort((a, b) => {
        if (a.month === b.month) {
          return String(a.id).localeCompare(String(b.id));
        }
        return b.month.localeCompare(a.month);
      });

      updateMonthList(boards);
      return;
    }

    const response = await fetch("/api/boards");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || t("loadMonthListError"));
    }

    const boards = Array.isArray(data.boards)
      ? data.boards.filter((board) => board && board.month).sort((a, b) => {
          if (a.month === b.month) {
            return Number(a.id) - Number(b.id);
          }
          return b.month.localeCompare(a.month);
        })
      : [];

    syncLocalBackupFromServer(boards);
    updateMonthList(boards);
  } catch (error) {
    console.warn("Server nicht erreichbar, verwende lokale Daten:", error);
    storageMode = "local";
    const boards = getLocalBoards().sort((a, b) => {
      if (a.month === b.month) {
        return String(a.id).localeCompare(String(b.id));
      }
      return b.month.localeCompare(a.month);
    });
    updateMonthList(boards);
    setStatus(t("serverFallback"), true);
  }
}

async function loadBoard(month, boardId = null) {
  isEditing = false;

  try {
    if (storageMode === "local") {
      const boards = getLocalBoards();
      const board = boardId !== null && boardId !== undefined
        ? boards.find((entry) => sameBoardId(entry.id, boardId))
        : boards.find((entry) => entry.month === month);

      if (!board) {
        currentBoardId = null;
        currentCells = defaultCells();
        currentChecked = defaultChecked();
        renderBoard();
        setStatus(t("boardLoadFailure", { label: formatMonthLabel(month) }));
        await loadMonthList();
        return;
      }

      currentBoardId = board.id;
      currentCells = Array.isArray(board.cells) && board.cells.length === 16 ? board.cells.slice() : defaultCells();
      currentChecked = normalizeChecked(board.checked);

      renderBoard();
      setStatus(t("boardLoaded", { label: formatMonthLabel(month) }));
      await loadMonthList();
      return;
    }

    const query = new URLSearchParams();
    if (boardId !== null && boardId !== undefined) {
      query.set("id", String(boardId));
    } else {
      query.set("month", month);
    }

    const response = await fetch(`/api/board?${query.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || t("loadBoardError"));
    }

    currentBoardId = data.id ?? null;
    currentCells = Array.isArray(data.cells) && data.cells.length === 16 ? data.cells : defaultCells();
    currentChecked = normalizeChecked(data.checked);
    syncLocalBackupFromServer([{ id: currentBoardId, month, cells: currentCells, checked: currentChecked }]);
    renderBoard();
    setStatus(t("boardLoadedServer", { label: formatMonthLabel(month) }));
    await loadMonthList();
  } catch (error) {
    console.warn("Server nicht erreichbar, verwende lokale Board-Version:", error);
    storageMode = "local";
    const boards = getLocalBoards();
    const board = boardId !== null && boardId !== undefined
      ? boards.find((entry) => sameBoardId(entry.id, boardId))
      : boards.find((entry) => entry.month === month);

    if (!board) {
      currentBoardId = null;
      currentCells = defaultCells();
      currentChecked = defaultChecked();
      renderBoard();
      setStatus(t("serverFallbackMissing", { label: formatMonthLabel(month) }), true);
      await loadMonthList();
      return;
    }

    currentBoardId = board.id;
    currentCells = Array.isArray(board.cells) && board.cells.length === 16 ? board.cells.slice() : defaultCells();
    currentChecked = normalizeChecked(board.checked);
    renderBoard();
    setStatus(t("serverFallback"), true);
    await loadMonthList();
  }
}

async function saveBoard() {
  const month = monthInput.value;

  if (!month) {
    setStatus(t("selectMonth"), true);
    return;
  }

  try {
    if (storageMode === "local") {
      const boards = getLocalBoards();
      const existingIndex = currentBoardId === null
        ? -1
        : boards.findIndex((board) => sameBoardId(board.id, currentBoardId));

      const persistedBoard = {
        id: existingIndex >= 0 ? boards[existingIndex].id : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        month,
        cells: currentCells.slice(),
        checked: currentChecked.slice()
      };

      if (existingIndex >= 0) {
        boards[existingIndex] = persistedBoard;
      } else {
        boards.push(persistedBoard);
      }

      persistLocalBoards(boards);
      currentBoardId = persistedBoard.id;
      setBoardEditing(false);
      setStatus(t("saveSuccessLocal", { label: formatMonthLabel(month) }));
      await loadMonthList();
      return;
    }

    const response = await fetch("/api/board", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: currentBoardId, month, cells: currentCells, checked: currentChecked })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || t("saveError"));
    }

    currentBoardId = data.id ?? currentBoardId;
    syncLocalBackupFromServer([{ id: currentBoardId, month, cells: currentCells, checked: currentChecked }]);
    setBoardEditing(false);
    setStatus(t("saveSuccess", { label: formatMonthLabel(month) }));
    await loadMonthList();
  } catch (error) {
    console.warn("Server speichern fehlgeschlagen, lokale Kopie wird angelegt:", error);
    storageMode = "local";

    const boards = getLocalBoards();
    const existingIndex = currentBoardId === null
      ? -1
      : boards.findIndex((board) => sameBoardId(board.id, currentBoardId));

    const persistedBoard = {
      id: existingIndex >= 0 ? boards[existingIndex].id : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      month,
      cells: currentCells.slice(),
      checked: currentChecked.slice()
    };

    if (existingIndex >= 0) {
      boards[existingIndex] = persistedBoard;
    } else {
      boards.push(persistedBoard);
    }

    persistLocalBoards(boards);
    currentBoardId = persistedBoard.id;
    setStatus(t("saveFallback"), true);
    await loadMonthList();
  }
}

async function createNewBoard() {
  const month = monthInput.value || todayMonth();
  monthInput.value = month;

  try {
    if (storageMode === "local") {
      const boards = getLocalBoards();
      const newBoard = {
        id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        month,
        cells: defaultCells(),
        checked: defaultChecked()
      };

      boards.push(newBoard);
      persistLocalBoards(boards);
      currentBoardId = newBoard.id;
      currentCells = newBoard.cells.slice();
      currentChecked = defaultChecked();
      setBoardEditing(true);
      renderBoard();
      setStatus(t("newBoardLocal", { label: formatMonthLabel(month) }));
      await loadMonthList();
      return;
    }

    const response = await fetch("/api/board", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ month, cells: defaultCells(), checked: defaultChecked() })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || t("createBoardError"));
    }

    currentBoardId = data.id ?? null;
    currentCells = Array.isArray(data.cells) && data.cells.length === 16 ? data.cells : defaultCells();
    currentChecked = normalizeChecked(data.checked);
    syncLocalBackupFromServer([{ id: currentBoardId, month, cells: currentCells }]);
    setBoardEditing(true);
    renderBoard();
    setStatus(t("newBoardServer", { label: formatMonthLabel(month) }));
    await loadMonthList();
  } catch (error) {
    console.warn("Server-Board konnte nicht erstellt werden, lokale Kopie wird angelegt:", error);
    storageMode = "local";
    const boards = getLocalBoards();
    const newBoard = {
      id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      month,
      cells: defaultCells(),
      checked: defaultChecked()
    };

    boards.push(newBoard);
    persistLocalBoards(boards);
    currentBoardId = newBoard.id;
    currentCells = newBoard.cells.slice();
    setBoardEditing(true);
    renderBoard();
    setStatus(t("newBoardLocalFallback"), true);
    await loadMonthList();
  }
}

const handleInstallClick = async () => {
  if (!deferredInstallPrompt) {
    setStatus(t("installBlocked"), true);
    return;
  }

  try {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setStatus(t("installAccepted"));
    } else {
      setStatus(t("installCancelled"));
    }

    deferredInstallPrompt = null;
    installButton.hidden = true;
  } catch (error) {
    console.warn("Installation konnte nicht gestartet werden:", error);
    setStatus(t("installFailed"), true);
  }
};

const showInstallPrompt = () => {
  if (!installPrompt || installPromptDismissed || shouldHideInstallUi()) {
    return;
  }

  installPrompt.hidden = false;
  installPrompt.style.display = "flex";
};

const hideInstallPrompt = () => {
  if (!installPrompt) {
    return;
  }

  installPrompt.hidden = true;
  installPrompt.style.display = "none";
};

const enableInstallButton = () => {
  if (!installButton) {
    return;
  }

  if (shouldHideInstallUi()) {
    installButton.hidden = true;
    return;
  }

  installButton.hidden = false;
};

window.addEventListener("beforeinstallprompt", (event) => {
  if (isServerModeUiActive()) {
    event.preventDefault();
    deferredInstallPrompt = null;
    hideInstallPrompt();
    if (installButton) {
      installButton.hidden = true;
    }
    return;
  }

  event.preventDefault();
  deferredInstallPrompt = event;
  enableInstallButton();
  showInstallPrompt();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  if (installButton) {
    installButton.hidden = true;
  }
  hideInstallPrompt();
  setStatus(t("appInstalled"));
});

monthInput.value = todayMonth();
monthInput.addEventListener("change", () => {
  currentBoardId = null;
  loadBoard(monthInput.value);
});
languageSelect?.addEventListener("change", async (event) => {
  currentLanguage = event.target.value === "en" ? "en" : "de";
  applyLanguage();
  await loadMonthList();
  if (monthInput.value) {
    await loadBoard(monthInput.value);
  }
});
saveButton.addEventListener("click", saveBoard);
newBoardButton.addEventListener("click", createNewBoard);
exportButton?.addEventListener("click", exportBoardData);
importButton?.addEventListener("click", () => importFileInput?.click());
importFileInput?.addEventListener("change", importBoardData);
printButton.addEventListener("click", () => window.print());
installButton?.addEventListener("click", handleInstallClick);
installPromptAction?.addEventListener("click", handleInstallClick);
installPromptDismiss?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  installPromptDismissed = true;
  hideInstallPrompt();
});
editButton?.addEventListener("click", () => {
  setBoardEditing(!isEditing, true);
});

(async () => {
  await initializeStorageMode();
  await loadMonthList();
  await loadBoard(monthInput.value);
})();

const normalizeChecked = (checked) => Array.isArray(checked) && checked.length === 16
  ? checked.map((value) => value === true)
  : defaultChecked();
