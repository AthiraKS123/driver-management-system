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
    await permanentDelete(id);
    loadTrash();
  };

  // ✅ Calculate remaining days properly
  const getDaysLeft = (deletedAt) => {
    const expiryTime = new Date(deletedAt).getTime() + 7 * 24 * 60 * 60 * 1000;

    const diff = expiryTime - new Date().getTime();

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return days > 0 ? days : 0;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between mb-6">
          <h2 className="text-3xl font-bold">Trash</h2>

          <button
            onClick={() => navigate("/drivers")}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Back
          </button>
        </div>

        {drivers.length === 0 ? (
          <p className="text-center text-gray-500">Trash is empty 🧹</p>
        ) : (
          <div className="grid gap-4">
            {drivers.map((d) => {
              const daysLeft = getDaysLeft(d.deletedAt); // ✅ FIX HERE

              return (
                <div key={d._id} className="bg-white p-5 rounded-xl shadow">
                  <p className="font-semibold">{d.name}</p>
                  <p className="text-gray-600">{d.city}</p>
                  <p className="text-gray-500 text-sm">{d.phone}</p>

                  {/* ✅ Better UX */}
                  <p className="text-red-500 text-sm mt-1">
                    {daysLeft === 0
                      ? "Deleting anytime now ⏳"
                      : `Deleting in ${daysLeft} days ⚠️`}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleRestore(d._id)}
                      className="bg-green-500 text-white px-3 py-1 rounded"
                    >
                      Restore
                    </button>

                    <button
                      onClick={() => handlePermanentDelete(d._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Delete Forever
                    </button>
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
