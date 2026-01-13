import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="1068610814916-2r520mqs6d7bgprfj9q49hgjl8ftskip.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
