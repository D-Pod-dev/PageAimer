// Reading Goal Tracker Application - Multi-Goal Version

class ReadingGoalTracker {
    constructor() {
        this.goals = [];
        this.currentGoalId = null;
        this.editingGoalId = null;
        this.bulkDeleteMode = false;
        this.selectedGoalIds = new Set();
        this.lastCheckedDate = this.getTodayDateString();
        this.debugDate = null; // Add this property to the constructor
        this.init();
        this.setupDateWatcher();
    }

    setDebugDate(dateString = null) {
        if (dateString) {
            this.debugDate = new Date(dateString + 'T00:00:00');
            console.log(`Debug date set to: ${dateString}`);
        } else {
            this.debugDate = null;
            console.log('Debug date reset to current date');
        }
        
        // Update last checked date to trigger recalculations
        this.lastCheckedDate = this.getTodayDateString();
        
        // Force update all goals with new date
        this.goals.forEach(goal => this.updateTodaysTarget(goal, true));
        
        // Refresh display
        this.updateDisplay();
        
        // If viewing a goal dashboard, update it too
        if (this.currentGoalId && !document.getElementById('goal-dashboard').classList.contains('hidden')) {
            this.updateGoalDashboard();
        }
    }

    getTodayDateString() {
        const today = this.debugDate || new Date();
        today.setHours(0, 0, 0, 0);
        return today.toISOString();
    }

    getCurrentDate() {
        const today = this.debugDate || new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }

    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    setupDateWatcher() {
        // Check every minute if the date has changed
        setInterval(() => {
            const currentDate = this.getTodayDateString();
            if (currentDate !== this.lastCheckedDate) {
                this.lastCheckedDate = currentDate;
                // Update today's target for all goals when the day changes
                this.goals.forEach(goal => this.updateTodaysTarget(goal));
                this.updateDisplay();
            }
        }, 60000); // 60,000 ms = 1 minute
    }

    init() {
        this.loadGoals();
        this.setupEventListeners();
        this.goals.forEach(goal => this.updateTodaysTarget(goal));
        this.updateDisplay();
        this.setMinDate();
        
        // Debug helper message
        console.log('🚀 PageAimer loaded! Debug tip: Use tracker.setDebugDate("YYYY-MM-DD") to test different dates, or tracker.setDebugDate() to reset to current date.');
    }

    setMinDate() {
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('due-date').min = today;
        document.getElementById('edit-due-date').min = today;
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('add-new-goal').addEventListener('click', () => {
            this.showCreateGoalSection();
        });

        document.getElementById('back-to-goals').addEventListener('click', () => {
            this.showAllGoalsSection();
        });

        document.getElementById('back-from-edit').addEventListener('click', () => {
            this.showAllGoalsSection();
        });

        document.getElementById('back-from-dashboard').addEventListener('click', () => {
            this.showAllGoalsSection();
        });

        // Goal creation form
        document.getElementById('goal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createGoal();
        });

