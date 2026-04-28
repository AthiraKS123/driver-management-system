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
    return <p className="text-center mt-10 text-gray-500">Loading...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex justify-center items-center p-6">
      
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
        
        {/* Top Banner */}
        <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

        {/* Profile Section */}
        <div className="flex flex-col items-center -mt-12 px-6">
          {driver.profileImage && (
            <img
              src={driver.profileImage}
              alt="driver"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
            />
          )}

          <h2 className="text-xl font-bold mt-3">{driver.name}</h2>
          <p className="text-sm text-gray-500">{driver.city}</p>

          {/* Status Badge */}
          <span
            className={`mt-2 px-3 py-1 text-xs rounded-full font-medium ${
              driver.isDeleted
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {driver.isDeleted ? "Deleted" : "Active"}
          </span>
        </div>

        {/* Details */}
        <div className="px-6 py-4 space-y-4">

          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs text-gray-400">Phone</p>
            <p className="font-medium">{driver.phone}</p>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs text-gray-400">Created</p>
            <p className="font-medium">
              {new Date(driver.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs text-gray-400">Last Updated</p>
            <p className="font-medium">
              {new Date(driver.updatedAt).toLocaleString()}
            </p>
          </div>

        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-xl"
          >
            Back
          </button>

          <button
            onClick={() => navigate(`/drivers`)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl"
          >
            All Drivers
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverDetails;