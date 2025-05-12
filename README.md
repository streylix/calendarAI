# AI Calendar

A desktop calendar application with AI-powered scheduling capabilities, built with Electron and React.

## Features

- Month, week, and day calendar views
- Add events by selecting time slots
- Schedule events using natural language with AI assistance
- Local storage for event persistence

## Development Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```
git clone <repository-url>
cd ai-calendar
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

This will start both the React development server and the Electron application.

## Building for Production

To build the application for production:

```
npm run react-build
npm run build
```

This will create installable packages for Windows, macOS, and Linux in the `dist` directory.

## AI Integration

The current version includes a placeholder AI service that simulates natural language processing. To connect with a real AI service like OpenAI:

1. Obtain an API key from OpenAI
2. Update the AI service implementation in `src/utils/aiService.js`
3. Uncomment and modify the OpenAI API integration code

## Project Structure

- `main/` - Electron main process files
- `src/` - React application code
  - `components/` - UI components
  - `utils/` - Utility functions and services
- `public/` - Static assets

## License

[ISC](LICENSE) 