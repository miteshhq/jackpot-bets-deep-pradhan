import { useState } from "react";
import axios from "axios";

function Footer({
  gridValues,
  footerAmount,
  barcode,
  isLocked,
  timeLeft,
  handlePlaceBet,
}) {
  const [searchBarcode, setSearchBarcode] = useState("");
  const [betList, setBetList] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const totalStake = (
    gridValues.flat().reduce((sum, val) => {
      const num = parseFloat(val);
      return sum + (isNaN(num) ? 0 : num);
    }, 0) * footerAmount
  ).toFixed(2);

  const handleSearch = () => {
    if (searchBarcode.length !== 7) {
      setErrorMsg("❌ Valid 7-digit barcode daaliye");
      setBetList([]);
      return;
    }

    axios
      .get(`/api/bets/by-barcode/${searchBarcode}`)
      .then((res) => {
        setBetList(res.data);
        setErrorMsg("");
      })
      .catch((err) => {
        setBetList([]);
        if (err.response?.status === 404) {
          setErrorMsg("❌ Is barcode se koi bet nahi mili");
        } else {
          setErrorMsg("⚠️ Koi error aaya data laane mein");
        }
      });
  };

  return (
    <>
      {/* Footer Controls */}
      <footer className="mt-auto bg-yellow-200 rounded-t-md p-3 shadow-inner border-t border-yellow-300 mx-2">
        <div className="flex justify-between items-center flex-wrap gap-4">
          {/* Total Stake */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Total Stake:</span>
            <span className="text-lg font-bold text-blue-900">
              💎{totalStake}
            </span>
          </div>

          {/* Display Current Barcode - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-bold text-sm">Barcode:</span>
            <input
              type="text"
              value={barcode}
              readOnly
              className="border border-gray-300 rounded px-2 py-1 text-sm w-28"
            />
          </div>

          {/* Place Bet Button */}
          <button
            onClick={handlePlaceBet}
            disabled={isLocked || timeLeft <= 10}
            className={`px-4 py-1.5 rounded text-white text-sm font-semibold ${
              isLocked || timeLeft <= 10
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Place Bet
          </button>
        </div>
      </footer>

      {/* Barcode Search Area - Hidden on mobile */}
      <div className="hidden sm:block my-4 p-4 bg-white shadow rounded mx-2">
        <h2 className="font-bold mb-2">🔍 Bet Search by Barcode</h2>
        <div className="flex gap-2 items-center mb-3">
          <input
            type="text"
            value={searchBarcode}
            onChange={(e) => setSearchBarcode(e.target.value)}
            className="border px-2 py-1 rounded text-sm"
            placeholder="Enter 7-digit barcode"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            Search
          </button>
        </div>

        {errorMsg && (
          <div className="text-red-500 text-sm mb-2">{errorMsg}</div>
        )}

        {betList.length > 0 && (
          <div className="overflow-auto">
            <table className="w-full text-sm border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th>Sr No.</th>
                  <th>Barcode</th>
                  <th>Draw Time</th>
                  <th>MRP</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Win Amount</th>
                </tr>
              </thead>
              <tbody>
                {betList.map((bet, index) => (
                  <tr key={bet.id} className="text-center border-t">
                    <td>{index + 1}</td>
                    <td>{bet.barcode}</td>
                    <td>{bet.drawTime}</td>
                    <td>💎2.00</td>
                    <td>{Number(bet.qty).toFixed(2)}</td>
                    <td>{Number(bet.amount).toFixed(2)}</td>
                    <td>{Number(bet.winAmount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default Footer;
