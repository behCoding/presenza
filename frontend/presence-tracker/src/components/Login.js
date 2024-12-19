import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const emailSuffix = "@storelink.it";
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setUsername(value);

    // Show suggestions if no "@" is present
    if (value.length > 3) {
      setShowSuggestions(!value.includes("@"));
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = () => {
    setUsername((prev) => `${prev}${emailSuffix}`);
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    toast
      .promise(
        axios.post(
          "http://localhost:8000/token",
          new URLSearchParams({
            username: username,
            password: password,
          }),
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        ),
        {
          pending: "Logging in...",
          success: "Login successful!",
          error: "Login failed. Please check your credentials and try again.",
        }
      )
      .then((response) => {
        const { access_token, role, user_id } = response.data;
        localStorage.setItem("token", access_token);
        localStorage.setItem("user_id", user_id);

        if (role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/employee-dashboard");
        }
      })
      .catch((error) => {
        console.error("Error logging in:", error);
      });
  };

  return (
    <div className="login_container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="login_inputContainer">
          <div className="login_email">
            <input
              type="text"
              placeholder="Enter your email"
              value={username}
              onChange={handleEmailChange}
            />
            {showSuggestions && (
              <div className="login_suggestion" onClick={handleSuggestionClick}>
                {username}@storelink.it
              </div>
            )}
          </div>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setShowSuggestions(false)}
          />
          <p>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
