import { NavLink, Outlet } from "react-router-dom";

export const MainLayout = () => {
  return (
    <>
      <header>
        <aside>
          <NavLink to={"/"}>Home</NavLink>
          <NavLink to={"/missions"}>Missions</NavLink>
        </aside>
      </header>
      <main>
        <Outlet />
      </main>
      <footer></footer>
    </>
  );
};
