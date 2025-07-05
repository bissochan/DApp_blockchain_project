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
          "Insufficient tokens for verification. Please purchase tokens before continuing."
        );
      } else if (err.response?.data?.error === "Certificate not found") {
        setError("Certificate not found.");
      } else if (err.response?.data?.error === "Verifier not found") {
        setError("Verifier not found.");
      } else {
        setError("Error during verification.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Verify Certificate</h2>
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
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {result && (
        <div className="mt-4">
          <h3 className="font-semibold">Verification Result</h3>
          <p>Status: {result.verified ? "Valid" : "Invalid"}</p>
          {result.verified && result.certificate?.claim && (
            <>
              <p>Candidate: {result.certificate.claim.user}</p>
              <p>Company: {result.certificate.claim.company}</p>
              <p>Role: {result.certificate.claim.role}</p>
              <p>
                Date: {result.certificate.claim.startDate} -{" "}
                {result.certificate.claim.endDate || "Ongoing"}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Description: {result.certificate.claim.description}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default VerificationForm;
