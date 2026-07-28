import { createBrowserRouter } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { MainLayout } from "./components/Layout/MainLayout";
import HomePage from "./pages/HomePage";
import MissionPage from "./pages/MissionPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "missions", element: <MissionPage /> },
    ],
  },
]);
