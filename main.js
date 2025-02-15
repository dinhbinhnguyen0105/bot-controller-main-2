const path = require("path");
const { app, BrowserWindow } = require("electron");
const { userAPIs } = require("./src/main/user/userAPIs");

const createMainWindow = () => {
    const window = new BrowserWindow({
        title: "Bot controller",
        width: 1200,
        height: 600,
        webPreferences: {
            preload: path.resolve(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            enableBlinkFeatures: false,
        },
    });
    window.loadURL("http://localhost:5173/");
    // window.loadFile(path.join(__dirname, "src", "renderer", "index.html"));
    return window;
}

app.whenReady().then(() => {
    createMainWindow();
    app.on("activate", () => (BrowserWindow.getAllWindows().length === 0 && createMainWindow()));
    app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());

    userAPIs();

});