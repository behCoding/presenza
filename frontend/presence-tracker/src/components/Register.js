import React, { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import { toast } from "react-toastify";
import IntlTelInput from "intl-tel-input/reactWithUtils";
import "intl-tel-input/styles";

const RegisterPage = () => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const emailSuffix = "@storelink.it";
  const [workEmail, setWorkEmail] = useState("");
  const formPassword = watch("password", "");
  const confirmFormPassword = watch("confirm_password", "");
  const [isValid, setIsValid] = useState(null);

  const handleNumberChange = (number) => {
    setValue("phone_number", number);
  };

  const handleWorkEmailChange = (e) => {
    const value = e.target.value;
    setWorkEmail(value);

    // Show suggestions if no "@" is present
    if (value.length > 3) {
      setShowSuggestions(!value.includes("@"));
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = () => {
    setWorkEmail((prev) => `${prev}${emailSuffix}`);
    setValue("work_email", `${workEmail}${emailSuffix}`);
    setShowSuggestions(false);
  };

  const onSubmit = async (data) => {
    console.log(data);
    if (formPassword !== confirmFormPassword) {
      console.log("Passwords do not match.", formPassword, confirmFormPassword);
      toast.error("Passwords do not match.");
      return;
    } else if (!isValid) {
      console.log("Invalid phone number.");
      toast.error("Please enter valid phone number.");
      return;
    } else {
      toast
        .promise(axios.post("http://localhost:8000/register", data), {
          pending: "Registering...",
          success: "Registration successful! Please log in.",
          error: "Registration failed. Please try again.",
        })
        .then((response) => {
          console.log("Registration successful:", response.data);
          navigate("/login");
        })
        .catch((error) => {
          console.log("Registration failed:", error);
        });
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="register-grid">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              {...register("name", { required: true })}
              className={errors.name ? "invalid-input" : ""}
            />
          </div>
          <div className="form-group">
            <label>Surname:</label>
            <input
              type="text"
              {...register("surname", { required: true })}
              className={errors.surname ? "invalid-input" : ""}
            />
          </div>
          <div className="form-group">
            <label>Job Start Date:</label>
            <input
              type="date"
              {...register("job_start_date", { required: true })}
              className={errors.job_start_date ? "invalid-input" : ""}
            />
          </div>
          <div className="form-group form_telInputContainer">
            <label>Phone Number:</label>
            <IntlTelInput
              onChangeNumber={handleNumberChange}
              onChangeValidity={setIsValid}
              initOptions={{
                initialCountry: "it",
              }}
              {...register("phone_number", { required: true })}
              inputProps={{
                className: errors.phone_number
                  ? "form_telInput invalid-input"
                  : "form_telInput",
              }}
            />
          </div>
          <div className="form-group">
            <label>Personal Email:</label>
            <input
              type="email"
              {...register("personal_email", { required: true })}
              className={errors.personal_email ? "invalid-input" : ""}
            />
          </div>
          <div className="form-group workEmail_container">
            <label>Work Email:</label>
            <input
              type="email"
              {...register("work_email", { required: true })}
              onChange={handleWorkEmailChange}
              className={errors.work_email ? "invalid-input" : ""}
            />
            {showSuggestions && (
              <div
                className="workEmail_suggestion"
                onClick={handleSuggestionClick}
              >
                {workEmail}@storelink.it
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              {...register("password", { required: true })}
              className={errors.password ? "invalid-input" : ""}
            />
          </div>
          <div className="form-group">
            <label>Confirm Password:</label>
            <input
              type="password"
              {...register("confirm_password", { required: true })}
              className={errors.confirm_password ? "invalid-input" : ""}
            />
          </div>
          <div className="form_checkbox">
            <input type="checkbox" {...register("full_time")} />
            <label>Full Time employee</label>
          </div>
        </div>
        <button className="form_submit" type="submit">
          Register
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
