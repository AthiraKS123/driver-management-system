import { useEffect, useState } from "react";
import { loginUser } from "../api/authApi";
import { useNavigate } from "react-router-dom";



const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

 useEffect(() => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    navigate("/drivers");
  }
}, [navigate]);

 const handleLogin = async () => {
  try {
    const res = await loginUser({ email, password });

const accessToken = res.data.accessToken;
const refreshToken = res.data.refreshToken;

localStorage.setItem("accessToken", accessToken);
localStorage.setItem("refreshToken", refreshToken);

setToken(accessToken);

    // ✅ ADD THIS LINE
    navigate("/drivers");

  } catch (error) {
    console.error(error.response?.data || error);
    alert("Login failed");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        
        <h2 className="text-2xl font-bold mb-6 text-center">
          Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
        >
          Login
        </button>

      </div>
    </div>
  );
};

export default Login;