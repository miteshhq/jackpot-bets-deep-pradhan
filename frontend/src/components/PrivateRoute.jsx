import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import {jwtDecode} from "jwt-decode";  // npm install jwt-decode

const PrivateRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    // Token nahi hai, login page pe bhejo
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const decoded = jwt_decode(token);

    // role 'admin' ho toh decoded.admin true hona chahiye
    if (role === "admin" && !decoded.admin) {
      // Admin route hai par admin token nahi
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // role 'user' ho toh decoded.admin nahi hona chahiye
    if (role === "user" && decoded.admin) {
      // User route hai par admin token hai, isliye allow nahi
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
  } catch (error) {
    // Invalid token ya decode error
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
};

export default PrivateRoute;


