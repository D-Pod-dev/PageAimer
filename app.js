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

        // Update debug info if panel exists
        if (document.getElementById('debug-panel')) {
            this.updateDebugInfo();
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

    showDebugPanel() {
        // Create debug panel if it doesn't exist
        if (!document.getElementById('debug-panel')) {
            this.createDebugPanel();
        }
        
        // Show the debug panel
        const debugPanel = document.getElementById('debug-panel');
        debugPanel.classList.remove('hidden');
        debugPanel.classList.add('debug-panel-visible');
        
        // Update debug info
        this.updateDebugInfo();
    }

    createDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.className = 'debug-panel hidden';
        const initialCacheStatus = this.goals.length === 0 ? 'EMPTY' : 'ACTIVE';
        debugPanel.innerHTML = `
            <div class="debug-header">
                <span class="debug-title">DEBUG CONSOLE</span>
                <button class="debug-toggle" onclick="tracker.toggleDebugPanel()">−</button>
            </div>
            <div class="debug-content">
                <div class="debug-info">
                    <div class="debug-line">System Status: <span class="debug-value">ACTIVE</span></div>
                    <div class="debug-line">Current Date: <span id="debug-current-date" class="debug-value"></span></div>
                    <div class="debug-line">Debug Date: <span id="debug-debug-date" class="debug-value">NULL</span></div>
                    <div class="debug-line">Total Goals: <span id="debug-goal-count" class="debug-value">0</span></div>
                    <div class="debug-line">Cache Status: <span id="debug-cache-status" class="debug-value">${initialCacheStatus}</span></div>
                </div>
                <div class="debug-controls">
                    <div class="debug-input-group">
                        <label>Set Debug Date:</label>
                        <input type="date" id="debug-date-input" class="debug-input">
                        <button onclick="tracker.setDebugDateFromPanel()" class="debug-btn">SET</button>
                    </div>
                    <button onclick="tracker.resetDebugDate()" class="debug-btn debug-btn-reset">RESET DATE</button>
                    <button onclick="tracker.showCacheWipeConfirmation()" class="debug-btn debug-btn-danger">CACHE WIPE</button>
                </div>
            </div>
        `;
        document.body.appendChild(debugPanel);
    }

    toggleDebugPanel() {
        const debugPanel = document.getElementById('debug-panel');
        const content = debugPanel.querySelector('.debug-content');
        const toggle = debugPanel.querySelector('.debug-toggle');
        
        if (content.classList.contains('collapsed')) {
            // Expanding
            content.classList.remove('collapsed');
            content.classList.add('expanding');
            toggle.textContent = '−';
            
            // Remove expanding class after animation
            setTimeout(() => {
                content.classList.remove('expanding');
            }, 300);
        } else {
            // Collapsing
            content.classList.add('collapsing');
            toggle.textContent = '+';
            
            // Add collapsed class after animation
            setTimeout(() => {
                content.classList.remove('collapsing');
                content.classList.add('collapsed');
            }, 300);
        }
    }

    setDebugDateFromPanel() {
        const dateInput = document.getElementById('debug-date-input');
        if (dateInput.value) {
            this.setDebugDate(dateInput.value);
            this.updateDebugInfo();
        }
    }

    resetDebugDate() {
        this.setDebugDate(null);
        document.getElementById('debug-date-input').value = '';
        this.updateDebugInfo();
    }

    showCacheWipeConfirmation() {
        // Create Matrix-style confirmation dialog
        const cacheStatus = this.goals.length === 0 ? 'EMPTY' : 'ACTIVE';
        const overlay = document.createElement('div');
        overlay.className = 'matrix-confirmation-overlay';
        overlay.innerHTML = `
            <div class="matrix-confirmation-dialog">
                <div class="matrix-header">
                    <span class="matrix-title">SYSTEM WARNING</span>
                </div>
                <div class="matrix-content">
                    <div class="matrix-warning-line">ATTENTION: CRITICAL OPERATION DETECTED</div>
                    <div class="matrix-warning-line">ALL READING GOALS WILL BE PERMANENTLY DELETED</div>
                    <div class="matrix-warning-line">THIS ACTION CANNOT BE UNDONE</div>
                    <div class="matrix-stats">
                        <div class="matrix-stat">GOALS TO DELETE: <span class="matrix-value">${this.goals.length}</span></div>
                        <div class="matrix-stat">CACHE STATUS: <span class="matrix-value">${cacheStatus}</span></div>
                    </div>
                    <div class="matrix-question">PROCEED WITH CACHE WIPE?</div>
                </div>
                <div class="matrix-controls">
                    <button class="matrix-btn matrix-btn-abort" onclick="tracker.cancelCacheWipe()">ABORT</button>
                    <button class="matrix-btn matrix-btn-execute" onclick="tracker.executeCacheWipe()">EXECUTE</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Animate dialog appearance
        setTimeout(() => {
            overlay.classList.add('matrix-confirmation-visible');
        }, 10);
    }

    cancelCacheWipe() {
        const overlay = document.querySelector('.matrix-confirmation-overlay');
        if (overlay) {
            overlay.classList.remove('matrix-confirmation-visible');
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 300);
        }
    }

    executeCacheWipe() {
        // Clear all goals
        this.goals = [];
        this.currentGoalId = null;
        this.editingGoalId = null;
        this.selectedGoalIds.clear();
        this.bulkDeleteMode = false;
        
        // Clear localStorage
        localStorage.removeItem('readingGoals');
        localStorage.removeItem('readingGoal'); // Also remove old format if it exists
        
        // Update display
        this.updateDisplay();
        this.updateDebugInfo();
        
        // Hide goal dashboard if visible
        document.getElementById('goal-dashboard').classList.add('hidden');
        
        // Show success message
        this.showCacheWipeSuccess();
        
        // Close confirmation dialog
        this.cancelCacheWipe();
    }

    showCacheWipeSuccess() {
        const overlay = document.createElement('div');
        overlay.className = 'matrix-success-overlay';
        overlay.innerHTML = `
            <div class="matrix-success-dialog">
                <div class="matrix-success-header">
                    <span class="matrix-success-title">OPERATION COMPLETE</span>
                </div>
                <div class="matrix-success-content">
                    <div class="matrix-success-line">CACHE SUCCESSFULLY WIPED</div>
                    <div class="matrix-success-line">ALL GOALS REMOVED FROM MEMORY</div>
                    <div class="matrix-success-line">SYSTEM READY FOR NEW DATA</div>
                </div>
                <div class="matrix-success-controls">
                    <button class="matrix-btn matrix-btn-close" onclick="tracker.closeCacheWipeSuccess()">CLOSE</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Animate success dialog
        setTimeout(() => {
            overlay.classList.add('matrix-success-visible');
        }, 10);
    }

    closeCacheWipeSuccess() {
        const overlay = document.querySelector('.matrix-success-overlay');
        if (overlay) {
            overlay.classList.remove('matrix-success-visible');
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
            }, 300);
        }
    }

    updateDebugInfo() {
        const currentDateEl = document.getElementById('debug-current-date');
        const debugDateEl = document.getElementById('debug-debug-date');
        const goalCountEl = document.getElementById('debug-goal-count');
        const cacheStatusEl = document.getElementById('debug-cache-status');
        
        if (currentDateEl) {
            const currentDate = new Date();
            currentDateEl.textContent = currentDate.toISOString().split('T')[0];
        }
        
        if (debugDateEl) {
            debugDateEl.textContent = this.debugDate ? this.debugDate.toISOString().split('T')[0] : 'NULL';
        }
        
        if (goalCountEl) {
            goalCountEl.textContent = this.goals.length.toString();
        }

        if (cacheStatusEl) {
            // Show 'EMPTY' when there are no goals, otherwise show 'ACTIVE'
            cacheStatusEl.textContent = this.goals.length === 0 ? 'EMPTY' : 'ACTIVE';
        }
    }

    showFieldValidationErrors(targetPageEmpty, dueDateEmpty) {
        // Clear any existing validation errors first
        this.clearFieldValidationErrors();
        
        if (targetPageEmpty) {
            this.showFieldError('target-page', 'Target page is required');
        }
        
        if (dueDateEmpty) {
            this.showFieldError('due-date', 'Due date is required');
        }
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.form-group');
        
        // Add error styling
        field.classList.add('field-error');
        formGroup.classList.add('form-group-error');
        
        // Create and show tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'field-error-tooltip';
        tooltip.textContent = message;
        
        // Position tooltip above the field
        const rect = field.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.top - 35) + 'px';
        tooltip.style.zIndex = '10000';
        
        document.body.appendChild(tooltip);
        
        // Store reference for cleanup
        field.errorTooltip = tooltip;
        
        // Add event listener to clear error when user types/changes value
        const clearErrorOnInput = () => {
            this.clearFieldError(fieldId);
            field.removeEventListener('input', clearErrorOnInput);
            field.removeEventListener('change', clearErrorOnInput);
        };
        
        field.addEventListener('input', clearErrorOnInput);
        field.addEventListener('change', clearErrorOnInput);
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.form-group');
        
        if (field.classList.contains('field-error')) {
            field.classList.remove('field-error');
            formGroup.classList.remove('form-group-error');
            
            // Remove tooltip if exists
            if (field.errorTooltip) {
                field.errorTooltip.remove();
                delete field.errorTooltip;
            }
        }
    }

    clearFieldValidationErrors() {
        // Remove error classes
        document.querySelectorAll('.field-error').forEach(field => {
            field.classList.remove('field-error');
            // Remove tooltip if exists
            if (field.errorTooltip) {
                field.errorTooltip.remove();
                delete field.errorTooltip;
            }
        });
        
        document.querySelectorAll('.form-group-error').forEach(group => {
            group.classList.remove('form-group-error');
        });
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

        // Edit goal button
        document.getElementById('edit-goal-button').addEventListener('click', () => {
            if (this.currentGoalId) {
                this.showEditGoalSection(this.currentGoalId);
            }
        });

        // Bulk delete functionality
        document.getElementById('bulk-delete-toggle').addEventListener('click', () => {
            if (this.bulkDeleteMode) {
                this.exitBulkDeleteMode();
            } else {
                this.toggleBulkDeleteMode();
            }
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
            if (!e.target.closest('.goal-dropdown') && !e.target.closest('.goal-menu-btn')) {
                this.closeAllDropdowns();
            }
        });
        
        // Setup tooltip event listeners
        this.setupTooltipListeners();
    }

    setupTooltipListeners() {
        // Use event delegation for dynamic content
        document.addEventListener('mouseenter', (e) => {
            if (e.target && e.target.dataset && e.target.dataset.tooltip) {
                this.showTooltip(e.target, e.target.dataset.tooltip, e.target.dataset.goalId);
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            if (e.target && e.target.dataset && e.target.dataset.tooltip) {
                this.hideTooltip(e.target);
            }
        }, true);
    }

    showTooltip(element, type, goalId = null) {
        let tooltipElement, goal, message;
        
        // Determine if this is a goal progress bar or main dashboard progress bar
        if (goalId) {
            // Goal progress bar tooltip
            goal = this.goals.find(g => g.id === goalId);
            tooltipElement = element.parentElement.querySelector('.goal-progress-tooltip');
        } else {
            // Main dashboard progress bar tooltip
            goal = this.goals.find(g => g.id === this.currentGoalId);
            tooltipElement = document.getElementById('progress-tooltip');
        }
        
        if (!goal || !tooltipElement) return;
        
        // Set tooltip message based on type
        if (type === 'current-progress') {
            const todaysTarget = this.getTodaysTargetPage(goal);
            if (goal.currentPage >= todaysTarget) {
                // When at or ahead of target, blue bar shows target
                message = `Today's target page: ${todaysTarget}`;
            } else {
                // When behind target, blue bar shows current progress
                message = `Current page: ${goal.currentPage}`;
            }
        } else if (type === 'today-target') {
            const todaysTarget = this.getTodaysTargetPage(goal);
            message = `Today's target page: ${todaysTarget}`;
        } else if (type === 'ahead-progress') {
            const todaysTarget = this.getTodaysTargetPage(goal);
            const aheadPages = Math.max(0, goal.currentPage - todaysTarget);
            if (aheadPages > 0) {
                message = `${aheadPages} page${aheadPages === 1 ? '' : 's'} ahead of today's target`;
            } else {
                message = '';
            }
        }
        
        if (message) {
            tooltipElement.textContent = message;
            
            // Position tooltip at the rightmost point of the hovered element
            let tooltipPosition;
            
            if (type === 'ahead-progress') {
                // For ahead progress, position at the total progress (target + ahead)
                const leftMatch = element.style.left.match(/(\d+(?:\.\d+)?)%/);
                const widthMatch = element.style.width.match(/(\d+(?:\.\d+)?)%/);
                const leftPos = leftMatch ? parseFloat(leftMatch[1]) : 0;
                const aheadWidth = widthMatch ? parseFloat(widthMatch[1]) : 0;
                
                tooltipPosition = leftPos + aheadWidth;
            } else {
                // For other progress types, use the element's width directly
                const widthMatch = element.style.width.match(/(\d+(?:\.\d+)?)%/);
                tooltipPosition = widthMatch ? parseFloat(widthMatch[1]) : 0;
            }
            
            // Calculate position as percentage of parent width
            tooltipElement.style.left = `${tooltipPosition}%`;
            tooltipElement.classList.add('show');
        }
    }
    
    hideTooltip(element) {
        const goalId = element.dataset.goalId;
        let tooltipElement;
        
        if (goalId) {
            // Goal progress bar tooltip
            tooltipElement = element.parentElement.querySelector('.goal-progress-tooltip');
        } else {
            // Main dashboard progress bar tooltip
            tooltipElement = document.getElementById('progress-tooltip');
        }
        
        if (tooltipElement) {
            tooltipElement.classList.remove('show');
        }
    }

    showAllGoalsSection() {
        // Clear any field validation errors before switching views
        this.clearFieldValidationErrors();

        this.hideAllSections();
        document.getElementById('all-goals-section').classList.remove('hidden');
        this.exitBulkDeleteMode();
        this.updateDisplay();
    }

    showCreateGoalSection() {
        // Clear any field validation errors when opening the create form
        this.clearFieldValidationErrors();

        this.hideAllSections();
        document.getElementById('create-goal-section').classList.remove('hidden');
        document.getElementById('goal-form').reset();
    }

    showEditGoalSection(goalId) {
        // Clear any field validation errors when opening the edit form
        this.clearFieldValidationErrors();

        this.hideAllSections();
        this.editingGoalId = goalId;
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            // Set current values as placeholders instead of filling the fields
            const bookTitleField = document.getElementById('edit-book-title');
            const targetPageField = document.getElementById('edit-target-page');
            const currentPageField = document.getElementById('edit-current-page');
            const dueDateField = document.getElementById('edit-due-date');
            
            bookTitleField.value = '';
            bookTitleField.placeholder = goal.bookTitle === 'Your Book' ? 'Enter book title' : goal.bookTitle;
            
            targetPageField.value = '';
            targetPageField.placeholder = goal.targetPage.toString();
            
            currentPageField.value = '';
            currentPageField.placeholder = goal.currentPage.toString();
            
            dueDateField.value = goal.dueDate;
            dueDateField.placeholder = '';
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
        
        // Check for debug trigger first, before any validation
        if (bookTitle === '//tracker.debug()') {
            this.showDebugPanel();
            // Clear the form
            document.getElementById('goal-form').reset();
            // Return to goals menu
            this.showAllGoalsSection();
            return;
        }
        
        const targetPage = parseInt(document.getElementById('target-page').value);
        const currentPage = parseInt(document.getElementById('current-page').value) || 0;
        const dueDate = document.getElementById('due-date').value;

        // Validation
        if (!targetPage || !dueDate) {
            this.showFieldValidationErrors(!targetPage, !dueDate);
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
        
        // Update debug info if panel exists
        if (document.getElementById('debug-panel')) {
            this.updateDebugInfo();
        }
    }

    updateGoal() {
        const goalIndex = this.goals.findIndex(g => g.id === this.editingGoalId);
        if (goalIndex === -1) return;

        const goal = this.goals[goalIndex];
        
        // Get values, defaulting to current values if fields are empty
        const bookTitle = document.getElementById('edit-book-title').value || goal.bookTitle;
        const targetPageInput = document.getElementById('edit-target-page').value;
        const targetPage = targetPageInput ? parseInt(targetPageInput) : goal.targetPage;
        const currentPageInput = document.getElementById('edit-current-page').value;
        const currentPage = currentPageInput !== '' ? parseInt(currentPageInput) : goal.currentPage;
        const dueDate = document.getElementById('edit-due-date').value || goal.dueDate;

        // Validation
        if (currentPage >= targetPage) {
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
        goal.currentPage = currentPage;
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
            
            // Update debug info if panel exists
            if (document.getElementById('debug-panel')) {
                this.updateDebugInfo();
            }
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
        return dueDate < today && !this.isGoalCompleted(goal);
    }

    isGoalDueToday(goal) {
        const today = this.getCurrentDate();
        const dueDate = new Date(goal.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime() && !this.isGoalCompleted(goal);
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
            
            // Update debug info if panel exists
            if (document.getElementById('debug-panel')) {
                this.updateDebugInfo();
            }
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
            const existingGoals = goalsListEl.querySelectorAll('.goal-item, .completed-goals-section');
            existingGoals.forEach(item => item.remove());
            return;
        }
        
        noGoalsEl.classList.add('hidden');
        
        // Clear existing goals and sections
        const existingGoals = goalsListEl.querySelectorAll('.goal-item, .completed-goals-section');
        existingGoals.forEach(item => item.remove());
        
        // Separate active goals from completed goals
        const activeGoals = [];
        const completedGoals = [];
        
        this.goals.forEach(goal => {
            const isCompleted = this.isGoalCompleted(goal);
            
            // Only actually completed goals go to the completed section
            if (isCompleted) {
                completedGoals.push(goal);
            } else {
                activeGoals.push(goal);
            }
        });
        
        // Sort active goals by due date (earliest first)
        const sortedActiveGoals = activeGoals.sort((a, b) => {
            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);
            return dateA - dateB;
        });
        
        // Sort completed goals by due date (earliest first)
        const sortedCompletedGoals = completedGoals.sort((a, b) => {
            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);
            return dateA - dateB;
        });
        
        // Render active goals
        sortedActiveGoals.forEach(goal => {
            const goalEl = this.createGoalElement(goal);
            goalsListEl.appendChild(goalEl);
        });
        
        // Render completed goals section if there are any completed/overdue goals
        if (sortedCompletedGoals.length > 0) {
            // Create completed goals section
            const completedSection = document.createElement('div');
            completedSection.className = 'completed-goals-section';
            
            // Add separator line and header
            const separator = document.createElement('hr');
            separator.className = 'completed-goals-separator';
            completedSection.appendChild(separator);
            
            const header = document.createElement('h3');
            header.className = 'completed-goals-header';
            header.textContent = 'Completed Goals';
            completedSection.appendChild(header);
            
            // Add completed goals
            sortedCompletedGoals.forEach(goal => {
                const goalEl = this.createGoalElement(goal);
                completedSection.appendChild(goalEl);
            });
            
            goalsListEl.appendChild(completedSection);
        }
    }

    createGoalElement(goal) {
        const progress = this.getProgress(goal);
        const todaysTargetPage = this.getTodaysTargetPage(goal);
        const todaysTargetProgress = Math.min(Math.round((todaysTargetPage / goal.targetPage) * 100), 100);
        const daysRemaining = this.getDaysRemaining(goal);
        const dailyGoal = this.calculateDailyGoal(goal);
        const isCompleted = this.isGoalCompleted(goal);
        const isOverdue = this.isGoalOverdue(goal);
        const isDueToday = this.isGoalDueToday(goal);
        
        // Calculate ahead amount and base progress
        const aheadAmount = Math.max(0, progress - todaysTargetProgress);
        const baseProgress = Math.min(progress, todaysTargetProgress);
        
        // Set gradient for goal progress ahead fill
        let gradientStyle = 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)';
        if (progress > 0) {
            const gradientStart = (todaysTargetProgress / progress) * 100;
            gradientStyle = `linear-gradient(90deg, #FFD700 0%, #FFD700 ${gradientStart}%, #FFA500 100%)`;
        }
        
        let goalClasses = `goal-item ${this.selectedGoalIds.has(goal.id) ? 'selected' : ''}`;
        if (isCompleted) {
            goalClasses += ' completed';
        } else if (isOverdue || isDueToday) {
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
                    <div class="goal-progress-target-fill" style="width: ${todaysTargetProgress}%" data-tooltip="today-target" data-goal-id="${goal.id}"></div>
                    <div class="goal-progress-ahead-fill" style="width: ${progress}%; left: 0%; background: ${gradientStyle}" data-tooltip="ahead-progress" data-goal-id="${goal.id}"></div>
                    <div class="goal-progress-fill" style="width: ${baseProgress}%" data-tooltip="current-progress" data-goal-id="${goal.id}"></div>
                    <div class="goal-progress-tooltip"></div>
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
        
        // Add unified click handler that checks current mode
        goalEl.addEventListener('click', (e) => {
            if (!e.target.closest('.goal-item-actions')) {
                if (this.bulkDeleteMode) {
                    this.toggleGoalSelection(goal.id);
                } else {
                    this.showGoalDashboard(goal.id);
                }
            }
        });
        
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
        const todaysTargetPage = this.getTodaysTargetPage(goal);
        const todaysTargetProgress = Math.min(Math.round((todaysTargetPage / goal.targetPage) * 100), 100);
        
        const progressFillEl = document.getElementById('progress-fill');
        const progressTargetFillEl = document.getElementById('progress-target-fill');
        const progressAheadFillEl = document.getElementById('progress-ahead-fill');
        
        // Remove any existing data attributes and add fresh ones
        progressFillEl.removeAttribute('data-goal-id');
        progressTargetFillEl.removeAttribute('data-goal-id');
        progressAheadFillEl.removeAttribute('data-goal-id');
        
        // Calculate ahead amount
        const aheadAmount = Math.max(0, progress - todaysTargetProgress);
        const baseProgress = Math.min(progress, todaysTargetProgress);
        
        // Blue shows actual current progress
        progressFillEl.style.width = `${baseProgress}%`;
        progressTargetFillEl.style.width = `${todaysTargetProgress}%`;
        
        // Gold starts from beginning and shows full progress with dynamic gradient
        progressAheadFillEl.style.width = `${progress}%`;
        progressAheadFillEl.style.left = `0%`;
        
        // Set gradient so light color is behind blue, transition starts where blue ends
        if (progress > 0) {
            const gradientStart = (todaysTargetProgress / progress) * 100;
            progressAheadFillEl.style.background = `linear-gradient(90deg, #FFD700 0%, #FFD700 ${gradientStart}%, #FFA500 100%)`;
        } else {
            progressAheadFillEl.style.background = 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)';
        }
        
        if (isCompleted) {
            progressFillEl.classList.add('completed');
            progressTargetFillEl.classList.add('completed');
        } else {
            progressFillEl.classList.remove('completed');
            progressTargetFillEl.classList.remove('completed');
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
            bulkDeleteBtn.textContent = 'Delete Goals';
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
