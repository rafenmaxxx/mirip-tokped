import { useState, useEffect } from "react";
import { showToast } from "../../lib/toast";
import Toggle from "./toggle";

const GlobalFlags = () => {
  const [flags, setFlags] = useState({
    auction_enabled: true,
    chat_enabled: true,
    checkout_enabled: true,
  });

  const [reasons, setReasons] = useState({
    auction_enabled: "",
    chat_enabled: "",
    checkout_enabled: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingFlags, setSavingFlags] = useState({
    auction_enabled: false,
    chat_enabled: false,
    checkout_enabled: false,
  });

  // Store snapshot of original state for rollback on error
  const [flagsSnapshot, setFlagsSnapshot] = useState({});
  const [reasonsSnapshot, setReasonsSnapshot] = useState({});

  useEffect(() => {
    fetchGlobalFlags();
  }, []);

  const fetchGlobalFlags = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        "http://localhost:80/node/api/flags/global",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFlags(data.data);

        const restrictionsRes = await fetch(
          "http://localhost:80/node/api/flags/restrictions/global",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const newReasons = {};
        if (restrictionsRes.ok) {
          const restrictionsData = await restrictionsRes.json();
          restrictionsData.data.forEach((item) => {
            newReasons[item.feature_name] = item.reason || "";
          });
        }

        setReasons(newReasons);
        setFlagsSnapshot({ ...data.data });
        setReasonsSnapshot({ ...newReasons });
      }
    } catch (error) {
      console.error("Error fetching global flags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReasonChange = (key, value) => {
    setReasons((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveFlag = async (featureName) => {
    try {
      const isEnabled = flags[featureName];
      const reason = reasons[featureName]?.trim();

      // Validate: if disabled, reason must be provided
      if (!isEnabled && !reason) {
        showToast("Tidak ada alasan!", `Alasan penonaktifan untuk ${featureName.replace(
          "_enabled",
          ""
        )} harus diisi!`, "error");
        setFlags(flagsSnapshot);
        setReasons(reasonsSnapshot);
        return;
      }

      // Validate: if disabled, reason must be at least 20 characters
      if (!isEnabled && reason.length < 20) {
        showToast("Alasan kurang lengkap!", `Alasan penonaktifan untuk ${featureName.replace(
          "_enabled",
          ""
        )} minimal 20 karakter!`, "error");
        setFlags(flagsSnapshot);
        setReasons(reasonsSnapshot);
        return;
      }

      setSavingFlags((prev) => ({ ...prev, [featureName]: true }));
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        "http://localhost:80/node/api/flags/global",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            featureName,
            isEnabled,
            reason: isEnabled ? null : reason,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal mengupdate ${featureName}`);
      }

      setFlagsSnapshot((prev) => ({ ...prev, [featureName]: isEnabled }));
      setReasonsSnapshot((prev) => ({ ...prev, [featureName]: reason || "" }));

      showToast("Berhasil!", `flag untuk ${featureName.replace("_enabled", "")} berhasil diupdate`, "success");
    } catch (error) {
      console.error("Error saving flag:", error);

      setFlags((prev) => ({
        ...prev,
        [featureName]: flagsSnapshot[featureName],
      }));
      setReasons((prev) => ({
        ...prev,
        [featureName]: reasonsSnapshot[featureName],
      }));

      showToast("Gagal menyimpan perubahan", error.message, "error");
    } finally {
      setSavingFlags((prev) => ({ ...prev, [featureName]: false }));
    }
  };

  const hasChanges = (featureName) => {
    const flagChanged = flags[featureName] !== flagsSnapshot[featureName];
    const reasonChanged =
      (reasons[featureName]?.trim() || "") !==
      (reasonsSnapshot[featureName]?.trim() || "");
    return flagChanged || reasonChanged;
  };

  if (loading) {
    return (
      <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 rounded"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-[#00AA5B] text-center font-bold text-xl mb-6 border-b pb-2">
          Global Flags
        </h2>

        <div className="space-y-4">
          {/* Auction Feature */}
          <div className="pb-4">
            <Toggle
              label="Auction Feature"
              checked={flags.auction_enabled}
              onChange={() => handleToggle("auction_enabled")}
            />

            {!flags.auction_enabled && (
              <div className="mt-2 animate-fadeIn">
                <textarea
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-600 focus:ring-1 focus:ring-[#00AA5B] focus:outline-none"
                  rows="3"
                  placeholder="Berikan alasan penonaktifan..."
                  value={reasons.auction_enabled}
                  onChange={(e) =>
                    handleReasonChange("auction_enabled", e.target.value)
                  }
                ></textarea>
              </div>
            )}

            {hasChanges("auction_enabled") && (
              <div className="mt-2 flex justify-end animate-fadeIn">
                <button
                  onClick={() => handleSaveFlag("auction_enabled")}
                  disabled={savingFlags.auction_enabled}
                  className="bg-[#00AA5B] hover:bg-[#03924e] text-white font-semibold py-1.5 px-4 rounded-lg transition shadow-sm hover:shadow-md text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingFlags.auction_enabled ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            )}
          </div>

          {/* Live Chat System */}
          <div className="pb-4">
            <Toggle
              label="Live Chat System"
              checked={flags.chat_enabled}
              onChange={() => handleToggle("chat_enabled")}
            />

            {!flags.chat_enabled && (
              <div className="mt-2 animate-fadeIn">
                <textarea
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-600 focus:ring-1 focus:ring-[#00AA5B] focus:outline-none"
                  rows="3"
                  placeholder="Berikan alasan penonaktifan..."
                  value={reasons.chat_enabled}
                  onChange={(e) =>
                    handleReasonChange("chat_enabled", e.target.value)
                  }
                ></textarea>
              </div>
            )}

            {hasChanges("chat_enabled") && (
              <div className="mt-2 flex justify-end animate-fadeIn">
                <button
                  onClick={() => handleSaveFlag("chat_enabled")}
                  disabled={savingFlags.chat_enabled}
                  className="bg-[#00AA5B] hover:bg-[#03924e] text-white font-semibold py-1.5 px-4 rounded-lg transition shadow-sm hover:shadow-md text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingFlags.chat_enabled ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            )}
          </div>

          {/* Checkout Process */}
          <div className="pb-2">
            <Toggle
              label="Checkout Process"
              checked={flags.checkout_enabled}
              onChange={() => handleToggle("checkout_enabled")}
            />

            {!flags.checkout_enabled && (
              <div className="mt-2 animate-fadeIn">
                <textarea
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-600 focus:ring-1 focus:ring-[#00AA5B] focus:outline-none"
                  rows="3"
                  placeholder="Berikan alasan penonaktifan..."
                  value={reasons.checkout_enabled}
                  onChange={(e) =>
                    handleReasonChange("checkout_enabled", e.target.value)
                  }
                ></textarea>
              </div>
            )}

            {hasChanges("checkout_enabled") && (
              <div className="mt-2 flex justify-end animate-fadeIn">
                <button
                  onClick={() => handleSaveFlag("checkout_enabled")}
                  disabled={savingFlags.checkout_enabled}
                  className="bg-[#00AA5B] hover:bg-[#03924e] text-white font-semibold py-1.5 px-4 rounded-lg transition shadow-sm hover:shadow-md text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingFlags.checkout_enabled ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalFlags;
