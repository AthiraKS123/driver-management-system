import { useEffect, useState, useRef } from "react";
import {
  fetchDrivers,
  deleteDriver,
  updateDriver,
  fetchDriverStats,
  logoutUser,
  restoreDriver,
} from "../api/driverApi";
import AddDriver from "./AddDriver";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
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
      toast(data.message, {
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          border: '1px solid #334155'
        }
      });
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
    try {
      await deleteDriver(id);
      toast((t) => (
        <span className="flex items-center gap-2">
          Driver moved to trash
          <button
            onClick={async () => {
              await restoreDriver(id);
              toast.dismiss(t.id);
            }}
            className="ml-3 bg-indigo-500 hover:bg-indigo-400 transition-colors text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
          >
            UNDO
          </button>
        </span>
      ), {
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }
      });
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete driver", {
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }
      });
    }
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

  const submitUpdate = async (id) => {
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
      toast.success("Driver updated successfully", {
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update driver", {
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-10 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[150px] mix-blend-screen pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* 🔥 Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-4xl font-display font-bold text-white tracking-tight">Driver Fleet</h2>
            <p className="text-slate-400 mt-1">Manage and monitor your drivers in real-time.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/trash")}
              className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-5 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              Trash
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-medium px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              Logout
            </button>
          </div>
        </div>

        {/* 📊 Bento Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-dark p-6 rounded-3xl md:col-span-1 flex flex-col justify-center items-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-slate-400 font-medium mb-1 relative z-10">Total Fleet</h3>
              <p className="text-5xl font-display font-bold glowing-text text-white relative z-10">
                {stats.totalDrivers}
              </p>
            </div>

            <div className="glass-dark p-6 rounded-3xl md:col-span-2 relative overflow-hidden flex flex-col justify-center">
              <h3 className="text-slate-400 font-medium mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                Drivers by Region
              </h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(stats.cities || {}).length > 0 ? (
                  Object.entries(stats.cities || {}).map(([c, count]) => (
                    <div key={c} className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/50 px-4 py-2.5 rounded-xl shadow-inner">
                      <span className="text-white font-medium capitalize">{c}</span>
                      <span className="bg-indigo-500/20 text-indigo-400 text-sm font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/20">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic">No region data available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 🔘 Toolbar */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md shadow-lg">
          <button
            onClick={() => {
              setShowAddModal(true);
              setShowFilterModal(false);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Add Driver
          </button>
          
          <div className="relative group flex-grow max-w-xs">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="appearance-none w-full bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2.5 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-inner"
            >
              <option value="">Sort: Newest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="-name">Name (Z-A)</option>
              <option value="city">City (A-Z)</option>
              <option value="-city">City (Z-A)</option>
            </select>
            <svg className="absolute right-3 top-3 h-5 w-5 text-slate-400 pointer-events-none group-hover:text-white transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </div>

          <button
            onClick={() => {
              setShowFilterModal(true);
              setShowAddModal(false);
            }}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
            Filter
          </button>

          {(search || city) && (
            <div className="flex items-center gap-2 ml-auto text-sm text-slate-400">
              <span>Filters active</span>
              <button 
                onClick={() => { setSearch(""); setCity(""); setTempSearch(""); setTempCity(""); setPage(1); }}
                className="text-red-400 hover:text-red-300 underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* 🔄 Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* 📦 Driver Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((d) => (
              <div
                key={d._id}
                className="glass-dark p-6 rounded-3xl hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(99,102,241,0.2)] hover:border-indigo-500/30 transition-all duration-300 group flex flex-col"
              >
                {editingId === d._id ? (
                  <div className="flex flex-col h-full space-y-3">
                    <input
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                      placeholder="Name"
                    />
                    <input
                      value={editData.city}
                      onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                      className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                      placeholder="City"
                    />
                    <input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                      placeholder="Phone"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setEditImage(file);
                        if (file) setEditPreview(URL.createObjectURL(file));
                      }}
                      className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20"
                    />
                    {editPreview && (
                      <img src={editPreview} alt="preview" className="w-16 h-16 rounded-2xl object-cover" />
                    )}
                    <div className="flex gap-2 mt-auto pt-4">
                      <button onClick={() => submitUpdate(d._id)} className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 py-2 rounded-xl transition-colors">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-2 rounded-xl transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="relative">
                        {d.profileImage ? (
                          <img src={d.profileImage} alt="driver" className="w-16 h-16 object-cover rounded-2xl border-2 border-slate-700 group-hover:border-indigo-500/50 transition-colors" />
                        ) : (
                          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-slate-700">
                            <span className="text-xl font-display text-slate-500">{d.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        
                        {/* Dynamic Status Dot */}
                        <div className="absolute -bottom-1 -right-1 bg-slate-900 p-1 rounded-full">
                          <div className={`w-3.5 h-3.5 rounded-full shadow-sm
                            ${d.status === "online" ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" : 
                              d.status === "idle" ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" : 
                              "bg-slate-500"}
                          `}></div>
                        </div>
                      </div>

                      <div className="bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                        <p className="text-sm font-display font-medium text-slate-400">#{d.driverId}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-xl font-display font-bold text-white mb-1">{d.name}</h3>
                      <div className="flex flex-col gap-1 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                          <span className="capitalize">{d.city}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                          {d.phone}
                        </span>
                      </div>
                    </div>

                    {/* Status Text Badge */}
                    <div className="mt-auto pt-4 border-t border-slate-800/50 flex justify-between items-center">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md
                        ${d.status === "online" ? "text-green-400 bg-green-500/10" : 
                          d.status === "idle" ? "text-amber-400 bg-amber-500/10" : 
                          "text-slate-400 bg-slate-800"}
                      `}>
                        {d.status || "offline"}
                      </span>

                      <div className="flex gap-2">
                        <button onClick={() => startEdit(d)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-colors" title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        </button>
                        <button onClick={() => navigate(`/drivers/${d._id}`)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-colors" title="View Profile">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                        </button>
                        <button onClick={() => handleDelete(d._id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors" title="Delete">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ❌ Empty */}
        {drivers.length === 0 && !loading && !error && (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <p className="text-xl font-medium text-slate-400">No drivers found</p>
            <p className="text-slate-500 mt-2">Try adjusting your filters or add a new driver.</p>
          </div>
        )}

        {/* 🔢 Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8 pb-8">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl disabled:opacity-50 hover:bg-slate-700 transition-colors"
            >
              Previous
            </button>
            <span className="font-medium text-slate-400 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20"
            >
              Next
            </button>
          </div>
        )}

        {/* ➕ Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
            <div className="bg-slate-900 p-8 rounded-3xl w-full max-w-md border border-slate-800 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
              <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Add New Driver
              </h3>
              
              {/* Note: AddDriver component itself will need styling updates to match, but we embed it here */}
              <div className="mb-6">
                <AddDriver
                  onSuccess={() => {
                    setPage(1);
                    setShowAddModal(false);
                  }}
                />
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium p-3 rounded-xl transition-colors border border-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* 🔍 Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowFilterModal(false)}></div>
            <div className="bg-slate-900 p-8 rounded-3xl w-full max-w-md border border-slate-800 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
              <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
                Filter Drivers
              </h3>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Search Name</label>
                  <input
                    placeholder="e.g. John Doe"
                    value={tempSearch}
                    onChange={(e) => setTempSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">City / Region</label>
                  <input
                    placeholder="e.g. New York"
                    value={tempCity}
                    onChange={(e) => setTempCity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium p-3 rounded-xl transition-colors border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSearch(tempSearch);
                    setCity(tempCity);
                    setPage(1);
                    setShowFilterModal(false);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium p-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Drivers;