        // Goal editing form
        document.getElementById('edit-goal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateGoal();
        });

        // Progress update form
        document.getElementById('update-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProgress();
        });

        // Reset goal button (now creates new goal)
        document.getElementById('reset-goal').addEventListener('click', () => {
            this.showCreateGoalSection();
        });

        // Bulk delete functionality
        document.getElementById('bulk-delete-toggle').addEventListener('click', () => {
            this.toggleBulkDeleteMode();
        });

        document.getElementById('cancel-bulk-delete').addEventListener('click', () => {
            this.exitBulkDeleteMode();
        });

        document.getElementById('delete-selected-goals').addEventListener('click', () => {
            this.deleteSelectedGoals();
        });

        document.getElementById('select-all-goals').addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        document.getElementById('select-all-completed').addEventListener('click', () => {
            this.selectAllCompleted();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.goal-menu-btn') && !e.target.closest('.goal-dropdown')) {
                this.closeAllDropdowns();
            }
        });
    }

    showAllGoalsSection() {
        this.hideAllSections();
        document.getElementById('all-goals-section').classList.remove('hidden');
        this.exitBulkDeleteMode();
        this.updateDisplay();
    }

    showCreateGoalSection() {
        this.hideAllSections();
        document.getElementById('create-goal-section').classList.remove('hidden');
        document.getElementById('goal-form').reset();
    }

    showEditGoalSection(goalId) {
        this.hideAllSections();
        this.editingGoalId = goalId;
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            document.getElementById('edit-book-title').value = goal.bookTitle === 'Your Book' ? '' : goal.bookTitle;
            document.getElementById('edit-target-page').value = goal.targetPage;
            document.getElementById('edit-due-date').value = goal.dueDate;
        }
        document.getElementById('edit-goal-section').classList.remove('hidden');
    }

    showGoalDashboard(goalId) {
        this.hideAllSections();
        this.currentGoalId = goalId;
        this.updateGoalDashboard();
        document.getElementById('goal-dashboard').classList.remove('hidden');
    }

    hideAllSections() {
        const sections = ['all-goals-section', 'create-goal-section', 'edit-goal-section', 'goal-dashboard'];
        sections.forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
    }

    createGoal() {
        const bookTitle = document.getElementById('book-title').value;
        const targetPage = parseInt(document.getElementById('target-page').value);
        const currentPage = parseInt(document.getElementById('current-page').value) || 0;
        const dueDate = document.getElementById('due-date').value;

        // Validation
        if (!targetPage || !dueDate) {
            alert('Please fill in all required fields.');
            return;
        }

        if (currentPage >= targetPage) {
            alert('Current page must be less than target page.');
            return;
        }

        const dueDateObj = new Date(dueDate + 'T00:00:00'); // Ensure local timezone
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dueDateObj <= today) {
            alert('Due date must be in the future.');
            return;
        }

        const goal = {
            id: this.generateId(),
            bookTitle: bookTitle || 'Your Book',
            targetPage: targetPage,
            currentPage: currentPage,
            dueDate: dueDate,
            createdDate: new Date().toISOString()
        };

        // Set today's target immediately when goal is created
        this.updateTodaysTarget(goal);
        this.goals.push(goal);
        this.saveGoals();
        this.showAllGoalsSection();
    }

    updateGoal() {
        const goalIndex = this.goals.findIndex(g => g.id === this.editingGoalId);
        if (goalIndex === -1) return;

        const bookTitle = document.getElementById('edit-book-title').value;
        const targetPage = parseInt(document.getElementById('edit-target-page').value);
        const dueDate = document.getElementById('edit-due-date').value;

        // Validation
        if (!targetPage || !dueDate) {
            alert('Please fill in all required fields.');
            return;
        }

        const goal = this.goals[goalIndex];
        if (goal.currentPage >= targetPage) {
            alert('Target page must be greater than current page.');
            return;
        }

        const dueDateObj = new Date(dueDate + 'T00:00:00'); // Ensure local timezone
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dueDateObj <= today) {
            alert('Due date must be in the future.');
            return;
        }

        // Update goal
        goal.bookTitle = bookTitle || 'Your Book';
        goal.targetPage = targetPage;
        goal.dueDate = dueDate;

        // Recalculate today's target (force update since goal parameters changed)
        this.updateTodaysTarget(goal, true);
        this.saveGoals();
        
        // If this is the goal currently being viewed in the dashboard, update it
        if (this.currentGoalId === this.editingGoalId) {
            this.updateGoalDashboard();
        }
        
        this.showAllGoalsSection();
    }

    deleteGoal(goalId) {
        if (confirm('Are you sure you want to delete this goal?')) {
            this.goals = this.goals.filter(g => g.id !== goalId);
            this.saveGoals();
            this.closeAllDropdowns();
            this.renderGoalsList();
            this.updateDisplay();
        }
    }

    toggleBulkDeleteMode() {
        this.bulkDeleteMode = true;
        this.selectedGoalIds.clear();
        this.updateDisplay();
    }

    exitBulkDeleteMode() {
        this.bulkDeleteMode = false;
        this.selectedGoalIds.clear();
        this.updateDisplay();
    }

    toggleGoalSelection(goalId) {
        if (this.selectedGoalIds.has(goalId)) {
            this.selectedGoalIds.delete(goalId);
        } else {
            this.selectedGoalIds.add(goalId);
        }
        this.updateDisplay();
    }

    toggleSelectAll(selectAll) {
        if (selectAll) {
            this.goals.forEach(goal => this.selectedGoalIds.add(goal.id));
        } else {
            this.selectedGoalIds.clear();
        }
        this.updateDisplay();
    }

    selectAllCompleted() {
        this.goals.forEach(goal => {
            if (this.isGoalCompleted(goal)) {
                this.selectedGoalIds.add(goal.id);
            }
        });
        this.updateDisplay();
    }

    isGoalCompleted(goal) {
        return goal.currentPage >= goal.targetPage;
    }

    isGoalOverdue(goal) {
        const today = this.getCurrentDate();
        const dueDate = new Date(goal.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate <= today && !this.isGoalCompleted(goal);
    }

    deleteSelectedGoals() {
        if (this.selectedGoalIds.size === 0) {
            alert('Please select goals to delete.');
            return;
        }

        const count = this.selectedGoalIds.size;
        const confirmMessage = `Are you sure you want to delete ${count} goal${count === 1 ? '' : 's'}?`;
        
        if (confirm(confirmMessage)) {
            this.goals = this.goals.filter(goal => !this.selectedGoalIds.has(goal.id));
            this.saveGoals();
            this.exitBulkDeleteMode();
        }
    }

    updateTodaysTarget(goal, forceUpdate = false) {
        const today = this.getTodayDateString();
        // Only update if we don't have today's target, if the date has changed, or if forced
        if (!goal.todaysTarget || goal.todaysTargetDate !== today || forceUpdate) {
            // Store the current page at the time we set today's target
            goal.todaysTargetBasePage = goal.currentPage;
            const dailyGoal = this.calculateDailyGoal(goal);
            goal.todaysTarget = goal.currentPage + dailyGoal;
            goal.todaysTargetDate = today;
        }
    }

    updateProgress() {
        const goalId = this.currentGoalId;
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        const newCurrentPage = parseInt(document.getElementById('new-current-page').value);

        if (!newCurrentPage && newCurrentPage !== 0) {
            alert('Please enter a valid page number.');
            return;
        }

        if (newCurrentPage < goal.currentPage) {
            if (!confirm('The new page number is less than your current page. Are you sure?')) {
                return;
            }
        }

        if (newCurrentPage >= goal.targetPage) {
            goal.currentPage = goal.targetPage;
        } else {
            goal.currentPage = newCurrentPage;
        }

        // Don't update today's target when progress is updated
        this.saveGoals();
        this.updateGoalDashboard();
        
        // Clear form
        document.getElementById('update-form').reset();
    }

    calculateDailyGoal(goal) {
        if (!goal) return 0;

        const today = this.getCurrentDate();
        
        const dueDate = new Date(goal.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const pagesRemaining = goal.targetPage - goal.currentPage;

        if (daysRemaining <= 0) {
            return pagesRemaining; // All pages need to be read today
        }

        if (pagesRemaining <= 0) {
            return 0; // Goal already completed
        }

        return Math.ceil(pagesRemaining / daysRemaining);
    }

    getDaysRemaining(goal) {
        if (!goal) return 0;

        const today = this.getCurrentDate();
        
        const dueDate = new Date(goal.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return Math.max(0, daysRemaining);
    }

    getDaysFromDueDate(goal) {
        if (!goal) return 0;

        const today = this.getCurrentDate();
        
        const dueDate = new Date(goal.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const daysDifference = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return daysDifference;
    }

    getTodaysTargetPage(goal) {
        if (!goal) return 0;
        
        // Return the stored today's target if it exists and is for today
        const today = this.getTodayDateString();
        if (goal.todaysTarget && goal.todaysTargetDate === today) {
            return goal.todaysTarget;
        }
        
        // Fallback to calculated value (shouldn't happen if updateTodaysTarget is called properly)
        const dailyGoal = this.calculateDailyGoal(goal);
        return goal.currentPage + dailyGoal;
    }

    getTodaysProgressStatus(goal) {
        if (!goal) return { message: '', status: '' };

        const todaysTarget = this.getTodaysTargetPage(goal);
        const currentPage = goal.currentPage;
        const pagesDifference = currentPage - todaysTarget;

        if (pagesDifference < 0) {
            const pagesLeft = Math.abs(pagesDifference);
            return {
                message: `${pagesLeft} page${pagesLeft === 1 ? '' : 's'} left to reach today's target`,
                status: 'behind'
            };
        } else if (pagesDifference === 0) {
            return {
                message: "You've reached today's target! 🎯",
                status: 'on-track'
            };
        } else {
            return {
                message: `You're ${pagesDifference} page${pagesDifference === 1 ? '' : 's'} ahead of today's target! 📚`,
                status: 'ahead'
            };
        }
    }

    getProgress(goal) {
        if (!goal) return 0;
        
        const totalPages = goal.targetPage;
        const pagesRead = goal.currentPage;
        
        return Math.round((pagesRead / totalPages) * 100);
    }

    closeAllDropdowns() {
        document.querySelectorAll('.goal-dropdown').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        document.querySelectorAll('.goal-item').forEach(item => {
            item.classList.remove('dropdown-open');
        });
    }

    toggleGoalDropdown(goalId, event) {
        event.stopPropagation();
        this.closeAllDropdowns();
        
        const dropdown = document.getElementById(`dropdown-${goalId}`);
        const goalItem = event.target.closest('.goal-item');
        if (dropdown) {
            dropdown.classList.add('show');
            if (goalItem) {
                goalItem.classList.add('dropdown-open');
            }
        }
    }

    renderGoalsList() {
        const goalsListEl = document.getElementById('goals-list');
        const noGoalsEl = document.getElementById('no-goals-message');
        
        if (this.goals.length === 0) {
            noGoalsEl.classList.remove('hidden');
            // Clear existing goals when no goals exist
            const existingGoals = goalsListEl.querySelectorAll('.goal-item');
            existingGoals.forEach(item => item.remove());
            return;
        }
        
        noGoalsEl.classList.add('hidden');
        
        // Clear existing goals (except no-goals-message)
        const existingGoals = goalsListEl.querySelectorAll('.goal-item');
        existingGoals.forEach(item => item.remove());
        
        this.goals.forEach(goal => {
            const goalEl = this.createGoalElement(goal);
            goalsListEl.appendChild(goalEl);
        });
    }

    createGoalElement(goal) {
        const progress = this.getProgress(goal);
        const daysRemaining = this.getDaysRemaining(goal);
        const dailyGoal = this.calculateDailyGoal(goal);
        const isCompleted = this.isGoalCompleted(goal);
        const isOverdue = this.isGoalOverdue(goal);
        
        let goalClasses = `goal-item ${this.selectedGoalIds.has(goal.id) ? 'selected' : ''}`;
        if (isCompleted) {
            goalClasses += ' completed';
        } else if (isOverdue) {
            goalClasses += ' overdue';
        }
        
        const goalEl = document.createElement('div');
        goalEl.className = goalClasses;
        goalEl.innerHTML = `
            <div class="goal-item-header">
                <div>
                    <h3 class="goal-item-title">${goal.bookTitle}</h3>
                    <p class="goal-item-subtitle">Target: ${goal.targetPage} pages | Due: ${new Date(goal.dueDate).toLocaleDateString()}</p>
                </div>
                <div class="goal-item-actions">
                    <label class="checkbox-container goal-item-checkbox ${this.bulkDeleteMode ? 'visible' : ''}">
                        <input type="checkbox" ${this.selectedGoalIds.has(goal.id) ? 'checked' : ''}>
                    </label>
                    <button class="goal-menu-btn" onclick="tracker.toggleGoalDropdown('${goal.id}', event)">⋮</button>
                    <div id="dropdown-${goal.id}" class="goal-dropdown">
                        <button class="goal-dropdown-item" onclick="tracker.showGoalDashboard('${goal.id}')">View Details</button>
                        <button class="goal-dropdown-item" onclick="tracker.showEditGoalSection('${goal.id}')">Edit Goal</button>
                        <button class="goal-dropdown-item" onclick="tracker.deleteGoal('${goal.id}')">Delete Goal</button>
                    </div>
                </div>
            </div>
            <div class="goal-progress">
                <span class="goal-progress-text">${progress}%</span>
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${progress}%"></div>
                </div>
                <span class="goal-progress-text">${goal.currentPage}/${goal.targetPage}</span>
            </div>
            <div class="goal-stats">
                <div class="goal-stat">
                    <span class="goal-stat-value">${isOverdue ? Math.abs(this.getDaysFromDueDate(goal)) : daysRemaining}</span>
                    <span class="goal-stat-label">${isOverdue ? 'days overdue' : 'days left'}</span>
                </div>
                <div class="goal-stat">
                    <span class="goal-stat-value">${isCompleted ? '✓' : dailyGoal}</span>
                    <span class="goal-stat-label">${isCompleted ? 'done' : 'pages/day'}</span>
                </div>
            </div>
        `;
        
        // Add click handler for goal item (not in bulk delete mode)
        if (!this.bulkDeleteMode) {
            goalEl.addEventListener('click', (e) => {
                if (!e.target.closest('.goal-item-actions')) {
                    this.showGoalDashboard(goal.id);
                }
            });
        } else {
            // In bulk delete mode, clicking toggles selection
            goalEl.addEventListener('click', (e) => {
                if (!e.target.closest('.goal-item-actions')) {
                    this.toggleGoalSelection(goal.id);
                }
            });
        }
        
        // Handle checkbox change
        const checkbox = goalEl.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                this.toggleGoalSelection(goal.id);
            });
        }
        
        return goalEl;
    }

    updateGoalDashboard() {
        const goal = this.goals.find(g => g.id === this.currentGoalId);
        if (!goal) return;

        const isCompleted = this.isGoalCompleted(goal);

        // Update dashboard title
        const title = goal.bookTitle !== 'Your Book' 
            ? `Reading Goal: ${goal.bookTitle}` 
            : 'Your Reading Goal';
        document.getElementById('dashboard-title').textContent = title;

        // Add completion message if goal is completed
        let completionMessageEl = document.querySelector('.goal-completion-message');
        if (isCompleted && !completionMessageEl) {
            completionMessageEl = document.createElement('div');
            completionMessageEl.className = 'goal-completion-message';
            completionMessageEl.textContent = '🎉 Congratulations! You\'ve completed your reading goal! 🎉';
            const goalHeader = document.querySelector('.goal-header');
            goalHeader.insertAdjacentElement('afterend', completionMessageEl);
        } else if (!isCompleted && completionMessageEl) {
            completionMessageEl.remove();
        }

        // Update goal info
        document.getElementById('display-target-page').textContent = goal.targetPage;
        document.getElementById('display-current-page').textContent = goal.currentPage;
        
        const formattedDate = new Date(goal.dueDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        document.getElementById('display-due-date').textContent = formattedDate;
        
        const daysRemaining = this.getDaysRemaining(goal);
        const daysRemainingEl = document.getElementById('display-days-remaining');
        const daysRemainingLabel = document.getElementById('days-remaining-label');
        
        // Show different text based on overdue status
        if (this.isGoalOverdue(goal)) {
            const daysOverdue = Math.abs(this.getDaysFromDueDate(goal));
            if (daysOverdue === 0) {
                daysRemainingLabel.textContent = 'Days Remaining';
                daysRemainingEl.textContent = 'Due today';
            } else {
                daysRemainingLabel.textContent = 'Days Overdue';
                daysRemainingEl.textContent = daysOverdue;
            }
        } else {
            daysRemainingLabel.textContent = 'Days Remaining';
            daysRemainingEl.textContent = daysRemaining;
        }
        
        // Highlight days remaining if goal is overdue
        const daysRemainingCard = daysRemainingEl.closest('.info-card');
        if (this.isGoalOverdue(goal)) {
            daysRemainingCard.classList.add('overdue');
        } else {
            daysRemainingCard.classList.remove('overdue');
        }

        // Update daily goal section
        const dailyGoalEl = document.querySelector('.daily-goal');
        const dailyGoal = this.calculateDailyGoal(goal);
        
        if (isCompleted) {
            dailyGoalEl.classList.add('completed');
        } else {
            dailyGoalEl.classList.remove('completed');
        }
        
        document.getElementById('daily-goal-pages').textContent = dailyGoal;
        document.querySelector('.daily-goal-subtitle').textContent = 'pages per day';

        // Update today's target section
        if (isCompleted) {
            document.getElementById('today-target-page').textContent = '✓';
            document.querySelector('.target-subtitle').textContent = 'goal completed';
            
            const progressMessageEl = document.getElementById('target-progress-message');
            progressMessageEl.textContent = 'You\'ve successfully completed this reading goal! 📚';
            progressMessageEl.className = 'target-progress-message on-track';
        } else {
            // Update today's target
            const todaysTarget = this.getTodaysTargetPage(goal);
            document.getElementById('today-target-page').textContent = todaysTarget;
            document.querySelector('.target-subtitle').textContent = 'target for today';

            // Update target progress message
            const progressStatus = this.getTodaysProgressStatus(goal);
            const progressMessageEl = document.getElementById('target-progress-message');
            progressMessageEl.textContent = progressStatus.message;
            progressMessageEl.className = `target-progress-message ${progressStatus.status}`;
        }

        // Update progress bar
        const progress = this.getProgress(goal);
        const progressFillEl = document.getElementById('progress-fill');
        progressFillEl.style.width = `${progress}%`;
        
        if (isCompleted) {
            progressFillEl.classList.add('completed');
        } else {
            progressFillEl.classList.remove('completed');
        }
        
        document.getElementById('progress-text').textContent = `${progress}% complete`;

        // Set placeholder for update input
        if (!isCompleted) {
            document.getElementById('new-current-page').placeholder = `Current: ${goal.currentPage}`;
            document.getElementById('new-current-page').min = 0;
            document.getElementById('new-current-page').max = goal.targetPage;
        }
    }

    updateDisplay() {
        // Always update the goals list
        this.renderGoalsList();
        
        // Update bulk delete UI
        const bulkDeleteBtn = document.getElementById('bulk-delete-toggle');
        const bulkActions = document.getElementById('bulk-actions');
        const selectAllCheckbox = document.getElementById('select-all-goals');
        
        if (this.goals.length > 0) {
            bulkDeleteBtn.classList.remove('hidden');
        } else {
            bulkDeleteBtn.classList.add('hidden');
        }
        
        if (this.bulkDeleteMode) {
            bulkActions.classList.remove('hidden');
            bulkDeleteBtn.textContent = 'Cancel';
            
            // Update select all checkbox
            const allSelected = this.goals.length > 0 && this.selectedGoalIds.size === this.goals.length;
            const someSelected = this.selectedGoalIds.size > 0;
            selectAllCheckbox.checked = allSelected;
            selectAllCheckbox.indeterminate = someSelected && !allSelected;
        } else {
            bulkActions.classList.add('hidden');
            bulkDeleteBtn.textContent = 'Select Goals';
        }
        
        // Update goal dashboard if it's currently shown
        if (this.currentGoalId && !document.getElementById('goal-dashboard').classList.contains('hidden')) {
            this.updateGoalDashboard();
        }
    }

    saveGoals() {
        localStorage.setItem('readingGoals', JSON.stringify(this.goals));
    }

    loadGoals() {
        const savedGoals = localStorage.getItem('readingGoals');
        if (savedGoals) {
            try {
                this.goals = JSON.parse(savedGoals);
                // Ensure all goals have IDs (for backward compatibility)
                this.goals.forEach(goal => {
                    if (!goal.id) {
                        goal.id = this.generateId();
                    }
                });
            } catch (e) {
                console.error('Error loading goals:', e);
                this.goals = [];
            }
        }
        
        // Migration: Load old single goal format
        const oldGoal = localStorage.getItem('readingGoal');
        if (oldGoal && this.goals.length === 0) {
            try {
                const goal = JSON.parse(oldGoal);
                goal.id = this.generateId();
                this.goals = [goal];
                this.saveGoals();
                localStorage.removeItem('readingGoal');
            } catch (e) {
                console.error('Error migrating old goal:', e);
            }
        }
    }
}

// Initialize the app when DOM is loaded
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new ReadingGoalTracker();
});
