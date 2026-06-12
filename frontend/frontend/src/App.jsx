import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Drivers from "./components/Drivers";
import { useState } from "react";
import Trash from "./components/Trash";
import { Toaster } from "react-hot-toast";
import DriverDetails from "./components/DriverDetails";
import { SocketProvider } from "./context/SocketContext";

function App() {
  const [token, setToken] = useState(localStorage.getItem("accessToken"));

  return (
    <BrowserRouter>
      <SocketProvider>
        <Toaster position="top-right" />

        <Routes>
          <Route path="/login" element={<Login setToken={setToken} />} />

          <Route
            path="/drivers"
            element={token ? <Drivers /> : <Navigate to="/login" />}
          />
          <Route path="/drivers/:id" element={<DriverDetails />} />

          <Route
            path="/trash"
            element={token ? <Trash /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
