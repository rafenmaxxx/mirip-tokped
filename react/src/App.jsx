import { Routes, Route } from "react-router-dom";
import Chat from "./chat/App.jsx";
import Admin from "./admin/App.jsx";
import Auction from "./auction/App.jsx";
import Check from "./check/App.jsx";
import AdminLogin from "./admin-login/App.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/chat" element={<Chat />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/auction" element={<Auction />} />
      <Route path="/check" element={<Check />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Optional: default home */}
      <Route path="/" element={<h1>Welcome</h1>} />
    </Routes>
  );
}
