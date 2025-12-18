let tasks = [];
let currentFilter = 'all';
let searchTerm = '';


const taskList = document.getElementById('task-list');
const emptyMessage = document.getElementById('empty-message');
const totalTasksEl = document.getElementById('total-tasks');
const activeTasksEl = document.getElementById('active-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const addTaskForm = document.getElementById('add-task-form');
const taskTextInput = document.getElementById('task-text');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const selectAllCheckbox = document.getElementById('select-all');
const deleteSelectedBtn = document.getElementById('delete-selected');
const loadSampleBtn = document.getElementById('load-sample');


document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupEventListeners();
    updateStats();
});


function loadTasks() {
    const savedTasks = localStorage.getItem('simpleTodoTasks');
    
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        renderTasks();
    } else {

        tasks = [];
        renderTasks();
    }
}


function saveTasks() {
    localStorage.setItem('simpleTodoTasks', JSON.stringify(tasks));
    updateStats();
}


function renderTasks() {

    taskList.innerHTML = '';
    

    let filteredTasks = tasks.filter(task => {

        if (searchTerm && !task.text.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        

        switch (currentFilter) {
            case 'active':
                return !task.completed;
            case 'completed':
                return task.completed;
            default:
                return true; 
        }
    });
    

    if (filteredTasks.length === 0) {
        emptyMessage.style.display = 'block';
    } else {
        emptyMessage.style.display = 'none';
        

        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }
}


function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.completed) {
        li.classList.add('completed');
    }
    
    li.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-text">${escapeHtml(task.text)}</div>
        <div class="task-actions">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>
    `;
    

    const checkbox = li.querySelector('.task-checkbox');
    checkbox.addEventListener('change', () => toggleTask(task.id));
    
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    const editBtn = li.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => editTask(task.id));
    
    return li;
}


function addTask(text) {
    const newTask = {
        id: Date.now(), 
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
}


function toggleTask(id) {
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks();
        renderTasks();
    }
}


function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }
}


function editTask(id) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;
    
    const newText = prompt('Edit your task:', task.text);
    if (newText !== null && newText.trim() !== '') {
        task.text = newText.trim();
        saveTasks();
        renderTasks();
    }
}


function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const active = total - completed;
    
    totalTasksEl.textContent = total;
    activeTasksEl.textContent = active;
    completedTasksEl.textContent = completed;
}


async function loadSampleTasks() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
        const apiTasks = await response.json();
        

        const sampleTasks = apiTasks.map(task => ({
            id: task.id,
            text: task.title,
            completed: task.completed,
            createdAt: new Date().toISOString(),
            source: 'api'
        }));
        

        tasks = [...tasks, ...sampleTasks];
        saveTasks();
        renderTasks();
        
        alert(`Loaded ${sampleTasks.length} sample tasks!`);
    } catch (error) {
        console.error('Error loading sample tasks:', error);
        alert('Could not load sample tasks. Please try again later.');
    }
}


function setupEventListeners() {

    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = taskTextInput.value.trim();
        
        if (text) {
            addTask(text);
            taskTextInput.value = '';
            taskTextInput.focus();
        }
    });
    

    searchInput.addEventListener('input', () => {
        searchTerm = searchInput.value;
        renderTasks();
    });
    

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {

            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            

            currentFilter = button.dataset.filter;
            renderTasks();
        });
    });
    

    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = document.querySelectorAll('.task-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });
    

    deleteSelectedBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.task-checkbox:checked');
        
        if (checkboxes.length === 0) {
            alert('No tasks selected!');
            return;
        }
        
        if (confirm(`Delete ${checkboxes.length} selected task(s)?`)) {
            checkboxes.forEach(checkbox => {
                const taskId = parseInt(checkbox.closest('.task-item').dataset.id || checkbox.parentElement.parentElement.querySelector('.task-text').textContent);
                tasks = tasks.filter(task => task.id !== taskId);
            });
            
            saveTasks();
            renderTasks();
            selectAllCheckbox.checked = false;
        }
    });
    

    loadSampleBtn.addEventListener('click', loadSampleTasks);
    

    document.addEventListener('keydown', (e) => {

        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
        }
        

        if (e.key === 'Enter' && e.ctrlKey && document.activeElement === taskTextInput) {
            addTaskForm.dispatchEvent(new Event('submit'));
        }
    });
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}