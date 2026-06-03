import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthContext";
import "./styles.css";

const container = document.getElementById("canvas");
if (!container) throw new Error("#canvas mount point not found");

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
