import { useEffect, useState } from "react";
import {
  getTrashDrivers,
  restoreDriver,
  permanentDelete,
} from "../api/driverApi";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

const Trash = () => {
  const { socket, isConnected } = useSocket();
  const [drivers, setDrivers] = useState([]);
  const navigate = useNavigate();

  const loadTrash = async () => {
    try {
      const res = await getTrashDrivers();
      setDrivers(res.data.drivers);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  // ✅ Listen for real-time socket updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on("driver-restored", (driver) => {
      console.log("🔄 Driver restored, removing from trash:", driver._id);
      setDrivers((prev) => prev.filter((d) => d._id !== driver._id));
    });

    socket.on("driver-deleted", (driver) => {
      console.log("🗑️ Driver moved to trash:", driver._id);
      setDrivers((prev) => {
        if (prev.some((d) => d._id === driver._id)) return prev;
        return [driver, ...prev];
      });
    });

    socket.on("driver-permanently-deleted", ({ id }) => {
      console.log("🗑️ Driver permanently deleted from trash:", id);
      setDrivers((prev) => prev.filter((d) => d._id !== id));
    });

    return () => {
      socket.off("driver-restored");
      socket.off("driver-deleted");
      socket.off("driver-permanently-deleted");
    };
  }, [socket, isConnected]);

  const handleRestore = async (id) => {
    await restoreDriver(id);
    loadTrash();
  };

  const handlePermanentDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this driver? This action cannot be undone.")) {
      await permanentDelete(id);
      loadTrash();
    }
  };

  // ✅ Calculate remaining days properly
  const getDaysLeft = (deletedAt) => {
    const expiryTime = new Date(deletedAt).getTime() + 7 * 24 * 60 * 60 * 1000;
    const diff = expiryTime - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-10 relative overflow-hidden">
      {/* Background ambient light - Red tint for trash context */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/10 blur-[150px] mix-blend-screen pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h2 className="text-4xl font-display font-bold text-white tracking-tight flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              Trash Bin
            </h2>
            <p className="text-slate-400 mt-1">Deleted drivers stay here for 7 days before permanent removal.</p>
          </div>

          <button
            onClick={() => navigate("/drivers")}
            className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-5 py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            Back to Dashboard
          </button>
        </div>

        {/* Content */}
        {drivers.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            <p className="text-xl font-medium text-slate-400">Trash is completely empty</p>
            <p className="text-slate-500 mt-2">No deleted drivers pending removal.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {drivers.map((d) => {
              const daysLeft = getDaysLeft(d.deletedAt);

              return (
                <div key={d._id} className="glass-dark p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-red-900/20 hover:border-red-500/30 transition-colors">
                  <div className="flex items-center gap-4">
                    {d.profileImage ? (
                      <img src={d.profileImage} alt={d.name} className="w-14 h-14 rounded-xl object-cover grayscale opacity-70 border border-slate-700" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-500 font-display text-xl">
                        {d.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-display font-bold text-white text-lg">{d.name}</p>
                      <div className="flex gap-3 text-sm text-slate-400">
                        <span>{d.city}</span>
                        <span className="text-slate-600">•</span>
                        <span>{d.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                    <p className={`text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1.5 ${
                      daysLeft === 0 ? "bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                    }`}>
                      {daysLeft === 0 ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                          Deleting anytime now
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                        </>
                      )}
                    </p>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleRestore(d._id)}
                        className="flex-1 sm:flex-none bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 px-4 py-2 rounded-xl transition-colors font-medium flex justify-center"
                      >
                        Restore
                      </button>

                      <button
                        onClick={() => handlePermanentDelete(d._id)}
                        className="flex-1 sm:flex-none bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)] px-4 py-2 rounded-xl transition-colors font-medium flex justify-center"
                      >
                        Delete Forever
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trash;
