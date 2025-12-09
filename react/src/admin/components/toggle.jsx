const Toggle = ({ label, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <span className={`font-medium text-sm transition-colors duration-300 ${
        checked ? "text-[#00AA5B]" : "text-red-600"
      }`}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none flex items-center ${
          checked ? "bg-[#00AA5B]" : "bg-gray-300"
        }`}
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
};

export default Toggle;
