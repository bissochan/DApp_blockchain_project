import { useEffect, useState } from "react";
import { fetchCompanies, postExperience } from "../services/api";

function ExperienceForm({ currentUser }) {
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetchCompanies();
        setCompanies((res.data || []).filter((c) => c.approvalStatus === "approved"));
      } catch (err) {
        console.error("Errore nel caricamento aziende", err);
      }
    }
    loadCompanies();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await postExperience({
        ...formData,
        username: currentUser.username,
      });
      setSuccess("Esperienza aggiunta con successo!");
      setFormData({ company: "", role: "", startDate: "", endDate: "", description: "" });
    } catch (err) {
      setError("Errore durante l'aggiunta dell'esperienza.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Aggiungi Esperienza</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Azienda</label>
          <select
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="">-- Seleziona azienda --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.username}>
                {c.username}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Ruolo</label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Data Inizio</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Data Fine</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Descrizione</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            rows="4"
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Caricamento..." : "Salva"}
        </button>
      </form>
    </div>
  );
}

export default ExperienceForm;
