import { useEffect, useState } from "react";
import ExperienceForm from "../components/ExperienceForm";
import ExperienceList from "../components/ExperienceList";
import Navbar from "../components/navbar";
import UserSwitcher from "../components/UserSwitcher";
import { fetchUsers } from "../services/api";

function WorkerDashboard() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function loadInitialUser() {
      try {
        const res = await fetchUsers();
        if (res.data.length > 0) {
          setCurrentUser(res.data[0]);
        }
      } catch (err) {
        console.error("Failed to load users", err);
      }
    }

    loadInitialUser();
  }, []);

  if (!currentUser) return <div className="p-8">Caricamento utente...</div>;

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard Lavoratore</h1>

        <UserSwitcher
          currentUser={currentUser}
          onChangeUser={setCurrentUser}
          filter="users"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ExperienceForm currentUser={currentUser} />
          <ExperienceList currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
}

export default WorkerDashboard;
