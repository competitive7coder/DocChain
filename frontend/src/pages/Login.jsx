import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("patient");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.success) {
          // Navigation based on role
          if (result.user.role === "doctor") navigate("/doctor/dashboard");
          else if (result.user.role === "patient") navigate("/patient/dashboard");
          else if (result.user.role === "pharmacy") navigate("/pharmacy/dashboard");
        } else {
          setError(result.error);
        }
      } else {
        const result = await register({ name, email, password, role, phone });
        if (result.success) {
          // Redirect based on role after signup
          if (result.user.role === "pharmacy") navigate("/pharmacy/dashboard");
          else if (result.user.role === "doctor") navigate("/doctor/dashboard");
          else navigate("/patient/dashboard");
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError("Server error. Check if backend allows pharmacy role.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-indigo-700 text-center mb-8">Scan & Share</h1>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button type="button" onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-md ${isLogin ? "bg-indigo-600 text-white" : "text-gray-600"}`}>Login</button>
          <button type="button" onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-md ${!isLogin ? "bg-indigo-600 text-white" : "text-gray-600"}`}>Register</button>
        </div>

        {!isLogin && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
            <div className="grid grid-cols-3 gap-2">
              {['patient', 'doctor', 'pharmacy'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-2 rounded-lg border-2 text-xs font-bold capitalize ${role === r ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required minLength={6} />
          </div>

          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold">
            {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;