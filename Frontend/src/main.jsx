import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./App.css"

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
);

// Register PWA service worker for mobile installability and offline support
if ("serviceWorker" in navigator && !window.location.host.includes("localhost:5173")) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").catch((err) => {
            console.log("Service Worker registration notice:", err);
        });
    });
}
