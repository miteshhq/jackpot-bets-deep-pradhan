import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Normal components
import Login from "./components/Login";
import Register from "./components/Register";
import NewJackpot from "./pages/NewJackpot";
import BetDetails from "./pages/BetDetails";

// Admin components
import DashboardLayout from "./admin/DashboardLayout";
import AdminDashboard from "./admin/AdminDashboard";
import Bets from "./admin/Bets";
import Results from "./admin/Results"; // <-- Import Results here
import Transaction from "./admin/Transaction";
import User from "./admin/User";
import CreateResult from "./admin/CreateResult";
import PayoutRequest from "./admin/PayoutRequest";
import PayoutList from "./admin/PayoutList";
import PrintF12 from "./pages/PrintF12";
import ResultR from "./pages/ResultR";
import ReportS from "./pages/ReportS";
import ForgetPassword from "./components/ForgetPassword";
import UserSpecification from "./admin/UserSpecification"; // Adjust the path if needed
import DepositRequests from "./admin/DepositRequests";
import Admins from "./admin/Admins";

const App = () => {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        {/* Auth routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgetPassword />} />

        {/* Game route */}
        <Route path="/game" element={<NewJackpot />} />
        <Route path="/bet-details" element={<BetDetails />} />
        <Route path="/print-f12" element={<PrintF12 />} />
        <Route path="/result-r" element={<ResultR />} />
        <Route path="/report-s" element={<ReportS />} />

        {/* Admin Dashboard route */}
        <Route
          path="/admin-dashboard"
          element={
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          }
        />

        {/* Bets route */}
        <Route
          path="/admin-bets"
          element={
            <DashboardLayout>
              <Bets />
            </DashboardLayout>
          }
        />

        {/* Results route */}
        <Route
          path="/admin-results"
          element={
            <DashboardLayout>
              <Results />
            </DashboardLayout>
          }
        />
        <Route
          path="/admin-transactions"
          element={
            <DashboardLayout>
              <Transaction />
            </DashboardLayout>
          }
        />
        <Route
          path="/admins"
          element={
            <DashboardLayout>
              <Admins />
            </DashboardLayout>
          }
        />
        <Route
          path="/admin-users"
          element={
            <DashboardLayout>
              <User />
            </DashboardLayout>
          }
        />
        <Route
          path="/admin-create-result"
          element={
            <DashboardLayout>
              <CreateResult />
            </DashboardLayout>
          }
        />
        <Route
          path="/admin-payouts"
          element={
            <DashboardLayout>
              <PayoutRequest />
            </DashboardLayout>
          }
        />
        <Route
          path="/admin-deposits"
          element={
            <DashboardLayout>
              <DepositRequests />
            </DashboardLayout>
          }
        />
        <Route
          path="/admin-payout-list"
          element={
            <DashboardLayout>
              <PayoutList />
            </DashboardLayout>
          }
        />
        <Route
          path="/admin-user-specification"
          element={
            <DashboardLayout>
              <UserSpecification />
            </DashboardLayout>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;

// f4d751b8c1f8d5c3208e3ca6c998c7da73198
