import React, { useEffect, useRef, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import finance2 from "../assets/finance2.jpg";
import { AuthContext } from "../authContext/AuthProvider";
import toast from "react-hot-toast";
import axios from "axios";

const Register = () => {
  const formRef = useRef(null);
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      formRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1 }
    )
      .fromTo(
        leftPanelRef.current,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 1 },
        "-=0.5"
      )
      .fromTo(
        rightPanelRef.current,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 1 },
        "-=0.5"
      );
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    axios.post('http://localhost:5000/api/auth/register', {fullName,email,password})
    setSubmitting(true);
    try {
      await register(email, fullName, password);
      toast.success("Registration successful!");
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      const message = err.message || "Registration failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }

 }

  return (
    <div className="flex h-screen bg-[#F9F0D3] text-gray-800">
      {/* Left Panel */}
      <div
        ref={leftPanelRef}
        className="hidden md:flex flex-1 flex-col items-center justify-center p-10 bg-white"
      >
        <img
          src={finance2}
          alt="Financial Growth"
          className="rounded-lg shadow-lg w-3/4"
        />
        <p className="mt-6 text-center text-lg font-medium text-green-600">
          Secure your financial journey with us.
        </p>
      </div>

      {/* Right Panel (Form) */}
      <div
        ref={rightPanelRef}
        className="flex flex-1 items-center justify-center bg-[#E5D7C9]"
      >
        <div
          ref={formRef}
          className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8"
        >
          <h2 className="text-3xl font-bold text-center text-green-700 mb-6">
            Create an Account
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-zinc-500 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-zinc-500 focus:outline-none"
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-zinc-500 focus:outline-none"
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-zinc-500 focus:outline-none"
              />
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                className="mr-2"
                checked={showTerms}
                onChange={(e) => setShowTerms(e.target.checked)}
                required
              />
              <span className="text-sm">
                I agree to the{" "}
                <Link
                  to="/privacy-policy"
                  className="text-green-600 hover:underline"
                >
                  Terms & Privacy Policy
                </Link>
              </span>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2 ${
                submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              } text-white rounded-lg transition`}
            >
              {submitting ? "Registering..." : "Register"}
            </button>
          </form>

          {/* Already have an account */}
          <p className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-green-600 font-medium hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
