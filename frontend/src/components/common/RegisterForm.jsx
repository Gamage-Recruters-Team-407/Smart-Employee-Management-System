import { useState } from "react";
import axios from "axios";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Employee",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData
      );

      setMessage(res.data.message);

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "Employee",
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      
      {message && (
        <div className="text-sm text-center p-2 rounded bg-blue-50 text-blue-600">
          {message}
        </div>
      )}

      
      <input
        type="text"
        name="name"
        placeholder="Full Name"
        value={formData.name}
        onChange={handleChange}
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
      />

     
      <input
        type="email"
        name="email"
        placeholder="Email Address"
        value={formData.email}
        onChange={handleChange}
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
      />

    
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
      />

      
      <input
        type="password"
        name="confirmPassword"
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChange={handleChange}
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />

      
      <select
        name="role"
        value={formData.role}
        onChange={handleChange}
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="Employee">Employee</option>
        <option value="HR">HR</option>
        <option value="Manager">Manager</option>
        <option value="Admin">Admin</option>
      </select>

      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition"
      >
        {loading ? "Creating Account..." : "Register"}
      </button>

    </form>
  );
};

export default RegisterForm;