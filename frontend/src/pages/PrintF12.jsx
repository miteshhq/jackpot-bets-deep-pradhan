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
        --- RE-PRINTED ---
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
        Qty : {receiptData.qty} Total Pts : {(receiptData.totalPts * 2).toFixed(2)}
      </div>
    </div>
  );
};

const PrintF12 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedBets = location.state?.selectedBets || [];

  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    if (selectedBets.length === 0) return;

    const counterID = (52080000 + Math.floor(Math.random() * 1000)).toString();
    const barcode = (5100000 + Math.floor(Math.random() * 10000)).toString();

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
  }, [selectedBets]);

  const handleCancel = () => {
    navigate("/game");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-green-100 flex flex-col items-center p-6 gap-6">
      <div className="flex flex-col items-center space-y-4 bg-white p-6 rounded-xl shadow-md print:shadow-none print:p-0 print:m-0 print:rounded-none">
        {receiptData ? (
          <>
            <div className="receipt-wrapper print:mt-0">
              <Receipt receiptData={receiptData} />
            </div>

            {/* Buttons hidden on print */}
            <div className="flex gap-4 no-print mt-4 print:hidden">
              <button
                onClick={handlePrint}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                🖨️ Print
              </button>
              <button
                onClick={handleCancel}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                ❌ Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-red-600 font-bold mt-10">
            No bets found.
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintF12;









