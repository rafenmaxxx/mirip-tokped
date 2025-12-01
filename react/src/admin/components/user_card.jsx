const UserCard = ({ user, onManage }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex space-x-4">
      <div className="w-24 h-24 bg-[#00AA5B] rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-inner">
        <span className="font-semibold text-sm">Foto</span>
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">{user.name}</h3>
              <p className="text-[10px] text-gray-400 uppercase">
                ID: {user.id}
              </p>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-600 font-medium">{user.role}</p>
            <p className="text-xs text-gray-500">Active since: {user.date}</p>
          </div>
        </div>
        <div className="mt-2 flex justify-between items-end">
          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
              Balance
            </p>
            <p className="text-sm font-bold text-gray-800">{user.balance}</p>
          </div>

          <button
            onClick={() => onManage(user)}
            className="bg-[#00AA5B] hover:bg-[#03924e] text-white text-xs font-medium px-4 py-2 rounded-md transition shadow-sm"
          >
            Kelola Flags
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
