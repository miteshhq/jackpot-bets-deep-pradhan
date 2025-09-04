import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Receipt Component
const Receipt = ({ receiptData }) => {
  // Group into rows of 5 bets each
  const grouped = [];
  for (let i = 0; i < receiptData.bets.length; i += 5) {
    grouped.push(receiptData.bets.slice(i, i + 5));
  }

  return (
    <div className="text-[12px] font-mono w-[80mm] bg-white receipt-wrapper p-2">
      <div className="text-center font-bold border-b border-black pb-1 mb-1">
        --- JACKPOT BETTING SLIP ---
      </div>
      <div>Counter ID : {receiptData.counterID}</div>
      <div>Barcode : {receiptData.barcode}</div>
      <div>
        2 DIGIT 2 Draw {receiptData.drawDate} {receiptData.drawTime}
      </div>

      <div className="my-1 border-t border-dotted border-black" />

      {grouped.map((group, rowIdx) => (
        <div key={rowIdx} className="flex flex-wrap gap-x-2">
          {group.map((bet, i) => (
            <span key={i}>
              {bet.number.toString().padStart(2, "0")} -{" "}
              {bet.points.toString().padStart(2, "0")}
              {i !== group.length - 1 ? " ," : ""}
            </span>
          ))}
        </div>
      ))}

      <div className="my-1 border-t border-dotted border-black" />
      <div>
        Qty : {receiptData.qty} Total Pts :{" "}
        {(receiptData.totalPts * 2).toFixed(2)}
      </div>
      <div className="text-center mt-2 text-[10px]">*** GOOD LUCK ***</div>
    </div>
  );
};

const PrintF12 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedBets = location.state?.selectedBets || [];
  const providedBarcode = location.state?.barcode;
  const autoPrint = location.state?.autoPrint || false;

  const [receiptData, setReceiptData] = useState(null);
  const [hasTriggeredPrint, setHasTriggeredPrint] = useState(false);

  useEffect(() => {
    if (selectedBets.length === 0) {
      // If no bets, redirect back to game
      navigate("/game");
      return;
    }

    const counterID = (52080000 + Math.floor(Math.random() * 1000)).toString();
    const barcode =
      providedBarcode ||
      (5100000 + Math.floor(Math.random() * 10000)).toString();

    const now = new Date();
    const drawDate = now.toISOString().split("T")[0];
    const drawTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const qty = selectedBets.length;
    const totalPts = selectedBets.reduce(
      (acc, bet) => acc + Number(bet.points || 0),
      0
    );

    setReceiptData({
      counterID,
      barcode,
      drawDate,
      drawTime,
      bets: selectedBets,
      qty,
      totalPts,
    });

    // 🔥 AUTO PRINT: Trigger print dialog if autoPrint flag is true
    if (autoPrint && !hasTriggeredPrint) {
      setTimeout(() => {
        console.log("🖨️ Auto-triggering print dialog...");
        window.print();
        setHasTriggeredPrint(true);

        // After print dialog, navigate back to game after a delay
        setTimeout(() => {
          navigate("/game");
        }, 1000);
      }, 800); // Small delay to ensure complete render
    }
  }, [selectedBets, providedBarcode, autoPrint, hasTriggeredPrint, navigate]);

  const handleCancel = () => {
    navigate("/game");
  };

  const handlePrint = () => {
    window.print();
  };

  if (!receiptData) {
    return (
      <div className="min-h-screen bg-green-100 flex items-center justify-center">
        <div className="text-center text-gray-600">Loading receipt...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-100 flex flex-col items-center p-6 gap-6">
      <div className="flex flex-col items-center space-y-4 bg-white p-6 rounded-xl shadow-md print:shadow-none print:p-0 print:m-0 print:rounded-none">
        <div className="receipt-wrapper print:mt-0">
          <Receipt receiptData={receiptData} />
        </div>

        {/* Buttons hidden on print */}
        <div className="flex gap-4 no-print mt-4 print:hidden">
          <button
            onClick={handlePrint}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            🖨️ Print Again
          </button>
          <button
            onClick={handleCancel}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🎮 Back to Game
          </button>
        </div>

        {autoPrint && (
          <div className="text-sm text-gray-600 print:hidden">
            🖨️ Print dialog should open automatically...
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintF12;
