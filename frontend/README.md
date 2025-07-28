# Income Conductor Automation Frontend

A modern Next.js interface for automating Income Conductor financial planning workflows. This application provides real-time monitoring and control of browser automation tasks with a clean, responsive UI.

## 🚀 Features

- **Real-time Progress Tracking**: Live updates via Socket.IO showing automation progress
- **Modern UI**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Connection Management**: Automatic connection status monitoring and reconnection
- **Data Extraction Display**: Visual presentation of extracted financial data
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Error Handling**: Comprehensive error reporting and recovery options

## 📋 Prerequisites

Before running this application, ensure you have:

- Node.js 18.x or higher
- npm or yarn package manager
- The automation server running (see `automation.js` and `server.js`)

## 🛠️ Installation

1. **Clone or create the project directory:**

   ```bash
   mkdir income-conductor-frontend
   cd income-conductor-frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` if your automation server runs on a different port:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```

## 🚀 Getting Started

1. **Start the automation server first:**

   ```bash
   # In your automation project directory
   node server.js
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main dashboard page
├── components/            # React components
│   ├── AutomationForm.tsx # Control form for starting automation
│   ├── ProgressTracker.tsx# Real-time progress display
│   ├── ResultsDisplay.tsx # Results and extracted data
│   └── StatusIndicator.tsx# Connection status indicator
├── hooks/                 # Custom React hooks
│   └── useSocket.ts       # Socket.IO connection management
├── lib/                   # Utility libraries
│   └── api.ts            # API client for automation server
└── types/                 # TypeScript type definitions
    └── automation.ts      # Automation-related types
```

## 🔧 Configuration

### Environment Variables

| Variable                 | Description                    | Default                 |
| ------------------------ | ------------------------------ | ----------------------- |
| `NEXT_PUBLIC_API_URL`    | Automation server API endpoint | `http://localhost:3001` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO server endpoint      | `http://localhost:3001` |

### Automation Server

Ensure your automation server (`server.js`) is running with:

- Express server on port 3001
- Socket.IO enabled for real-time updates
- CORS configured to allow frontend connections

## 📚 Usage

1. **Connection Status**: Check the status indicator to ensure the frontend is connected to the automation server.

2. **Start Automation**:

   - Fill in the session description
   - Configure advanced settings if needed
   - Click "Start Automation"

3. **Monitor Progress**: Watch real-time updates in the progress tracker as the automation runs through its steps.

4. **View Results**: Once completed, view extracted data and session information in the results panel.

## 🎨 UI Components

### AutomationForm

- Form controls for starting/stopping automation
- Advanced configuration options
- Connection status warnings

### ProgressTracker

- Real-time step-by-step progress
- Color-coded status indicators
- Timestamp tracking
- Extracted data highlights

### StatusIndicator

- Connection status to automation server
- Current automation state
- Reconnection controls

### ResultsDisplay

- Extracted financial data visualization
- Session metadata
- Export and navigation options

## 🔍 API Integration

The frontend communicates with the automation server via:

- **REST API**: For starting automation and health checks
- **Socket.IO**: For real-time progress updates

### API Endpoints

- `POST /start-automation`: Start automation workflow
- `GET /health`: Check server status

### Socket Events

- `automation-progress`: Real-time progress updates
- `connect`/`disconnect`: Connection status

## 🎯 Key Features Explained

### Real-time Updates

The application uses Socket.IO to receive live updates from the automation server, showing:

- Current step being executed
- Progress messages
- Extracted financial data
- Error states

### Data Extraction

Automatically captures and displays:

- Investment amounts
- Plan values
- Session metadata
- Page information

### Error Handling

Comprehensive error management with:

- Connection failure detection
- Automation error reporting
- Recovery options
- User-friendly error messages

## 🛡️ Security Considerations

- Environment variables for configuration
- No sensitive data stored in frontend
- Secure Socket.IO connections
- CORS properly configured

## 📝 Development

### Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Code Quality

- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for consistent styling
- Modern React patterns with hooks

## 🚀 Deployment

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Start production server:**

   ```bash
   npm start
   ```

3. **Environment Setup:**
   - Configure production API URLs
   - Ensure automation server is accessible
   - Set up proper CORS policies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Connection Failed:**

- Ensure automation server is running on port 3001
- Check firewall settings
- Verify CORS configuration

**Automation Errors:**

- Check server logs for detailed error messages
- Ensure Chrome is installed and accessible
- Verify proxy settings if used

**UI Issues:**

- Clear browser cache
- Check console for JavaScript errors
- Ensure all dependencies are installed

### Support

For issues and support, please check:

1. Server logs for backend issues
2. Browser console for frontend errors
3. Network tab for connection problems
