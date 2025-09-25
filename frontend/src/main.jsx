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
import App from "./App";
import theme from "./theme";

// Create a default MUI theme to prevent SvgIcon errors
const muiTheme = createTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <ThemeProvider theme={muiTheme}>
        <App />
      </ThemeProvider>
    </ChakraProvider>
  </React.StrictMode>
);
