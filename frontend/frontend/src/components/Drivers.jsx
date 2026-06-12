import { useEffect, useState } from "react";
import {
  fetchDrivers,
  deleteDriver,
  updateDriver,
  fetchDriverStats,
  logoutUser,
} from "../api/driverApi";
import AddDriver from "./AddDriver";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { restoreDriver } from "../api/driverApi";
import { useRef } from "react";
import { useSocket } from "../context/SocketContext";

const Drivers = () => {
  const { socket, isConnected } = useSocket();
  const [drivers, setDrivers] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [editPreview, setEditPreview] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    city: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempSearch, setTempSearch] = useState("");
  const [tempCity, setTempCity] = useState("");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const isFetching = useRef(false);
  const navigate = useNavigate();

  // 🔌 Socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotification = (data) => {
      console.log("🔔 NOTIFICATION:", data);
      toast(data.message);
    };

    const handleAdd = (driver) => {
      setDrivers((prev) => [driver, ...prev]);
      loadStats();
    };

    const handleDelete = (driver) => {
      setDrivers((prev) => prev.filter((d) => d._id !== driver._id));
      loadStats();
    };

    const handleUpdate = (updatedDriver) => {
      setDrivers((prev) =>
        prev.map((d) => (d._id === updatedDriver._id ? updatedDriver : d)),
      );
      loadStats();
    };

    const handleRestore = (driver) => {
      setDrivers((prev) => (page === 1 ? [driver, ...prev] : prev));
      loadStats();
    };

    const handleStatus = ({ driverId, status }) => {
      setDrivers((prev) =>
        prev.map((driver) =>
          driver._id === driverId ? { ...driver, status } : driver,
        ),
      );
    };

    socket.on("notification", handleNotification);
    socket.on("driver-added", handleAdd);
    socket.on("driver-deleted", handleDelete);
    socket.on("driver-updated", handleUpdate);
    socket.on("driver-restored", handleRestore);
    socket.on("driver-status-changed", handleStatus);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("driver-added", handleAdd);
      socket.off("driver-deleted", handleDelete);
      socket.off("driver-updated", handleUpdate);
      socket.off("driver-restored", handleRestore);
      socket.off("driver-status-changed", handleStatus);
    };
  }, [socket, isConnected, page]);

  /* =========================================
   🟡 IDLE DETECTION
========================================= */

  useEffect(() => {
    if (!socket || !isConnected || drivers.length === 0) return;

    const currentDriverId = drivers[0]._id;

    let idleTimer;

    let isOnline = false;

    const goOnline = () => {
      if (!isOnline) {
        socket.emit("driver-online", currentDriverId);
        isOnline = true;
      }

      clearTimeout(idleTimer);

      idleTimer = setTimeout(() => {
        socket.emit("driver-idle", currentDriverId);
        isOnline = false;
      }, 30000);
    };

    window.addEventListener("mousemove", goOnline);
    window.addEventListener("keydown", goOnline);
    window.addEventListener("click", goOnline);

    goOnline();

    return () => {
      clearTimeout(idleTimer);

      window.removeEventListener("mousemove", goOnline);
      window.removeEventListener("keydown", goOnline);
      window.removeEventListener("click", goOnline);
    };
  }, [socket, isConnected, drivers.length]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        await logoutUser(refreshToken);
      }
    } catch (err) {
      console.error("Logout error:", err);
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    navigate("/login");
  };

  // 🔎 Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // 🚀 Load drivers
  const loadDrivers = async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      setLoading(true);
      setError("");

      const params = { page };

      if (debouncedSearch.trim()) params.search = debouncedSearch;
      if (city.trim()) params.city = city;
      if (sort) params.sort = sort;

      const res = await fetchDrivers(params);

      if (!res || !res.data) return;

      setDrivers(res.data.drivers || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError("Failed to load drivers");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    loadDrivers();
  }, [debouncedSearch, city, page, sort]);

  // 📊 Load stats
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetchDriverStats();
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleDelete = async (id) => {
    await deleteDriver(id);

    toast((t) => (
      <span>
        Driver deleted
        <button
          onClick={async () => {
            await restoreDriver(id);
            toast.dismiss(t.id);
          }}
          className="ml-3 bg-green-500 text-white px-2 py-1 rounded"
        >
          UNDO
        </button>
      </span>
    ));
  };

  // ✏️ Edit
  const startEdit = (driver) => {
    setEditingId(driver._id);
    setEditData({
      name: driver.name,
      city: driver.city,
      phone: driver.phone,
    });

    setEditPreview(driver.profileImage);
  };

  const handleUpdate = async (id) => {
    try {
      const formData = new FormData();

      formData.append("name", editData.name);
      formData.append("city", editData.city);
      formData.append("phone", editData.phone);

      if (editImage) {
        formData.append("profileImage", editImage);
      }

      await updateDriver(id, formData);

      setEditingId(null);
      setEditImage(null);
      setEditPreview(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 🔥 Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Drivers</h2>

          <div className="flex gap-2">
            <button
              onClick={() => navigate("/trash")}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              Trash
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* 🔘 Actions */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <button
            onClick={() => {
              setShowAddModal(true);
              setShowFilterModal(false);
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow"
          >
            + Add Driver
          </button>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="border px-3 py-2 rounded-lg shadow"
          >
            <option value="">Newest</option>
            <option value="name">Name A-Z</option>
            <option value="-name">Name Z-A</option>
            <option value="city">City A-Z</option>
            <option value="-city">City Z-A</option>
          </select>

          <button
            onClick={() => {
              setShowFilterModal(true);
              setShowAddModal(false);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
          >
            Filter
          </button>
        </div>

        {/* 🔄 Loading */}
        {loading && (
          <p className="text-center text-gray-500 animate-pulse">
            Loading drivers...
          </p>
        )}

        {error && <p className="text-center text-red-500">{error}</p>}

        {/* 📊 Stats */}
        {stats && (
          <div className="grid gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow text-center">
              <h3 className="font-semibold">Total Drivers</h3>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalDrivers}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-semibold mb-2">Drivers by City</h3>

              {Object.entries(stats.cities || {}).map(([city, count]) => (
                <div key={city} className="flex justify-between border-b py-1">
                  <span>{city}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📦 Driver List */}
        <div className="grid gap-4">
          {drivers.map((d) => (
            <div
              key={d._id}
              className="bg-white p-5 rounded-2xl shadow-md hover:shadow-lg transition"
            >
              {editingId === d._id ? (
                <>
                  <input
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className="w-full mb-2 p-2 border rounded"
                  />

                  <input
                    value={editData.city}
                    onChange={(e) =>
                      setEditData({ ...editData, city: e.target.value })
                    }
                    className="w-full mb-2 p-2 border rounded"
                  />

                  <input
                    value={editData.phone}
                    onChange={(e) =>
                      setEditData({ ...editData, phone: e.target.value })
                    }
                    className="w-full mb-2 p-2 border rounded"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setEditImage(file);

                      if (file) {
                        setEditPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full mb-2"
                  />
                  {editPreview && (
                    <img
                      src={editPreview}
                      alt="preview"
                      className="w-16 h-16 rounded-full object-cover mb-2"
                    />
                  )}

                  <button
                    onClick={() => handleUpdate(d._id)}
                    className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-400 text-white px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {d.profileImage && (
                    <img
                      src={d.profileImage}
                      alt="driver"
                      className="w-16 h-16 object-cover rounded-full mb-2"
                    />
                  )}
                  <div className="flex items-center gap-2">
  <p className="text-lg font-semibold text-gray-800">
    #{d.driverId}
  </p>

  <p className="text-lg font-semibold text-gray-800">
    {d.name}
  </p>
</div>
                  <p className="text-gray-600">{d.city}</p>
                  <p className="text-gray-500 text-sm">{d.phone}</p>
                  <div className="mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-white text-xs font-semibold
      ${
        d.status === "online"
          ? "bg-green-500"
          : d.status === "idle"
            ? "bg-yellow-500"
            : "bg-red-500"
      }`}
                    >
                      {d.status}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => startEdit(d)}
                      className="bg-yellow-400 hover:bg-yellow-500 px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => navigate(`/drivers/${d._id}`)}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      View
                    </button>

                    <button
                      onClick={() => handleDelete(d._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* ❌ Empty */}
        {drivers.length === 0 && !loading && !error && (
          <p>No drivers found 🚫</p>
        )}

        {/* 🔢 Pagination */}
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="font-medium">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* ➕ Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Add Driver</h3>

              <AddDriver
                onSuccess={() => {
                  setPage(1);
                  setShowAddModal(false);
                }}
              />

              <button
                onClick={() => setShowAddModal(false)}
                className="mt-3 w-full bg-gray-400 text-white p-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* 🔍 Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Filter Drivers</h3>

              <input
                placeholder="Search"
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                className="w-full mb-3 p-2 border rounded"
              />

              <input
                placeholder="City"
                value={tempCity}
                onChange={(e) => setTempCity(e.target.value)}
                className="w-full mb-3 p-2 border rounded"
              />

              <button
                onClick={() => {
                  setSearch(tempSearch);
                  setCity(tempCity);
                  setPage(1);
                  setShowFilterModal(false);
                }}
                className="bg-blue-500 text-white w-full py-2 rounded"
              >
                Apply
              </button>

              <button
                onClick={() => setShowFilterModal(false)}
                className="mt-2 w-full bg-gray-400 text-white p-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Drivers;
