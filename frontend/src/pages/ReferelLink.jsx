// Referral.jsx
import React, { useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

// Game Guide Component (moved from JackpotGame)
const GameGuide = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-800">
            🎯 How to Play STAR DIGIT
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 💡 Calculation Info Box */}
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-800 mb-3 text-lg">
              📊 Win Calculation Formula:
            </h3>
            <div className="bg-white p-3 rounded border-l-4 border-green-500 mb-3">
              <p className="text-lg font-bold text-green-700 mb-2">
                <strong>Win Amount = Stake × 2 × 80 × Bonus Multiplier</strong>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
              <div>
                <p>
                  <strong>• Stake:</strong> Your bet amount (what you enter)
                </p>
                <p>
                  <strong>• Multiplied by 2:</strong> Standard game rule
                </p>
              </div>
              <div>
                <p>
                  <strong>• Multiplied by 80:</strong> Fixed payout ratio
                </p>
                <p>
                  <strong>• Multiplied by Bonus:</strong> Decided by admin
                  (1x-10x)
                </p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-300">
              <p className="text-sm font-semibold">
                <span className="text-orange-600">Example:</span> If you bet ₹5
                and win with 3x bonus:
                <span className="text-green-600 font-bold">
                  {" "}
                  ₹5 × 2 × 80 × 3 = ₹2,400
                </span>
              </p>
            </div>
          </div>

          {/* Basic Game Rules */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-3 text-lg">
              🎮 Game Rules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p>
                  <strong>🎯 Objective:</strong> Predict the winning 2-digit
                  number (00-99)
                </p>
                <p>
                  <strong>⏰ Draw Timing:</strong> Every 5 minutes
                </p>
                <p>
                  <strong>💰 Minimum Bet:</strong> ₹1 per number
                </p>
                <p>
                  <strong>🎊 Win Ratio:</strong> 1:80 (before bonus)
                </p>
              </div>
              <div className="space-y-2">
                <p>
                  <strong>⏳ Bet Cutoff:</strong> 15 seconds before draw
                </p>
                <p>
                  <strong>🎁 Bonus:</strong> 1x to 10x multiplier
                </p>
                <p>
                  <strong>📱 Auto Print:</strong> Ticket generated after bet
                </p>
                <p>
                  <strong>🔢 Barcode:</strong> 7-digit tracking number
                </p>
              </div>
            </div>
          </div>

          {/* How to Play Steps */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="font-bold text-purple-800 mb-3 text-lg">
              📝 Step-by-Step Guide
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <div>
                  <p className="font-semibold">Choose Your Numbers</p>
                  <p className="text-sm text-gray-600">
                    Click on any number (00-99) and enter your bet amount
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <div>
                  <p className="font-semibold">Use Quick Options</p>
                  <p className="text-sm text-gray-600">
                    Use E-columns, Row betting, or Lucky Pick (LP) for faster
                    selection
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <div>
                  <p className="font-semibold">Review Total Amount</p>
                  <p className="text-sm text-gray-600">
                    Check the total amount in footer before placing bet
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  4
                </span>
                <div>
                  <p className="font-semibold">Place Your Bet</p>
                  <p className="text-sm text-gray-600">
                    Click "Place Bet" button (available until 15 seconds before
                    draw)
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  5
                </span>
                <div>
                  <p className="font-semibold">Get Your Ticket</p>
                  <p className="text-sm text-gray-600">
                    Auto-print ticket with barcode for tracking your bets
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Features */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <h3 className="font-bold text-orange-800 mb-3 text-lg">
              ⚡ Advanced Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-pink-600">
                    🌸 E-Columns (Pink)
                  </p>
                  <p className="text-sm">
                    Bet on entire columns (E0: 0,10,20...90)
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-cyan-600">
                    🌊 Row Betting (Cyan)
                  </p>
                  <p className="text-sm">Bet on entire rows (Row 0: 00-09)</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-blue-600">
                    🎲 Lucky Pick (LP)
                  </p>
                  <p className="text-sm">Auto-select 1-5 random numbers</p>
                </div>
                <div>
                  <p className="font-semibold text-green-600">
                    🔍 Barcode Tracking
                  </p>
                  <p className="text-sm">
                    Enter 7-digit code to check bet status
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips & Strategies */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h3 className="font-bold text-yellow-800 mb-3 text-lg">
              💡 Tips & Strategies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p>
                  <strong>✅ Do:</strong> Start with small amounts
                </p>
                <p>
                  <strong>✅ Do:</strong> Use combination betting (E+Row)
                </p>
                <p>
                  <strong>✅ Do:</strong> Keep track of your barcodes
                </p>
                <p>
                  <strong>✅ Do:</strong> Set a budget and stick to it
                </p>
              </div>
              <div className="space-y-2">
                <p>
                  <strong>❌ Don't:</strong> Bet more than you can afford
                </p>
                <p>
                  <strong>❌ Don't:</strong> Chase losses
                </p>
                <p>
                  <strong>❌ Don't:</strong> Wait until last second
                </p>
                <p>
                  <strong>❌ Don't:</strong> Forget to save your barcode
                </p>
              </div>
            </div>
          </div>

          {/* Timing Information */}
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <h3 className="font-bold text-red-800 mb-3 text-lg">
              ⏰ Important Timings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-white rounded border">
                <p className="font-bold text-green-600">🟢 Safe Zone</p>
                <p>More than 15 seconds left</p>
                <p className="text-xs text-gray-600">Betting allowed</p>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <p className="font-bold text-yellow-600">🟡 Warning Zone</p>
                <p>30-16 seconds left</p>
                <p className="text-xs text-gray-600">Hurry up!</p>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <p className="font-bold text-red-600">🔴 Locked Zone</p>
                <p>15-0 seconds left</p>
                <p className="text-xs text-gray-600">No betting allowed</p>
              </div>
            </div>
          </div>

          {/* Contact & Support */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">
              🆘 Need Help?
            </h3>
            <div className="text-sm space-y-2">
              <p>
                <strong>📞 Support:</strong> Contact admin for assistance
              </p>
              <p>
                <strong>💰 Balance:</strong> Check your wallet balance before
                betting
              </p>
              <p>
                <strong>🎫 Tickets:</strong> Keep your barcode safe for
                verification
              </p>
              <p>
                <strong>🏆 Results:</strong> Check results section for winning
                numbers
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 text-center">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Got it! Let's Play 🎮
          </button>
        </div>
      </div>
    </div>
  );
};

const Referral = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : null;
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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

  const handleGuideClick = (e) => {
    e.stopPropagation(); // Prevent triggering referral click
    setShowGuide(true);
  };

  return (
    <>
      <div className="bg-purple-700 text-white py-1 cursor-pointer overflow-hidden whitespace-nowrap relative">
        {/* How to Play Button */}
        <button
          onClick={handleGuideClick}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white text-purple-700 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-100 transition z-10 shadow-sm"
        >
          📖 How to Play
        </button>

        {/* Marquee Content */}
        <div
          className="animate-marquee inline-block ml-24"
          onClick={handleReferralClick}
        >
          🎁{" "}
          {loading
            ? "Generating your referral link..."
            : "Refer friends and get 💎20 for each successful referral! Click here to share your link! 🎁"}
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

      {/* Game Guide Modal */}
      <GameGuide isVisible={showGuide} onClose={() => setShowGuide(false)} />
    </>
  );
};

export default Referral;
