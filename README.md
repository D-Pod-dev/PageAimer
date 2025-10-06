# PageAimer
A web app that allows you to set a long-term reading goal and track your reading daily. The app automatically updates your daily reading goal so you can reach your goal by the due date.

## Features

- **Create Reading Goals**: Set a target page number, due date, and optionally your current page
- **Daily Goal Calculation**: Automatically calculates how many pages you need to read per day
- **Progress Tracking**: Update your current page after each reading session
- **Smart Recalculation**: Daily reading goal automatically adjusts based on remaining pages and days
- **Visual Progress**: View your reading progress with a progress bar and percentage
- **Local Storage**: Your reading goals are saved locally and persist across browser sessions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## How to Use

1. **Open the App**: Simply open `index.html` in your web browser
2. **Create a Goal**: 
   - Optionally enter a book title
   - Enter the target page number (required)
   - Optionally enter your current page (defaults to 0)
   - Select a due date (required)
   - Click "Create Goal"
3. **Track Your Progress**:
   - After each reading session, enter your new current page
   - Click "Update Progress"
   - The app will recalculate your daily reading goal automatically
4. **Start a New Goal**: Click "New Goal" to reset and create a new reading goal

## How It Works

The daily reading goal is calculated using the formula:
```
Daily Pages = (Target Page - Current Page) / Days Remaining
```

The calculation is updated every time you update your progress, ensuring you always know exactly how many pages to read per day to reach your goal on time.

## Technical Details

- Pure HTML, CSS, and JavaScript (no frameworks required)
- Uses localStorage for data persistence
- Fully responsive design with mobile-first approach
- No backend or server required - runs entirely in the browser
