// Полный рабочий скрипт для ежедневника Боднарчука
document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const taskForm = document.getElementById('task-form');
    const taskTitleInput = document.getElementById('task-title');
    const taskDescriptionInput = document.getElementById('task-description');
    const tasksContainer = document.getElementById('tasks-container');
    const tasksCountElement = document.getElementById('tasks-count');
    const clearFormButton = document.getElementById('clear-form');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Счетчик задач и данные
    let taskId = 1;
    let tasks = []; // Массив для хранения всех задач
    let currentFilter = 'all'; // Текущий фильтр
    
    // Инициализация из localStorage
    loadTasks();
    
    // Обработчик отправки формы
    taskForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        
        if (!title) {
            showNotification('Пожалуйста, введите название задачи!', 'error');
            taskTitleInput.focus();
            return;
        }
        
        // Создаем задачу
        const task = {
            id: taskId++,
            title: title,
            description: description || 'Описание отсутствует',
            date: getCurrentDate(),
            important: false,
            timestamp: new Date().getTime(),
            completed: false
        };
        
        // Добавляем в массив
        tasks.push(task);
        
        // Сохраняем
        saveTasks();
        
        // Отображаем
        renderTasks();
        
        // Очищаем форму
        clearForm();
        
        // Уведомление
        showNotification('Задача успешно добавлена!', 'success');
        taskTitleInput.focus();
    });
    
    // Обработчик кнопки очистки формы
    clearFormButton.addEventListener('click', function(event) {
        event.preventDefault();
        clearForm();
        taskTitleInput.focus();
    });
    
    // Обработчики фильтров
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Снимаем активный класс со всех кнопок
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Устанавливаем текущий фильтр
            currentFilter = this.getAttribute('data-filter');
            
            // Применяем фильтр
            renderTasks();
        });
    });
    
    // Функция отрисовки задач с учетом фильтра
    function renderTasks() {
        // Фильтруем задачи
        let filteredTasks = filterTasks(tasks);
        
        // Очищаем контейнер
        tasksContainer.innerHTML = '';
        
        // Если задач нет
        if (filteredTasks.length === 0) {
            showNoTasksMessage();
            updateTasksCount();
            return;
        }
        
        // Создаем карточки для отфильтрованных задач
        filteredTasks.forEach(task => {
            const taskCard = createTaskCard(task);
            tasksContainer.appendChild(taskCard);
        });
        
        updateTasksCount();
    }
    
    // Функция фильтрации задач
    function filterTasks(taskList) {
        switch(currentFilter) {
            case 'all':
                return taskList;
                
            case 'important':
                return taskList.filter(task => task.important);
                
            case 'recent':
                const oneDayAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
                return taskList.filter(task => task.timestamp > oneDayAgo);
                
            default:
                return taskList;
        }
    }
    
    // Функция создания карточки задачи
    function createTaskCard(task) {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.dataset.id = task.id;
        
        if (task.important) {
            taskCard.classList.add('important');
        }
        
        // Заполняем содержимое
        taskCard.innerHTML = `
            <div class="task-card-header">
                <div class="task-meta">
                    <span class="task-date">${task.date}</span>
                    <span class="task-id">#${task.id}</span>
                </div>
                <button class="task-delete-btn" title="Удалить задачу">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="task-card-body">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                <p class="task-description">${escapeHtml(task.description)}</p>
            </div>
            <div class="task-card-footer">
                <div class="task-actions">
                    <button class="task-important-btn" title="${task.important ? 'Снять отметку важности' : 'Отметить как важную'}">
                        <i class="${task.important ? 'fas' : 'far'} fa-star"></i>
                    </button>
                    <span class="task-status">${task.completed ? 'Выполнена' : 'Активная'}</span>
                </div>
                <div class="task-brand">
                    <span class="brand-mark">Боднарчук</span>
                </div>
            </div>
        `;
        
        // Обработчик кнопки удаления
        const deleteBtn = taskCard.querySelector('.task-delete-btn');
        deleteBtn.addEventListener('click', function() {
            // Анимация удаления
            taskCard.style.transform = 'scale(0.9)';
            taskCard.style.opacity = '0';
            
            setTimeout(() => {
                // Удаляем из массива
                const taskIndex = tasks.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                    tasks.splice(taskIndex, 1);
                }
                
                // Сохраняем
                saveTasks();
                
                // Перерисовываем
                renderTasks();
                
                // Уведомление
                showNotification('Задача удалена', 'info');
            }, 300);
        });
        
        // Обработчик кнопки "важная"
        const importantBtn = taskCard.querySelector('.task-important-btn');
        importantBtn.addEventListener('click', function() {
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
                tasks[taskIndex].important = !tasks[taskIndex].important;
                
                // Сохраняем
                saveTasks();
                
                // Перерисовываем
                renderTasks();
                
                // Уведомление
                if (tasks[taskIndex].important) {
                    showNotification('Задача отмечена как важная', 'success');
                } else {
                    showNotification('Задача больше не важная', 'info');
                }
            }
        });
        
        // Обработчик клика по карточке для отметки выполнения
        taskCard.addEventListener('click', function(e) {
            // Если клик не по кнопкам удаления или важности
            if (!e.target.closest('.task-delete-btn') && !e.target.closest('.task-important-btn')) {
                const taskIndex = tasks.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                    tasks[taskIndex].completed = !tasks[taskIndex].completed;
                    
                    // Сохраняем
                    saveTasks();
                    
                    // Перерисовываем
                    renderTasks();
                    
                    // Уведомление
                    if (tasks[taskIndex].completed) {
                        showNotification('Задача отмечена как выполненная', 'success');
                    } else {
                        showNotification('Задача снова активна', 'info');
                    }
                }
            }
        });
        
        // Анимация появления
        taskCard.style.opacity = '0';
        taskCard.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            taskCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            taskCard.style.opacity = '1';
            taskCard.style.transform = 'translateY(0)';
        }, 10);
        
        return taskCard;
    }
    
    // Функция показа сообщения "нет задач"
    function showNoTasksMessage() {
        let message = '';
        
        switch(currentFilter) {
            case 'important':
                message = 'Нет важных задач. Отметьте задачи как важные, чтобы увидеть их здесь.';
                break;
            case 'recent':
                message = 'Нет задач за последние 24 часа. Добавьте новые задачи!';
                break;
            default:
                message = 'Добавьте первую задачу, используя форму выше. Ваш ежедневник Боднарчука готов к работе!';
        }
        
        tasksContainer.innerHTML = `
            <div class="no-tasks-message">
                <i class="fas fa-clipboard-list"></i>
                <h3>Пока нет задач</h3>
                <p>${message}</p>
            </div>
        `;
    }
    
    // Функция очистки формы
    function clearForm() {
        taskTitleInput.value = '';
        taskDescriptionInput.value = '';
    }
    
    // Функция обновления счетчика задач
    function updateTasksCount() {
        const filteredTasks = filterTasks(tasks);
        const count = filteredTasks.length;
        tasksCountElement.textContent = count;
        
        // Анимация счетчика
        tasksCountElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            tasksCountElement.style.transform = 'scale(1)';
        }, 300);
    }
    
    // Функция получения текущей даты
    function getCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return now.toLocaleDateString('ru-RU', options);
    }
    
    // Функция показа уведомления
    function showNotification(message, type = 'info') {
        // Удаляем предыдущие уведомления
        const oldNotifications = document.querySelectorAll('.notification');
        oldNotifications.forEach(n => n.remove());
        
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = 'notification';
        
        let bgColor, icon;
        switch(type) {
            case 'success':
                bgColor = 'rgba(76, 175, 80, 0.9)';
                icon = 'fas fa-check-circle';
                break;
            case 'error':
                bgColor = 'rgba(244, 67, 54, 0.9)';
                icon = 'fas fa-exclamation-circle';
                break;
            case 'info':
            default:
                bgColor = 'rgba(33, 150, 243, 0.9)';
                icon = 'fas fa-info-circle';
        }
        
        notification.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            transform: translateX(150%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Показываем уведомление
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Скрываем через 3 секунды
        setTimeout(() => {
            notification.style.transform = 'translateX(150%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
    
    // Функция сохранения задач в localStorage
    function saveTasks() {
        // Сохраняем текущий максимальный ID
        localStorage.setItem('taskId', taskId.toString());
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Функция загрузки задач из localStorage
    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        const savedTaskId = localStorage.getItem('taskId');
        
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
            
            // Восстанавливаем timestamp как число
            tasks.forEach(task => {
                if (typeof task.timestamp === 'string') {
                    task.timestamp = parseInt(task.timestamp);
                }
            });
            
            // Находим максимальный ID
            if (tasks.length > 0) {
                const maxId = Math.max(...tasks.map(task => task.id));
                taskId = maxId + 1;
            }
        }
        
        if (savedTaskId) {
            taskId = parseInt(savedTaskId);
        }
        
        // Отображаем задачи
        renderTasks();
    }
    
    // Вспомогательная функция для безопасного вывода HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Добавляем стили для важных задач в DOM
    const style = document.createElement('style');
    style.textContent = `
        .task-card.important {
            border-left: 4px solid #ffc107;
            box-shadow: 0 8px 30px rgba(255, 193, 7, 0.15);
        }
        
        .task-card.important .task-title {
            color: #ff9800;
        }
        
        .task-card.completed .task-title {
            text-decoration: line-through;
            color: #888;
        }
        
        .task-card.completed .task-description {
            color: #aaa;
        }
    `;
    document.head.appendChild(style);
});