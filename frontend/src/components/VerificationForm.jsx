import { useEffect, useState } from "react";
import { checkHash } from "../services/api";

function VerificationForm({ currentUser, resetSignal }) {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [resetSignal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await checkHash({
        verifierUsername: currentUser.username,
        certificateHash: hash,
      });
      setResult(response.data);
    } catch (err) {
      if (
        err.response?.data?.error ===
        "Insufficient token balance for verification"
      ) {
        setError(
          "Token insufficienti per effettuare la verifica. Acquista token prima di continuare."
        );
      } else if (err.response?.data?.error === "Certificate not found") {
        setError("Certificato non trovato.");
      } else if (err.response?.data?.error === "Verifier not found") {
        setError("Verificatore non trovato.");
      } else {
        setError("Errore durante la verifica.");
      }
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
          <p>Stato: {result.verified ? "Valido" : "Non valido"}</p>
          {result.verified && result.certificate?.claim && (
            <>
              <p>Candidato: {result.certificate.claim.user}</p>
              <p>Azienda: {result.certificate.claim.company}</p>
              <p>Ruolo: {result.certificate.claim.role}</p>
              <p>
                Data: {result.certificate.claim.startDate} -{" "}
                {result.certificate.claim.endDate || "In corso"}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Descrizione: {result.certificate.claim.description}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default VerificationForm;
