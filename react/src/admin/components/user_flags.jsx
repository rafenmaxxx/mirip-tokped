import { useState, useEffect } from "react";
import { showToast } from "../../lib/toast";
import Toggle from "./toggle";
import Icons from "./icons";

const UserFlags = ({ isOpen, onClose, user }) => {
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

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Store snapshot of original state for rollback on error
  const [flagsSnapshot, setFlagsSnapshot] = useState({});
  const [reasonsSnapshot, setReasonsSnapshot] = useState({});
  const [globalFlagsSnapshot, setGlobalFlagsSnapshot] = useState({});

  useEffect(() => {
    if (isOpen && user?.userId) {
      fetchUserFlags();
    }
  }, [isOpen, user?.userId]);

  const fetchUserFlags = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const globalRes = await fetch(
        "http://localhost:80/node/api/flags/global",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      let globalFlags = {};
      let globalReasons = {};

      if (globalRes.ok) {
        const globalData = await globalRes.json();
        globalFlags = globalData.data;

        const globalRestrictionsRes = await fetch(
          "http://localhost:80/node/api/flags/restrictions/global",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (globalRestrictionsRes.ok) {
          const globalRestrictionsData = await globalRestrictionsRes.json();
          globalRestrictionsData.data.forEach((item) => {
            globalReasons[item.feature_name] =
              item.reason || "Disabled by admin";
          });
        }
      }

      const response = await fetch(
        `http://localhost:80/node/api/flags/user/${user.userId}`,
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
          `http://localhost:80/node/api/flags/restrictions/${user.userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const newReasons = {};
        const userSpecificFeatures = new Set();

        if (restrictionsRes.ok) {
          const restrictionsData = await restrictionsRes.json();
          restrictionsData.data.forEach((item) => {
            newReasons[item.feature_name] = item.reason || "";
            userSpecificFeatures.add(item.feature_name);
          });
        }

        // If global flag is disabled and user inherits it (NO user-specific entry), prefix with [Global]
        Object.keys(globalFlags).forEach((featureName) => {
          if (
            !globalFlags[featureName] &&
            !data.data[featureName] &&
            !userSpecificFeatures.has(featureName)
          ) {
            newReasons[featureName] = `[Global] ${
              globalReasons[featureName] || "Disabled by admin"
            }`;
          }
        });

        setReasons(newReasons);
        setFlagsSnapshot({ ...data.data });
        setReasonsSnapshot({ ...newReasons });
        setGlobalFlagsSnapshot({ ...globalFlags });
      }
    } catch (error) {
      console.error("Error fetching user flags:", error);
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

  const handleSave = async () => {
    try {
      // Validate: if any flag is disabled, reason must be provided
      for (const [featureName, isEnabled] of Object.entries(flags)) {
        if (!isEnabled) {
          const reason = reasons[featureName]?.trim();
          const isGlobalInherited = reason?.startsWith("[Global]");

          if (!reason && !isGlobalInherited) {
            showToast("Tidak ada alasan!", `Alasan penonaktifan untuk ${featureName.replace(
              "_enabled",
              ""
            )} harus diisi!`, "error");
            setFlags(flagsSnapshot);
            setReasons(reasonsSnapshot);
            return;
          }

          // Validate: if disabled and not global inherited, reason must be at least 10 characters
          const cleanReason = isGlobalInherited ? reason.replace("[Global] ", "").trim() : reason;
          if (!isGlobalInherited && cleanReason.length < 10) {
            showToast("Alasan kurang lengkap!", `Alasan penonaktifan untuk ${featureName.replace(
              "_enabled",
              ""
            )} minimal 10 karakter!`, "error");
            setFlags(flagsSnapshot);
            setReasons(reasonsSnapshot);
            return;
          }
        }
      }

      setSaving(true);
      const token = localStorage.getItem("accessToken");

      // Update each flag
      for (const [featureName, isEnabled] of Object.entries(flags)) {
        const originalEnabled = flagsSnapshot[featureName];
        const originalReason = reasonsSnapshot[featureName];
        const currentReason = reasons[featureName]?.trim();
        const globalEnabled = globalFlagsSnapshot[featureName];

        let shouldUpdate = false;
        let cleanReason = null;

        const flagChanged = isEnabled !== originalEnabled;

        const originalReasonClean = originalReason?.startsWith("[Global]")
          ? originalReason.replace("[Global] ", "").trim()
          : originalReason;
        const currentReasonClean = currentReason?.startsWith("[Global]")
          ? currentReason.replace("[Global] ", "").trim()
          : currentReason;
        const reasonChanged = currentReasonClean !== originalReasonClean;

        const wasInheriting = originalReason?.startsWith("[Global]");
        const isInheriting = currentReason?.startsWith("[Global]");

        // ada perubahan flag atau reason
        if (flagChanged || (reasonChanged && !isInheriting)) {
          shouldUpdate = true;
          cleanReason = isEnabled ? null : currentReasonClean;
        }
        // perubahan reason tanpa mengubah flag global
        else if (wasInheriting && isInheriting && reasonChanged) {
          shouldUpdate = true;
          cleanReason = currentReasonClean;
        }
        // sama semua
        else if (isEnabled === globalEnabled && wasInheriting && isInheriting) {
          shouldUpdate = false; // tidak perlu update
        }

        // Skip update if no changes detected
        if (!shouldUpdate) {
          continue;
        }

        const response = await fetch(
          `http://localhost:80/node/api/flags/user/${user.userId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              featureName,
              isEnabled,
              reason: cleanReason,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Gagal mengupdate ${featureName}`);
        }
      }

      showToast("Berhasil!", "User flags berhasil diupdate!", "success");
      setFlagsSnapshot({ ...flags });
      setReasonsSnapshot({ ...reasons });
      onClose();
    } catch (error) {
      console.error("Error saving user flags:", error);

      setFlags(flagsSnapshot);
      setReasons(reasonsSnapshot);

      showToast("Gagal menyimpan perubahan", error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity">
      {/* Modal Content */}
      <div className="bg-white rounded-xl shadow-2xl w-[400px] p-8 relative animate-fadeInScale">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <Icons.X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-[#00AA5B] font-bold text-2xl">User Flags</h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
            {user?.name}
          </p>
          <div className="h-0.5 w-full bg-gray-200 mt-4"></div>
        </div>

        {/* Toggles */}
        {loading ? (
          <div className="space-y-3 mb-8 px-2">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-100 rounded mb-2"></div>
              <div className="h-10 bg-gray-100 rounded mb-2"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 mb-8 px-2">
            <Toggle
              label="Auction Feature"
              checked={flags.auction_enabled}
              onChange={() => handleToggle("auction_enabled")}
            />

            {!flags.auction_enabled && (
              <div className="mb-4 animate-fadeIn">
                <textarea
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-600 focus:ring-1 focus:ring-[#00AA5B] focus:outline-none"
                  rows="3"
                  placeholder="Berikan alasan penonaktifan user-specific..."
                  value={reasons.auction_enabled}
                  onChange={(e) =>
                    handleReasonChange("auction_enabled", e.target.value)
                  }
                ></textarea>
              </div>
            )}

            <Toggle
              label="Live Chat System"
              checked={flags.chat_enabled}
              onChange={() => handleToggle("chat_enabled")}
            />

            {!flags.chat_enabled && (
              <div className="mb-4 animate-fadeIn">
                <textarea
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-600 focus:ring-1 focus:ring-[#00AA5B] focus:outline-none"
                  rows="3"
                  placeholder="Berikan alasan penonaktifan user-specific..."
                  value={reasons.chat_enabled}
                  onChange={(e) =>
                    handleReasonChange("chat_enabled", e.target.value)
                  }
                ></textarea>
              </div>
            )}

            <Toggle
              label="Checkout Process"
              checked={flags.checkout_enabled}
              onChange={() => handleToggle("checkout_enabled")}
            />

            {!flags.checkout_enabled && (
              <div className="mb-4 animate-fadeIn">
                <textarea
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-600 focus:ring-1 focus:ring-[#00AA5B] focus:outline-none"
                  rows="3"
                  placeholder="Berikan alasan penonaktifan user-specific..."
                  value={reasons.checkout_enabled}
                  onChange={(e) =>
                    handleReasonChange("checkout_enabled", e.target.value)
                  }
                ></textarea>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-[#00AA5B] hover:bg-[#03924e] text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all active:scale-95 hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserFlags;
