import { createBrowserRouter } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { MainLayout } from "./components/Layout/MainLayout";
import HomePage from "./pages/HomePage";
import MissionPage from "./pages/MissionPage";
import MissionDetailPage from "./pages/MissionDetailPage";
import TestPage from "./pages/TestPage";
import TestDetailPage from "./pages/TestDetailPage";
import StudentPage from "./pages/StudentPage";
import RegisterPage from "./pages/RegisterPage";
import PrivatRouter from "./components/PrivatRouter/PrivatRouter";
import AdminRouter from "./components/PrivatRouter/AdminRouter";
import ClassRoute from "./pages/ClassRoute";
import TeachersPage from "./pages/TeachersPage";
import TeacherDetailPage from "./pages/TeacherDetailPage";
import StudentsPage from "./pages/StudentsPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import ClassesPage from "./pages/ClassesPage";
import SchoolsPage from "./pages/SchoolsPage";
import SchoolDetailPage from "./pages/SchoolDetailPage";
import CitiesPage from "./pages/CitiesPage";
import CityDetailPage from "./pages/CityDetailPage";
import EnrollmentsPage from "./pages/EnrollmentsPage";

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
          { path: "missions/:id", element: <MissionDetailPage /> },
          { path: "tests", element: <TestPage /> },
          { path: "tests/:id", element: <TestDetailPage /> },
          // Resolves to the teacher's own class page or the academy-wide
          // admin one, depending on who is signed in.
          { path: "classes/:id", element: <ClassRoute /> },
          { path: "classes/:id/students/:studentId", element: <StudentPage /> },
          // The drill-downs of the admin dashboard tiles. `classes` here is
          // the academy-wide list; `classes/:id` above stays the
          // teacher-scoped view of one class.
          {
            element: <AdminRouter />,
            children: [
              { path: "teachers", element: <TeachersPage /> },
              { path: "teachers/:id", element: <TeacherDetailPage /> },
              { path: "students", element: <StudentsPage /> },
              { path: "students/:id", element: <StudentDetailPage /> },
              { path: "classes", element: <ClassesPage /> },
              { path: "schools", element: <SchoolsPage /> },
              { path: "schools/:id", element: <SchoolDetailPage /> },
              { path: "cities", element: <CitiesPage /> },
              { path: "cities/:id", element: <CityDetailPage /> },
              { path: "enrollments", element: <EnrollmentsPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
