import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDriverById } from "../api/driverApi";

const DriverDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    const loadDriver = async () => {
      try {
        const res = await getDriverById(id);
        setDriver(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadDriver();
  }, [id]);

  if (!driver)
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center p-6 relative overflow-hidden">
      
      {/* Background glowing orb */}
      <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen pointer-events-none"></div>

      <div className="glass-dark w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500 border border-slate-800">
        
        {/* Top Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 relative">
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center -mt-16 px-8">
          <div className="relative">
            {driver.profileImage ? (
              <img
                src={driver.profileImage}
                alt="driver"
                className="w-32 h-32 rounded-full object-cover border-4 border-slate-900 shadow-[0_0_30px_rgba(99,102,241,0.5)] bg-slate-800"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-slate-900 shadow-[0_0_30px_rgba(99,102,241,0.5)] bg-slate-800 flex items-center justify-center text-4xl font-display text-slate-500">
                {driver.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-2 right-2 bg-slate-900 p-1.5 rounded-full">
              <div className={`w-4 h-4 rounded-full shadow-sm ${
                driver.status === "online" ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]" : 
                driver.status === "idle" ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]" : 
                "bg-slate-500"
              }`}></div>
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold mt-4 text-white">{driver.name}</h2>
          <p className="text-lg text-indigo-400 font-medium mb-3 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
            {driver.city}
          </p>

          {/* Status Badge */}
          <span
            className={`px-4 py-1.5 text-xs tracking-wider uppercase rounded-full font-bold border ${
              driver.isDeleted
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            }`}
          >
            {driver.isDeleted ? "Deleted from Fleet" : "Active Driver"}
          </span>
        </div>

        {/* Details Grid */}
        <div className="px-8 py-8 space-y-4">

          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Phone</p>
              <p className="font-medium text-white text-lg">{driver.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Created</p>
              <p className="font-medium text-white text-sm">
                {new Date(driver.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Last Updated</p>
              <p className="font-medium text-white text-sm">
                {new Date(driver.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex gap-4 px-8 pb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium py-3 rounded-xl transition-colors"
          >
            Back
          </button>

          <button
            onClick={() => navigate(`/drivers`)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-colors shadow-[0_0_20px_rgba(99,102,241,0.4)]"
          >
            All Drivers
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverDetails;