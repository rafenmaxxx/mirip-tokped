function AttachmentModal({ show, onClose }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-xl w-64 shadow-xl">
        <p className="font-semibold mb-3">Pilih Attachment</p>
        <div className="flex flex-col gap-2">
          <button className="p-2 bg-gray-100 rounded">Foto</button>
          <button className="p-2 bg-gray-100 rounded">Dokumen</button>
          <button className="p-2 bg-gray-100 rounded">Kamera</button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full p-2 bg-red-500 text-white rounded"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

export default AttachmentModal;
