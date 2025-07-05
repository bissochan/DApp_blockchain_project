import { useState } from "react";
import Navbar from "../components/Navbar";
import { postCompany, postWorker } from "../services/api";

function Home() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleRegister = async (role) => {
    if (!username) return;

    setMessage(null);
    setError(null);

    try {
      if (role === "worker") {
        const response = await postWorker({ username });
        console.log("Worker registered:", response.data);
        setMessage("Worker registration completed successfully!");
      } else {
        const response = await postCompany({ username });
        console.log("Company request submitted:", response.data);
        setMessage("Request submitted. Your company is pending approval.");
      }
      setUsername("");
    } catch (err) {
      console.error(
        "Error during registration:",
        err.response?.data || err.message
      );
      setError("Registration error. Try a different username.");
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="container mx-auto py-12">
        <h1 className="text-4xl font-bold text-center mb-4">
          Smart CV Platform
        </h1>
        <p className="text-lg text-center mb-6">
          A platform to certify and verify work experiences using blockchain.
        </p>

        <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-lg">
          <label className="block text-lg font-semibold mb-2 text-center">
            Choose a username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. mario_rossi"
            className="w-full px-4 py-2 border border-gray-300 rounded mb-4"
          />
          {message && (
            <p className="text-green-600 mb-2 text-center">{message}</p>
          )}
          {error && <p className="text-red-600 mb-2 text-center">{error}</p>}
          <div className="flex justify-between space-x-4">
            <button
              onClick={() => handleRegister("worker")}
              disabled={!username}
              className={`flex-1 px-4 py-2 rounded text-white ${
                username
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Register as Worker
            </button>
            <button
              onClick={() => handleRegister("company")}
              disabled={!username}
              className={`flex-1 px-4 py-2 rounded text-white ${
                username
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Register as Company
            </button>
          </div>
        </div>

        <div className="mt-10 flex justify-center space-x-4">
          <a
            href="/worker"
            className="bg-primary text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Worker
          </a>
          <a
            href="/certifier"
            className="bg-primary text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Certifier
          </a>
          <a
            href="/verifier"
            className="bg-primary text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Verifier
          </a>
        </div>
      </div>
    </div>
  );
}

export default Home;
