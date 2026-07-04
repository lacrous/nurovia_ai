import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

function App() {
  return (
    <div style={{ minHeight: "100vh", padding: 40, color: "white", background: "#0a0a0c", fontFamily: "system-ui" }}>
      <h1 style={{ color: "#D4AF37", fontSize: 32 }}>Hello from Nurovia</h1>
      <p style={{ color: "rgba(255,255,255,0.75)", marginTop: 12 }}>
        This is a stripped-down test page. If you can see this, React is mounting correctly.
      </p>
      <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 24, fontSize: 12 }}>
        Time: {new Date().toLocaleString()}
      </p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);