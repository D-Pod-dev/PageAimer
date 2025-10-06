// Reading Goal Tracker Application

class ReadingGoalTracker {
    constructor() {
        this.goal = null;
        this.init();
    }

    init() {
        this.loadGoal();
        this.setupEventListeners();
        this.updateDisplay();
        this.setMinDate();
    }

    setMinDate() {
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('due-date').min = today;
    }

    setupEventListeners() {
        // Goal creation form
        document.getElementById('goal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createGoal();
        });

        // Progress update form
        document.getElementById('update-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProgress();
        });

        // Reset goal button
        document.getElementById('reset-goal').addEventListener('click', () => {
            if (confirm('Are you sure you want to create a new goal? This will delete your current progress.')) {
                this.resetGoal();
            }
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

        const dueDateObj = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDateObj.setHours(0, 0, 0, 0);

        if (dueDateObj <= today) {
            alert('Due date must be in the future.');
            return;
        }

        this.goal = {
            bookTitle: bookTitle || 'Your Book',
            targetPage: targetPage,
            currentPage: currentPage,
            dueDate: dueDate,
            createdDate: new Date().toISOString()
        };

        this.saveGoal();
        this.updateDisplay();
        
        // Clear form
        document.getElementById('goal-form').reset();
    }

    updateProgress() {
        const newCurrentPage = parseInt(document.getElementById('new-current-page').value);

        if (!newCurrentPage && newCurrentPage !== 0) {
            alert('Please enter a valid page number.');
            return;
        }

        if (newCurrentPage < this.goal.currentPage) {
            if (!confirm('The new page number is less than your current page. Are you sure?')) {
                return;
            }
        }

        if (newCurrentPage > this.goal.targetPage) {
            alert('Congratulations! You\'ve completed your reading goal! 🎉');
            this.goal.currentPage = this.goal.targetPage;
        } else {
            this.goal.currentPage = newCurrentPage;
        }

        this.saveGoal();
        this.updateDisplay();
        
        // Clear form
        document.getElementById('update-form').reset();

        // Show congratulations if goal is reached
        if (this.goal.currentPage >= this.goal.targetPage) {
            setTimeout(() => {
                alert('🎉 Congratulations! You\'ve reached your reading goal! 🎉');
            }, 100);
        }
    }

    calculateDailyGoal() {
        if (!this.goal) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dueDate = new Date(this.goal.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const pagesRemaining = this.goal.targetPage - this.goal.currentPage;

        if (daysRemaining <= 0) {
            return pagesRemaining; // All pages need to be read today
        }

        if (pagesRemaining <= 0) {
            return 0; // Goal already completed
        }

        return Math.ceil(pagesRemaining / daysRemaining);
    }

    getDaysRemaining() {
        if (!this.goal) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dueDate = new Date(this.goal.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return Math.max(0, daysRemaining);
    }

    getProgress() {
        if (!this.goal) return 0;
        
        const totalPages = this.goal.targetPage;
        const pagesRead = this.goal.currentPage;
        
        return Math.round((pagesRead / totalPages) * 100);
    }

    updateDisplay() {
        const createSection = document.getElementById('create-goal-section');
        const dashboardSection = document.getElementById('goal-dashboard');

        if (this.goal) {
            // Show dashboard, hide create form
            createSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');

            // Update dashboard title
            const title = this.goal.bookTitle !== 'Your Book' 
                ? `Reading Goal: ${this.goal.bookTitle}` 
                : 'Your Reading Goal';
            document.getElementById('dashboard-title').textContent = title;

            // Update goal info
            document.getElementById('display-target-page').textContent = this.goal.targetPage;
            document.getElementById('display-current-page').textContent = this.goal.currentPage;
            
            const formattedDate = new Date(this.goal.dueDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            document.getElementById('display-due-date').textContent = formattedDate;
            
            const daysRemaining = this.getDaysRemaining();
            document.getElementById('display-days-remaining').textContent = daysRemaining;

            // Update daily goal
            const dailyGoal = this.calculateDailyGoal();
            document.getElementById('daily-goal-pages').textContent = dailyGoal;

            // Update progress bar
            const progress = this.getProgress();
            document.getElementById('progress-fill').style.width = `${progress}%`;
            document.getElementById('progress-text').textContent = `${progress}% complete`;

            // Set placeholder for update input
            document.getElementById('new-current-page').placeholder = `Current: ${this.goal.currentPage}`;
            document.getElementById('new-current-page').min = 0;
            document.getElementById('new-current-page').max = this.goal.targetPage;
        } else {
            // Show create form, hide dashboard
            createSection.classList.remove('hidden');
            dashboardSection.classList.add('hidden');
        }
    }

    saveGoal() {
        if (this.goal) {
            localStorage.setItem('readingGoal', JSON.stringify(this.goal));
        } else {
            localStorage.removeItem('readingGoal');
        }
    }

    loadGoal() {
        const savedGoal = localStorage.getItem('readingGoal');
        if (savedGoal) {
            try {
                this.goal = JSON.parse(savedGoal);
            } catch (e) {
                console.error('Error loading goal:', e);
                this.goal = null;
            }
        }
    }

    resetGoal() {
        this.goal = null;
        this.saveGoal();
        this.updateDisplay();
        this.setMinDate();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReadingGoalTracker();
});
