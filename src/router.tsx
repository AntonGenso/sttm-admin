import { createBrowserRouter } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { MainLayout } from "./components/Layout/MainLayout";
import HomePage from "./pages/HomePage";
import MissionPage from "./pages/MissionPage";
import ClassPage from "./pages/ClassPage";
import StudentPage from "./pages/StudentPage";
import RegisterPage from "./pages/RegisterPage";
import PrivatRouter from "./components/PrivatRouter/PrivatRouter";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/signin", element: <RegisterPage /> },
  {
    element: <PrivatRouter />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "missions", element: <MissionPage /> },
          { path: "classes/:id", element: <ClassPage /> },
          { path: "classes/:id/students/:studentId", element: <StudentPage /> },
        ],
      },
    ],
  },
]);
