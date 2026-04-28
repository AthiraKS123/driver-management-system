import { useEffect, useState } from "react";
import { getTrashDrivers, restoreDriver, permanentDelete } from "../api/driverApi";
import { useNavigate } from "react-router-dom";

const Trash = () => {
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

  const handleRestore = async (id) => {
    await restoreDriver(id);
    loadTrash();
  };

  const handlePermanentDelete = async (id) => {
    await permanentDelete(id);
    loadTrash();
  };


  const getDaysLeft = (deletedAt) => {
  const diffDays =
    (new Date() - new Date(deletedAt)) /
    (1000 * 60 * 60 * 24);

  return Math.max(0, 7 - Math.floor(diffDays));
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
            {drivers.map((d) => (
              <div key={d._id} className="bg-white p-5 rounded-xl shadow">

                <p className="font-semibold">{d.name}</p>
                <p className="text-gray-600">{d.city}</p>
                <p className="text-gray-500 text-sm">{d.phone}</p>
                <p className="text-red-500 text-sm mt-1">
  Deleting in {getDaysLeft(d.deletedAt)} days ⚠️
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trash;