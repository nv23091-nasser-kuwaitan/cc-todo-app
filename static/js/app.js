/**
 * TaskFlow Application - Enhanced with All Features
 * Professional task management application
 */

class TaskManager {
  constructor() {
    this.tasks = [];
    this.categories = [];
    this.currentDetailTaskId = null;
    this.initializeEventListeners();
    this.loadData();
  }

  /**
   * Initialize all event listeners
   */
  initializeEventListeners() {
    // Form submission
    const form = document.getElementById('add-task-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleAddTask(e));
    }

    // Filter and sort controls
    const filterStatus = document.getElementById('filter-status');
    const filterPriority = document.getElementById('filter-priority');
    const filterCategory = document.getElementById('filter-category');
    const sortBy = document.getElementById('sort-by');
    const searchInput = document.getElementById('search-input');

    if (filterStatus) {
      filterStatus.addEventListener('change', () => this.render());
    }
    if (filterPriority) {
      filterPriority.addEventListener('change', () => this.render());
    }
    if (filterCategory) {
      filterCategory.addEventListener('change', () => this.render());
    }
    if (sortBy) {
      sortBy.addEventListener('change', () => this.render());
    }
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e));
    }

    // Modal close buttons
    const modalCloseBtn = document.getElementById('modal-close');
    const detailModalCloseBtn = document.getElementById('detail-modal-close');
    const detailCloseBtn = document.getElementById('detail-close-btn');
    
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => this.closeModal());
    }
    if (detailModalCloseBtn) {
      detailModalCloseBtn.addEventListener('click', () => this.closeDetailModal());
    }
    if (detailCloseBtn) {
      detailCloseBtn.addEventListener('click', () => this.closeDetailModal());
    }

    // Delete confirmation
    const deleteConfirmBtn = document.getElementById('delete-confirm');
    if (deleteConfirmBtn) {
      deleteConfirmBtn.addEventListener('click', () => this.confirmDelete());
    }

    // Cancel buttons
    document.querySelectorAll('[data-action="cancel"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) {
          modal.classList.remove('active');
        }
      });
    });

    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportTasksToCSV());
    }

    // Detail modal tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleTabClick(e));
    });

    // Detail modal form submissions
    const addSubtaskForm = document.getElementById('add-subtask-form');
    const addCommentForm = document.getElementById('add-comment-form');
    const detailSaveBtn = document.getElementById('detail-save-btn');

    if (addSubtaskForm) {
      addSubtaskForm.addEventListener('submit', (e) => this.handleAddSubtask(e));
    }
    if (addCommentForm) {
      addCommentForm.addEventListener('submit', (e) => this.handleAddComment(e));
    }
    if (detailSaveBtn) {
      detailSaveBtn.addEventListener('click', () => this.saveTaskDetail());
    }
  }

  /**
   * Load tasks and categories from the server
   */
  loadData() {
    Promise.all([
      fetch('/api/tasks').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/statistics').then(res => res.json())
    ]).then(([tasksData, categoriesData, statsData]) => {
      this.tasks = tasksData.tasks;
      this.categories = categoriesData.categories;
      this.updateStatistics(statsData.statistics);
      this.populateCategorySelects();
      this.render();
    }).catch(err => {
      console.error('Failed to load data:', err);
      this.showNotification('Failed to load data', 'error');
    });
  }

  /**
   * Update statistics dashboard
   */
  updateStatistics(stats) {
    document.getElementById('stat-total').textContent = stats.total || 0;
    document.getElementById('stat-active').textContent = stats.active || 0;
    document.getElementById('stat-completed').textContent = stats.completed || 0;
    document.getElementById('stat-overdue').textContent = stats.overdue || 0;
  }

  /**
   * Populate category select dropdowns
   */
  populateCategorySelects() {
    const selects = [
      'task-category',
      'filter-category',
      'detail-category-input'
    ];

    selects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (select) {
        // Keep the first option
        const firstOption = select.querySelector('option:first-child');
        select.innerHTML = '';
        if (firstOption) {
          select.appendChild(firstOption.cloneNode(true));
        }

        // Add categories
        this.categories.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat.id;
          option.textContent = cat.name;
          select.appendChild(option);
        });
      }
    });
  }

  /**
   * Handle adding a new task
   */
  handleAddTask(e) {
    e.preventDefault();

    const form = e.target;
    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const dueDate = form.dueDate.value;
    const priority = form.priority.value;
    const categoryId = form.categoryId.value || null;
    const recurring = form.recurring.value;

    // Validation
    if (!title) {
      this.showNotification('Please enter a task title', 'warning');
      return;
    }

    // Send to server
    fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        dueDate,
        priority,
        categoryId: categoryId ? parseInt(categoryId) : null,
        recurring
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          this.tasks.unshift(data.task);
          form.reset();
          this.render();
          this.showNotification('Task created successfully', 'success');
          this.loadData();
        } else {
          this.showNotification(data.message || 'Failed to create task', 'error');
        }
      })
      .catch((err) => {
        console.error('Error creating task:', err);
        this.showNotification('Error creating task', 'error');
      });
  }

  /**
   * Handle search
   */
  handleSearch(e) {
    const query = e.target.value.trim();

    if (query === '') {
      this.render();
      return;
    }

    // request first page of results (server supports pagination)
    fetch(`/api/tasks/search?q=${encodeURIComponent(query)}&page=1&per_page=200`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          this.tasks = data.tasks;
          this.render();
        }
      })
      .catch(err => {
        console.error('Search error:', err);
        this.showNotification('Search failed', 'error');
      });
  }

  /**
   * Export tasks to CSV
   */
  exportTasksToCSV() {
    window.location.href = '/api/tasks/export/csv';
  }

  /**
   * Render tasks with filters and sorting
   */
  render() {
    const container = document.getElementById('tasks-container');
    const filterStatus = document.getElementById('filter-status')?.value || 'all';
    const filterPriority = document.getElementById('filter-priority')?.value || 'all';
    const filterCategory = document.getElementById('filter-category')?.value || '';
    const sortBy = document.getElementById('sort-by')?.value || 'created';

    // Filter tasks
    let filtered = this.tasks.filter(task => {
      // Status filter
      if (filterStatus === 'active' && task.completed) return false;
      if (filterStatus === 'completed' && !task.completed) return false;

      // Priority filter
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;

      // Category filter
      if (filterCategory && task.category_id !== parseInt(filterCategory)) return false;

      return true;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due':
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        case 'priority':
          const priorityOrder = { High: 0, Medium: 1, Low: 2 };
          return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
        case 'order':
          return a.order - b.order;
        case 'created':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    // Render tasks
    if (filtered.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><i class="fas fa-inbox"></i><p>No tasks found</p></div>';
      return;
    }

    container.innerHTML = filtered
      .map(
        (task) =>
          `<div class="task-item ${task.completed ? 'task-completed' : ''} ${this.isOverdue(task) ? 'task-overdue' : ''}" draggable="true" data-task-id="${task.id}">
            <div class="task-header">
              <div class="task-checkbox">
                <input
                  type="checkbox"
                  class="task-check"
                  ${task.completed ? 'checked' : ''}
                  onchange="window.taskManager.toggleTask(${task.id})"
                  aria-label="Toggle task completion"
                />
              </div>
              <div class="task-content" onclick="window.taskManager.openDetailModal(${task.id})" style="cursor: pointer; flex-grow: 1;">
                <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
              </div>
              <div class="task-metadata">
                ${task.category ? `<span class="task-category" style="background-color: ${task.category.color};">${this.escapeHtml(task.category.name)}</span>` : ''}
                <span class="task-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
                ${task.due_date ? `<span class="task-due-date ${this.isOverdue(task) ? 'overdue' : ''}" title="Due: ${task.due_date}"><i class="fas fa-calendar"></i> ${this.formatDate(task.due_date)}</span>` : ''}
                ${task.updated_at ? `<span class="task-updated" title="Updated: ${task.updated_at}"><i class="fas fa-sync-alt"></i> ${this.formatDate(task.updated_at)}</span>` : ''}
                ${task.subtasks_count > 0 ? `<span class="task-meta"><i class="fas fa-list-check"></i> ${task.completed_subtasks}/${task.subtasks_count}</span>` : ''}
                ${task.comments_count > 0 ? `<span class="task-meta"><i class="fas fa-comment"></i> ${task.comments_count}</span>` : ''}
              </div>
            </div>
            <div class="task-actions">
              <button class="btn-icon" onclick="window.taskManager.openDetailModal(${task.id})" title="View details">
                <i class="fas fa-expand"></i>
              </button>
              <button class="btn-icon" onclick="window.taskManager.openEditModal(${task.id})" title="Edit task">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon btn-danger" onclick="window.taskManager.openDeleteModal(${task.id})" title="Delete task">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>`
      )
      .join('');
  }

  /**
   * Check if task is overdue
   */
  isOverdue(task) {
    if (!task.due_date || task.completed) return false;
    return new Date(task.due_date) < new Date();
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Toggle task completion
   */
  toggleTask(taskId) {
    fetch(`/api/tasks/${taskId}/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const task = this.tasks.find(t => t.id === taskId);
          if (task) {
            task.completed = data.task.completed;
          }
          this.render();
          this.showNotification(
            data.task.completed ? 'Task completed!' : 'Task reopened',
            'success'
          );
          this.loadData(); // Reload to update statistics
        }
      })
      .catch((err) => {
        console.error('Error toggling task:', err);
        this.showNotification('Error updating task', 'error');
      });
  }

  /**
   * Open detail modal for a task
   */
  openDetailModal(taskId) {
    this.currentDetailTaskId = taskId;
    const task = this.tasks.find(t => t.id === taskId);

    if (!task) return;

    document.getElementById('detail-task-id').value = task.id;
    document.getElementById('detail-title-input').value = task.title;
    document.getElementById('detail-description-input').value = task.description || '';
    document.getElementById('detail-priority-input').value = task.priority;
    document.getElementById('detail-due-date-input').value = task.due_date || '';
    document.getElementById('detail-category-input').value = task.category_id || '';
    document.getElementById('detail-recurring-input').value = task.recurring || 'none';

    // Load related data
    this.loadSubtasks(taskId);
    this.loadComments(taskId);
    this.loadTaskHistory(taskId);

    const modal = document.getElementById('task-detail-modal');
    modal.classList.add('active');
  }

  /**
   * Close detail modal
   */
  closeDetailModal() {
    const modal = document.getElementById('task-detail-modal');
    modal.classList.remove('active');
    this.currentDetailTaskId = null;
  }

  /**
   * Load subtasks for a task
   */
  loadSubtasks(taskId) {
    fetch(`/api/tasks/${taskId}/subtasks`)
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('subtasks-list');
        if (data.subtasks.length === 0) {
          container.innerHTML = '<p style="color: var(--color-neutral-500);">No subtasks yet</p>';
        } else {
          container.innerHTML = data.subtasks.map(st => `
            <div class="subtask-item ${st.completed ? 'completed' : ''}">
              <input type="checkbox" ${st.completed ? 'checked' : ''} 
                onchange="window.taskManager.toggleSubtask(${st.id})" />
              <span>${this.escapeHtml(st.title)}</span>
              <button class="btn-icon btn-sm" onclick="window.taskManager.deleteSubtask(${st.id})" title="Delete">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `).join('');
        }
      });
  }

  /**
   * Load comments for a task
   */
  loadComments(taskId) {
    fetch(`/api/tasks/${taskId}/comments`)
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('comments-list');
        if (data.comments.length === 0) {
          container.innerHTML = '<p style="color: var(--color-neutral-500);">No comments yet</p>';
        } else {
          container.innerHTML = data.comments.map(c => `
            <div class="comment-item">
              <div class="comment-header">
                <span class="comment-time">${new Date(c.created_at).toLocaleDateString()}</span>
                <button class="btn-icon btn-sm" onclick="window.taskManager.deleteComment(${c.id})" title="Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
              <p class="comment-content">${this.escapeHtml(c.content)}</p>
            </div>
          `).join('');
        }
      });
  }

  /**
   * Load task history
   */
  loadTaskHistory(taskId) {
    fetch(`/api/tasks/${taskId}/history`)
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('history-list');
        if (data.history.length === 0) {
          container.innerHTML = '<p style="color: var(--color-neutral-500);">No history</p>';
        } else {
          container.innerHTML = data.history.map(h => `
            <div class="history-item">
              <span class="history-action">${h.action}</span>
              ${h.field ? `<span class="history-field">${h.field}</span>` : ''}
              <span class="history-time">${new Date(h.created_at).toLocaleString()}</span>
            </div>
          `).join('');
        }
      });
  }

  /**
   * Handle adding a subtask
   */
  handleAddSubtask(e) {
    e.preventDefault();
    const taskId = parseInt(document.getElementById('detail-task-id').value);
    const title = document.getElementById('subtask-input').value.trim();

    if (!title) {
      this.showNotification('Please enter a subtask title', 'warning');
      return;
    }

    fetch(`/api/tasks/${taskId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          document.getElementById('subtask-input').value = '';
          this.loadSubtasks(taskId);
          this.showNotification('Subtask added', 'success');
        }
      });
  }

  /**
   * Toggle subtask completion
   */
  toggleSubtask(subtaskId) {
    fetch(`/api/subtasks/${subtaskId}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && this.currentDetailTaskId) {
          this.loadSubtasks(this.currentDetailTaskId);
        }
      });
  }

  /**
   * Delete subtask
   */
  deleteSubtask(subtaskId) {
    if (confirm('Delete this subtask?')) {
      fetch(`/api/subtasks/${subtaskId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success && this.currentDetailTaskId) {
            this.loadSubtasks(this.currentDetailTaskId);
            this.showNotification('Subtask deleted', 'success');
          }
        });
    }
  }

  /**
   * Handle adding a comment
   */
  handleAddComment(e) {
    e.preventDefault();
    const taskId = parseInt(document.getElementById('detail-task-id').value);
    const content = document.getElementById('comment-input').value.trim();

    if (!content) {
      this.showNotification('Please enter a comment', 'warning');
      return;
    }

    fetch(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          document.getElementById('comment-input').value = '';
          this.loadComments(taskId);
          this.showNotification('Comment added', 'success');
        }
      });
  }

  /**
   * Delete comment
   */
  deleteComment(commentId) {
    if (confirm('Delete this comment?')) {
      fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success && this.currentDetailTaskId) {
            this.loadComments(this.currentDetailTaskId);
            this.showNotification('Comment deleted', 'success');
          }
        });
    }
  }

  /**
   * Handle tab clicks
   */
  handleTabClick(e) {
    e.preventDefault();
    const tabName = e.target.closest('.tab-button').dataset.tab;

    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    e.target.closest('.tab-button').classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
  }

  /**
   * Save task detail changes
   */
  saveTaskDetail() {
    const taskId = parseInt(document.getElementById('detail-task-id').value);
    const title = document.getElementById('detail-title-input').value.trim();
    const description = document.getElementById('detail-description-input').value.trim();
    const priority = document.getElementById('detail-priority-input').value;
    const dueDate = document.getElementById('detail-due-date-input').value;
    const categoryId = document.getElementById('detail-category-input').value;
    const recurring = document.getElementById('detail-recurring-input').value;

    if (!title) {
      this.showNotification('Please enter a title', 'warning');
      return;
    }

    fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        priority,
        dueDate,
        categoryId: categoryId ? parseInt(categoryId) : null,
        recurring
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const task = this.tasks.find(t => t.id === taskId);
          if (task) {
            Object.assign(task, data.task);
          }
          this.render();
          this.closeDetailModal();
          this.showNotification('Task updated', 'success');
          this.loadData();
        }
      });
  }

  /**
   * Open edit modal
   */
  openEditModal(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('modal-task-id').value = task.id;
    document.getElementById('modal-title-input').value = task.title;
    document.getElementById('modal-description-input').value = task.description || '';
    document.getElementById('modal-priority-input').value = task.priority;
    document.getElementById('modal-due-date-input').value = task.due_date || '';

    const modal = document.getElementById('task-modal');
    modal.classList.add('active');
  }

  /**
   * Save task (simple modal)
   */
  saveTask() {
    const taskId = parseInt(document.getElementById('modal-task-id').value);
    const title = document.getElementById('modal-title-input').value.trim();
    const description = document.getElementById('modal-description-input').value.trim();
    const priority = document.getElementById('modal-priority-input').value;
    const dueDate = document.getElementById('modal-due-date-input').value;

    if (!title) {
      this.showNotification('Please enter a title', 'warning');
      return;
    }

    fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        priority,
        dueDate
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const task = this.tasks.find(t => t.id === taskId);
          if (task) {
            Object.assign(task, data.task);
          }
          this.render();
          this.closeModal();
          this.showNotification('Task updated', 'success');
          this.loadData();
        }
      });
  }

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.getElementById('task-modal');
    modal.classList.remove('active');
  }

  /**
   * Open delete modal
   */
  openDeleteModal(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('delete-task-id').value = task.id;
    document.getElementById('delete-task-title').textContent = task.title;

    const modal = document.getElementById('delete-modal');
    modal.classList.add('active');
  }

  /**
   * Confirm delete
   */
  confirmDelete() {
    const taskId = parseInt(document.getElementById('delete-task-id').value);

    fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          this.tasks = this.tasks.filter(t => t.id !== taskId);
          this.render();
          const modal = document.getElementById('delete-modal');
          modal.classList.remove('active');
          this.showNotification('Task deleted', 'success');
          this.loadData();
        }
      });
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2em;">×</button>
    `;
    container.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app
window.taskManager = new TaskManager();
