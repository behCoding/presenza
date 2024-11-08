import React, { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom"; 
import './Register.css';

const RegisterPage = () => {
  const { register, handleSubmit } = useForm();
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      setErrorMessage("");
      const response = await axios.post("http://localhost:8000/register", data);
      console.log("Registration successful:", response.data);
      navigate("/login");

    } catch (error) {
      if (error.response && error.response.status === 400) {
        setErrorMessage(error.response.data.detail);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Name:</label>
          <input type="text" {...register("name", { required: true })} />
        </div>
        <div className="form-group">
          <label>Surname:</label>
          <input type="text" {...register("surname", { required: true })} />
        </div>
        <div className="form-group">
          <label>Job Start Date:</label>
          <input type="date" {...register("job_start_date", { required: true })} />
        </div>
        <div className="form-group">
          <label>Full Time:</label>
          <input type="checkbox" {...register("full_time")} />
        </div>
        <div className="form-group">
          <label>Phone Number:</label>
          <input type="text" {...register("phone_number", { required: true })} />
        </div>
        <div className="form-group">
          <label>Personal Email:</label>
          <input type="email" {...register("personal_email", { required: true })} />
        </div>
        <div className="form-group">
          <label>Work Email:</label>
          <input type="email" {...register("work_email", { required: true })} />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input type="password" {...register("password", { required: true })} />
        </div>
        {/* New role field */}
        <div className="form-group">
          <label>Role:</label>
          <select {...register("role", { required: true })}>
            <option value="employee">Employee</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        <button type="submit">Register</button>
      </form>

      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
};

export default RegisterPage;
