import React from "react";
import ReactDOM from "react-dom/client";
// Fonts bundled locally via fontsource — zero network requests, ever.
import "@fontsource-variable/baloo-2";
import "@fontsource-variable/nunito";
import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/*
 * PWA: register the local service worker in production builds so the whole
 * app shell (HTML/JS/CSS/fonts/icons/config) is cached for offline launch.
 */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* SW registration is best-effort; the app is fully functional without it */
    });
  });
}
