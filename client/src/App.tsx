import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth, RedirectIfAuthed } from "@/components/RequireAuth";
import { Landing } from "@/pages/Landing";
import { SignIn } from "@/pages/SignIn";
import { SignUp } from "@/pages/SignUp";
import { Swipe } from "@/pages/Swipe";
import { Matches } from "@/pages/Matches";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RedirectIfAuthed>
              <Landing />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/signin"
          element={
            <RedirectIfAuthed>
              <SignIn />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/signup"
          element={
            <RedirectIfAuthed>
              <SignUp />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/swipe"
          element={
            <RequireAuth>
              <Swipe />
            </RequireAuth>
          }
        />
        <Route
          path="/matches"
          element={
            <RequireAuth>
              <Matches />
            </RequireAuth>
          }
        />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
