import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import UserSwitcher from "../components/UserSwitcher";
import WhitelistRequestForm from "../components/WhitelistRequestForm";
import CertifierList from "../components/CertifierList";

function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState({
    id: "admin1",
    username: "admin",
    role: "admin",
  });

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard Admin</h1>

        <UserSwitcher
          currentUser={currentUser}
          onChangeUser={setCurrentUser}
          filter="all"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WhitelistRequestForm currentUser={currentUser} />
          <CertifierList currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;