// import { StrictMode } from 'react';
// import { createRoot } from 'react-dom/client';
// import './index.css';
// import App from './App.jsx';

// // Create root and render app
// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// );

import './index.css';
import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import theme from "./theme";
import { AuthProvider } from "./contexts/AuthContext"; //  Import AuthProvider
import { CameraProvider } from "./contexts/CameraContext"; //  Optional (if used)

// Create a default MUI theme to prevent SvgIcon errors
const muiTheme = createTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider> {/* ✅ Provide authentication context to the whole app */}
      <CameraProvider> {/* ✅ If you're using camera context */}
        <BrowserRouter> {/* ✅ Required for routing (ProtectedRoute uses Navigate) */}
          <ChakraProvider theme={theme}>
            <ThemeProvider theme={muiTheme}>
              <App />
            </ThemeProvider>
          </ChakraProvider>
        </BrowserRouter>
      </CameraProvider>
    </AuthProvider>
  </React.StrictMode>
);
