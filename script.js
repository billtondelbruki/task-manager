// ---------- APP STATE ----------
let tasks = [];            // each task: { id, text, completed }
let currentFilter = "all";   // "all", "active", "completed"

// DOM references
const taskListEl = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addTaskBtn");
const filterBtns = document.querySelectorAll(".filter-btn");
const taskCounterSpan = document.getElementById("taskCounter");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const emptyStateContainer = document.getElementById("emptyStateContainer");

// ---------- PERSISTENCE (localStorage BONUS) ----------
function saveToLocalStorage() {
  localStorage.setItem("taskflow_app_tasks", JSON.stringify(tasks));
}

function loadFromLocalStorage() {
  const stored = localStorage.getItem("taskflow_app_tasks");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      tasks = parsed.map(t => ({ id: t.id, text: t.text, completed: !!t.completed }));
    } catch(e) {
      tasks = [];
    }
  } else {
    // seed with demo examples for better first look
    tasks = [
      { id: Date.now() + 101, text: " Learn DOM manipulation", completed: false },
      { id: Date.now() + 102, text: " Style completed tasks (line-through)", completed: true },
      { id: Date.now() + 103, text: " Implement localStorage persistence", completed: false }
    ];
  }
}

// update counter (active / total)
function updateTaskCounter() {
  const total = tasks.length;
  const activeCount = tasks.filter(t => !t.completed).length;
  if (total === 0) {
    taskCounterSpan.textContent = " No tasks yet";
  } else {
    taskCounterSpan.textContent = `${activeCount} active · ${total} total`;
  }
}

// show/hide empty state message (based on visible tasks count)
function renderEmptyStateMessage(visibleCount) {
  if (visibleCount === 0) {
    let emptyMessage = "";
    if (currentFilter === "all") emptyMessage = "No tasks for today!";
 else if (currentFilter === "active") emptyMessage = "No active tasks — great focus! ";
    else emptyMessage = "No completed tasks yet.";
    
    emptyStateContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p>${emptyMessage}</p>
        <small>Add a new task using the field above </small>
      </div>
    `;
    emptyStateContainer.style.display = "block";
  } else {
    emptyStateContainer.innerHTML = "";
    emptyStateContainer.style.display = "none";
  }
}

// ---------- RENDER FUNCTION (using createElement & appendChild) ----------
function renderTasks() {
  // 1. filter tasks based on currentFilter value
  let filteredTasks = [];
  if (currentFilter === "all") {
    filteredTasks = [...tasks];
  } else if (currentFilter === "active") {
    filteredTasks = tasks.filter(t => !t.completed);
  } else { // completed
    filteredTasks = tasks.filter(t => t.completed);
  }
  
  // 2. clear list without using innerHTML on the UL (safe for listeners)
  taskListEl.innerHTML = "";
  
  // 3. handle empty state
  if (filteredTasks.length === 0) {
    renderEmptyStateMessage(0);
    updateTaskCounter();
    return;
  }
  renderEmptyStateMessage(filteredTasks.length);
  
  // 4. loop through and dynamically create each task node
  filteredTasks.forEach(task => {
    // create main <li> element
    const li = document.createElement("li");
    li.className = "task-item";
    if (task.completed) li.classList.add("completed");
    li.setAttribute("data-task-id", task.id);
    
    // left container: checkbox + text (click to toggle)
    const leftDiv = document.createElement("div");
    leftDiv.className = "task-left";
    
    // checkbox input
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    // event listener for toggling (update)
    checkbox.addEventListener("change", (e) => {
      e.stopPropagation();
      toggleTaskCompletion(task.id);
    });
    
    // task text span
    const textSpan = document.createElement("span");
    textSpan.className = "task-text";
    textSpan.textContent = task.text;
    
    leftDiv.appendChild(checkbox);
    leftDiv.appendChild(textSpan);
    
    // clicking on left div also toggles completion (good UX)
    leftDiv.addEventListener("click", (e) => {
      // avoid double toggle if checkbox was directly clicked
      if (e.target !== checkbox) {
        toggleTaskCompletion(task.id);
      }
    });
    
    // delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "✕";
    deleteBtn.setAttribute("aria-label", "Delete task");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteTaskById(task.id);
    });
    
    li.appendChild(leftDiv);
    li.appendChild(deleteBtn);
    taskListEl.appendChild(li);
  });
  
  updateTaskCounter();
}

// ---------- CORE FUNCTIONALITY ----------
// Toggle task completed status (Update)
function toggleTaskCompletion(taskId) {
  const taskIndex = tasks.findIndex(t => t.id == taskId);
  if (taskIndex !== -1) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    saveToLocalStorage();
    renderTasks();   // re-render based on current filter
  }
}

// Delete task (Delete)
function deleteTaskById(taskId) {
  tasks = tasks.filter(t => t.id != taskId);
  saveToLocalStorage();
  renderTasks();
}

// Add new task (Create)
function addNewTask() {
  const newTaskText = taskInput.value.trim();
  if (newTaskText === "") {
    // subtle visual feedback
    taskInput.style.borderColor = "#e53e3e";
    setTimeout(() => { taskInput.style.borderColor = "#e2edf2"; }, 600);
    return;
  }
  
  const newTask = {
    id: Date.now(),
    text: newTaskText,
    completed: false
  };
  tasks.push(newTask);
  saveToLocalStorage();
  taskInput.value = "";
  taskInput.focus();
  // Stay on the same filter but user expects to see it if filter is 'all' or 'active'
  // Re-render will respect currentFilter
  renderTasks();
}

// Clear all completed tasks
function clearCompletedTasks() {
  const hasCompleted = tasks.some(t => t.completed);
  if (!hasCompleted) return;
  tasks = tasks.filter(t => !t.completed);
  saveToLocalStorage();
  renderTasks();
}

// Filter management
function setActiveFilter(filterType) {
  currentFilter = filterType;
  // update active class on filter buttons
  filterBtns.forEach(btn => {
    const btnFilter = btn.getAttribute("data-filter");
    if (btnFilter === currentFilter) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  renderTasks();
}

// ---------- EVENT LISTENERS ----------
function bindEvents() {
  // Add task button
  addBtn.addEventListener("click", addNewTask);
  
  // Enter key on input field
  taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addNewTask();
    }
  });
  
  // Filter buttons (All, Active, Completed)
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const filterValue = btn.getAttribute("data-filter");
      if (filterValue === "all") setActiveFilter("all");
      else if (filterValue === "active") setActiveFilter("active");
      else if (filterValue === "completed") setActiveFilter("completed");
    });
  });
  
  // Clear completed button
  clearCompletedBtn.addEventListener("click", clearCompletedTasks);
}

// ---------- INITIALIZE APP ----------
function init() {
  loadFromLocalStorage();    // load tasks from localStorage (or defaults)
  bindEvents();              // attach event listeners
  // set initial filter to "all" and sync button styling
  currentFilter = "all";
  filterBtns.forEach(btn => {
    if (btn.getAttribute("data-filter") === "all") btn.classList.add("active");
    else btn.classList.remove("active");
  });
  renderTasks();             // first render
}

// start the app
init();