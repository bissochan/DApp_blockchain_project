import { useState } from "react";
import { requestWhitelist } from "../services/api";

function RequestWhitelistForm({ currentUser }) {
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const response = await requestWhitelist({ username: currentUser.username });
      setSuccessMessage("Richiesta di whitelist inviata con successo!");
    } catch (err) {
      setError(err.response?.data?.error || "Errore durante l'invio della richiesta.");
    } finally {
      setLoading(false);
    }
  };

  if (currentUser?.role !== "candidate") {
    return null; // Il form è visibile solo ai lavoratori
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Richiedi Whitelist come Certificatore</h2>
      {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        <p className="mb-4 text-gray-600">
          Invia una richiesta per diventare un certificatore. L'admin la esaminerà.
        </p>
        <button
          type="submit"
          disabled={loading}
          className={`bg-primary text-white px-4 py-2 rounded hover:bg-blue-700 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Invio in corso..." : "Invia Richiesta"}
        </button>
      </form>
    </div>
  );
}

export default RequestWhitelistForm;