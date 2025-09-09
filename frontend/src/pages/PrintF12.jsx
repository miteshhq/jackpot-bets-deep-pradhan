import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

// Print styles for small ticket printing
const printStyles = `
  @media print {
    @page {
      size: 80mm auto;
      margin: 0;
    }
    
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 80mm;
      font-family: monospace;
    }
    
    .receipt-wrapper {
      width: 80mm !important;
      margin: 0 !important;
      padding: 4px !important;
      font-size: 9px !important;
      line-height: 1.1 !important;
      background: white !important;
    }
    
    .no-print,
    .print\\:hidden {
      display: none !important;
    }
    
    .print\\:mt-0 { margin-top: 0 !important; }
    .print\\:p-0 { padding: 0 !important; }
    .print\\:m-0 { margin: 0 !important; }
    .print\\:shadow-none { box-shadow: none !important; }
    .print\\:rounded-none { border-radius: 0 !important; }
    
    .receipt-title {
      font-size: 10px !important;
      font-weight: bold !important;
      text-align: center !important;
      margin-bottom: 2px !important;
      padding-bottom: 1px !important;
    }
    
    .receipt-info {
      font-size: 8px !important;
      margin: 1px 0 !important;
    }
    
    .receipt-bets {
      font-size: 8px !important;
      margin: 1px 0 !important;
    }
    
    .receipt-total {
      font-size: 8px !important;
      margin: 1px 0 !important;
    }
    
    .receipt-footer {
      font-size: 7px !important;
      text-align: center !important;
      margin-top: 2px !important;
    }
    
    .bet-separator {
      margin: 1px 0 !important;
      border-top: 1px dotted black !important;
    }
  }
`;

// Receipt Component
const Receipt = ({ receiptData }) => {
  // Group into rows of 5 bets each
  const grouped = [];
  for (let i = 0; i < receiptData.bets.length; i += 5) {
    grouped.push(receiptData.bets.slice(i, i + 5));
  }

  return (
    <div className="text-[10px] font-mono w-[80mm] bg-white receipt-wrapper p-2">
      <div className="receipt-title text-center font-bold border-b border-black pb-1 mb-1">
        --- JACKPOT BETTING SLIP ---
      </div>
      <div className="receipt-info">Counter ID : {receiptData.counterID}</div>
      <div className="receipt-info">Barcode : {receiptData.barcode}</div>
      <div className="receipt-info">Agent ID : {receiptData.agentID}</div>
      <div className="receipt-info text-[9px]">
        2 DIGIT 2 Draw {receiptData.drawDate} {receiptData.drawTime}
      </div>

      <div className="bet-separator my-1 border-t border-dotted border-black" />

      {grouped.map((group, rowIdx) => (
        <div
          key={rowIdx}
          className="receipt-bets flex flex-wrap gap-x-1 text-[9px]"
        >
          {group.map((bet, i) => (
            <span key={i} className="whitespace-nowrap">
              {bet.number.toString().padStart(2, "0")}-
              {bet.points.toString().padStart(2, "0")}
              {i !== group.length - 1 ? "," : ""}
            </span>
          ))}
        </div>
      ))}

      <div className="bet-separator my-1 border-t border-dotted border-black" />
      <div className="receipt-total text-[9px]">
        Qty : {receiptData.qty} Total Pts :{" "}
        {(receiptData.totalPts * 2).toFixed(2)}
      </div>
      <div className="receipt-footer text-center mt-2 text-[8px]">
        *** GOOD LUCK ***
      </div>
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

  // Add print styles when component mounts
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = printStyles;
    document.head.appendChild(styleElement);

    return () => {
      // Cleanup: remove the style when component unmounts
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

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

    // Get Agent ID from JWT token (same as in header)
    const token = localStorage.getItem("token");
    let agentID = "N/A";
    if (token) {
      try {
        const user = jwtDecode(token);
        agentID = user?.id || "N/A";
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }

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
      agentID,
      drawDate,
      drawTime,
      bets: selectedBets,
      qty,
      totalPts,
    });

    if (autoPrint && !hasTriggeredPrint) {
      setTimeout(() => {
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
    // Small delay to ensure styles are applied
    setTimeout(() => {
      window.print();
    }, 100);
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
