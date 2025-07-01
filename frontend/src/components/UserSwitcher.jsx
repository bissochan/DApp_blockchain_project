import { useEffect, useState } from "react";
import { fetchCompanies, fetchUsers } from "../services/api";

function UserSwitcher({ currentUser, onChangeUser, filter = "all" }) {
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        let all = [];
        if (filter === "users") {
          const res = await fetchUsers();
          all = res.data || [];
        } else if (filter === "companies") {
          const res = await fetchCompanies();
          all = res.data || [];
        } else {
          const [resUsers, resCompanies] = await Promise.all([
            fetchUsers(),
            fetchCompanies(),
          ]);
          all = [
            ...(resUsers.data || []),
            ...(resCompanies.data || []),
            { id: "admin1", username: "admin", role: "admin" },
          ];
        }
        setFilteredUsers(all);
      } catch (err) {
        console.error("Failed to load users or companies", err);
        setFilteredUsers([{ id: "admin1", username: "admin", role: "admin" }]);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [filter]);


  const handleChange = (e) => {
    const selectedId = e.target.value;
    const newUser = filteredUsers.find(u => u.id === selectedId);
    if (newUser) onChangeUser(newUser);
  };

  if (loading) return <p className="p-4">Caricamento utenti...</p>;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-100 border rounded mb-4">
      <div className="text-sm">
        <span className="font-semibold">Utente corrente:</span> {currentUser?.username} ({currentUser?.role})
      </div>
      <div>
        <select
          value={currentUser?.id || ""}
          onChange={handleChange}
          className="p-2 border rounded"
        >
          {Array.isArray(filteredUsers) &&
            filteredUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({u.role})
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}

export default UserSwitcher;
