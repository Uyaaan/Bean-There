import { Routes, Route, NavLink, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import CafesList from "./pages/CafesList";
import CafeNew from "./pages/CafeNew";
import CafeDetail from "./pages/CafeDetail";
import CafeEdit from "./pages/CafeEdit";
import { useEffect } from "react";
import { supabase } from "./services/supabaseClient";


function Shell() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Responsive header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <NavLink to="/" className="font-extrabold text-2xl">
            <span className="text-emerald-600">Bean</span>{" "}
            <span className="text-emerald-700">There</span> ☕
          </NavLink>

          <nav className="flex items-center gap-3 text-sm">
            <NavLink
              to="/cafes"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg hover:bg-slate-100 ${
                  isActive ? "bg-slate-100 font-semibold" : ""
                }`
              }
            >
              Cafés
            </NavLink>
            <NavLink
              to="/cafes/new"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg hover:bg-emerald-50 ${
                  isActive ? "bg-emerald-100 font-semibold" : ""
                }`
              }
            >
              Add Café
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mt-10 border-t py-6 text-center text-xs text-slate-500">
        by Uyan and Myc!
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="cafes" element={<CafesList />} />
        <Route path="cafes/new" element={<CafeNew />} />
        <Route path="cafes/:id" element={<CafeDetail />} />
        <Route path="cafes/:id/edit" element={<CafeEdit />} />
      </Route>
    </Routes>
  );
}