import { useState } from "react";
import { checkHash } from "../services/api";

function VerificationForm() {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await checkHash(hash);
      setResult(response.data);
    } catch (err) {
      setError("Errore durante la verifica.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Verifica Certificato</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Hash</label>
          <input
            type="text"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Verifica in corso..." : "Verifica"}
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {result && (
        <div className="mt-4">
          <h3 className="font-semibold">Risultato della verifica</h3>
          <p>Stato: {result.valid ? "Valido" : "Non valido"}</p>
          {result.valid && (
            <>
              <p>Azienda: {result.company}</p>
              <p>Ruolo: {result.role}</p>
              <p>Data: {result.startDate} - {result.endDate}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default VerificationForm;