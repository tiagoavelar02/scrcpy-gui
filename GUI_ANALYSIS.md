# ScrcpyGUI v3 - Repository Analysis

This document provides an overview of the ScrcpyGUI v3 repository, its graphical user interface (GUI) components, code structure, and development workflow.

## 1. How the Repo Works

The application is built using a modern desktop application framework:

*   **Backend (Rust + Tauri v2):** Handles the core OS integrations, executing `scrcpy` and `adb` commands, file system access, and system tray/window management. The source code for this is located in the `src-tauri` directory.
*   **Frontend (React 19 + TypeScript + Vite):** Provides the interactive user interface. It communicates with the Rust backend via Tauri's IPC (Inter-Process Communication). The source code is in the `src` directory.
*   **Styling (Tailwind CSS v4):** Used for utility-first styling, enabling custom themes through CSS variables defined in `src/index.css`.
*   **Icons (Lucide React):** Used extensively throughout the UI for clean, consistent iconography.

## 2. What We See When Opening the GUI

When launching the ScrcpyGUI application (`src/App.tsx`), the user is presented with a premium, multi-panel interface designed to control Android devices via `scrcpy`. The main components visible are:

*   **Splash Screen:** A zero-flicker themed startup experience (handled via Tauri).
*   **Header (`src/components/Header.tsx`):** Contains the application title, theme selection (Ultraviolet, Astro, Carbon, Emerald, Bloodmoon), settings for custom Scrcpy binary paths, and a setup guide.
*   **Sidebar (`src/components/Sidebar.tsx`):** The device management hub. It allows users to:
    *   Switch between USB and Wireless tabs.
    *   Refresh connected devices or kill the ADB server.
    *   Pair and connect to wireless devices.
    *   Toggle auto-connect.
    *   View device connection history.
*   **Control Panel (`src/components/ControlPanel/ControlPanel.tsx`):** The primary area for configuring `scrcpy` options before launching a session. It includes:
    *   **Modes:** Standard Mirroring, Camera Mode (webcam), Desktop Mode.
    *   **Display Settings:** Resolution, Max FPS, Bitrate sliders.
    *   **Render & Codec:** Select specific video/audio codecs and render drivers (OpenGL, Direct3D, etc.).
    *   **Input Settings:** Enable/disable HID Keyboard (OTG) and HID Mouse.
    *   **Action Buttons:** Large primary "Start Session" and "Stop" buttons.
*   **Log Panel (`src/components/LogPanel.tsx`):** A real-time console output displaying logs from `scrcpy` and `adb` commands, useful for debugging.
*   **Session Behavior (`src/components/SessionBehavior.tsx`):** Additional toggles for session features like "Stay Awake", "Turn Screen Off", "Forward Audio", and recording paths.
*   **Shortcuts Panel (`src/components/ShortcutsPanel.tsx`):** A quick-reference grid of keyboard shortcuts (e.g., Alt+F for Fullscreen, Alt+H for Home).
*   **Footer (`src/components/Footer.tsx`):** Displays the app version and other minor metadata.

## 3. Code Structure

The repository follows a standard Tauri + Vite structure:

*   **`src/`**: Contains all frontend code.
    *   **`App.tsx`**: The main root component that orchestrates state (via `useScrcpy` hook) and lays out the main UI components.
    *   **`index.css`**: Global styles and theme definitions.
    *   **`hooks/`**: Custom React hooks (e.g., `useScrcpy.ts` which acts as the main controller for device interactions and state).
    *   **`components/`**: Modular UI components (Header, Sidebar, ControlPanel, etc.).
*   **`src-tauri/`**: Contains the Rust backend.
    *   **`src/main.rs`** (and related files): The entry point for the Tauri application, handling system commands and backend logic.
    *   **`tauri.conf.json`**: The central configuration file for Tauri (window settings, build commands, bundle info).
*   **`package.json`**: Node.js dependencies and script definitions.

## 4. Development Workflow (Live Reloading)

To make changes to the frontend (React/Tailwind) and see them automatically without having to rebuild the `.exe` (or equivalent executable) every time, you use the Tauri development server. This utilizes Vite's Hot Module Replacement (HMR).

### Prerequisites
Make sure you have run `npm install` to install all dependencies.

### Command to run

Run the following command in the root of the repository:

```bash
npm run tauri dev
```

### How it works:
1. This command starts the Vite development server (usually on `http://localhost:1420`).
2. It then compiles the Rust backend (if there are changes) and launches the Tauri desktop window.
3. The Tauri window loads the frontend from the local Vite server.
4. **Live Reload:** Whenever you save a file in the `src/` directory (e.g., a `.tsx` or `.css` file), Vite automatically updates the UI in the running Tauri window almost instantly, without needing to restart the app or rebuild the binary.

*(Note: If you make changes to the Rust code in `src-tauri/`, the process will automatically recompile the backend and restart the application).*
