// Referral.jsx
import React, { useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const Referral = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : null;
  const [loading, setLoading] = useState(false);

  const handleReferralClick = async () => {
    if (!user?.id) {
      alert("Login required to share referral link.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/referrals/generate-link`,
        { userId: user.id }
      );

      const referralLink = data.link;

      if (navigator.share) {
        navigator
          .share({
            title: "Join Jackpot Game",
            text: "Get 💎20 bonus! Join using my link.",
            url: referralLink,
          })
          .catch(console.error);
      } else {
        await navigator.clipboard.writeText(referralLink);
        alert("Referral link copied to clipboard!");
      }

      if (data.bonusReceived) {
        alert("🎉 Congrats! You earned 💎10 from your friend's registration.");
      }
    } catch (err) {
      console.error("Referral error:", err);
      alert("Error generating referral link.");
    }
    setLoading(false);
  };

  return (
    <div
      className="bg-purple-700 text-white py-1 cursor-pointer overflow-hidden whitespace-nowrap"
      onClick={handleReferralClick}
    >
      <div className="animate-marquee inline-block">
        🎁{" "}
        {loading
          ? "Generating your referral link..."
          : "Refer friends and get 💎20 for each successful referral! 🎁"}
      </div>

      <style>
        {`
          .animate-marquee {
            display: inline-block;
            padding-left: 100%;
            animation: marquee 30s linear infinite;
          }
          @keyframes marquee {
            0% { transform: translate(0, 0); }
            100% { transform: translate(-100%, 0); }
          }
        `}
      </style>
    </div>
  );
};

export default Referral;
