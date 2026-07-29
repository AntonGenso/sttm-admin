import { NavLink, Outlet } from "react-router-dom";

export const MainLayout = () => {
  return (
    <div className="w-full min-h-screen h-full bg-black">
      <header>
        <nav>
          <NavLink to={"/"}>Home</NavLink>
          <NavLink to={"/missions"}>Missions</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer></footer>
    </div>
  );
};
