import { useEffect, useState } from "react";
import {
  getMyRequestExperiences,
  postExperienceCertification,
} from "../services/api";

function CertificationForm({ currentUser }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await getMyRequestExperiences(currentUser.id);
        setRequests(response.data);
      } catch (err) {
        const message = err.response?.data?.error;
        if (message === "Company approval is still pending") {
          setError("Your company registration request is still pending.");
        } else if (message === "Company registration was rejected") {
          setError("Your company registration request was rejected.");
        } else if (message === "Company has been removed from the whitelist") {
          setError(
            "Your company has been removed from the whitelist. Please contact an administrator."
          );
        } else {
          setError("Error while loading certification requests.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) fetchRequests();
  }, [currentUser?.id]);

  const handleCertify = async (id, isApproved) => {
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await postExperienceCertification({
        claimId: id,
        companyUsername: currentUser.username,
        isApproved,
      });
      setRequests(requests.filter((req) => req.claimId !== id));

      if (isApproved) {
        setSuccessMessage("Certificate approved and saved successfully.");
      } else {
        setSuccessMessage("Request successfully rejected.");
      }
    } catch (err) {
      setError("Error during certification.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Certification Requests</h2>

      {successMessage && <p className="text-green-600">{successMessage}</p>}

      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.claimId}
              className="border-b pb-2 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">
                  CV certification required by userId: {req.claim.userId}
                </h3>
                <p>Company ID: {req.claim.companyId}</p>
                <p>Role: {req.claim.role}</p>
                <p className="text-gray-600">
                  {req.claim.startDate} - {req.claim.endDate || "Ongoing"}
                </p>
                <p className="text-gray-600">{req.claim.description}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleCertify(req.claimId, true)}
                  className="bg-green-600 text-white px-2 py-1 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleCertify(req.claimId, false)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CertificationForm;
