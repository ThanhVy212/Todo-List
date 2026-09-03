import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/toast";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFoundPage";
import { AuthProvider } from "./context/AuthContext";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Toaster>
        {null}
      </Toaster>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
