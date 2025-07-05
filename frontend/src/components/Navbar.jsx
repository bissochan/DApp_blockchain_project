import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <NavLink to="/" className="text-2xl font-bold">
          Smart CV
        </NavLink>
        <div className="space-x-4">
          <NavLink to="/worker" className="hover:underline">
            Worker
          </NavLink>
          <NavLink to="/certifier" className="hover:underline">
            Certifier
          </NavLink>
          <NavLink to="/verifier" className="hover:underline">
            Verifier
          </NavLink>
          <NavLink to="/admin" className="hover:underline">
            Admin
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
