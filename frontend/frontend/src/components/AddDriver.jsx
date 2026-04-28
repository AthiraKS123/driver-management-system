import { useState } from "react";
import { addDriver } from "../api/driverApi";

const AddDriver = ({ onSuccess }) => {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState(null);
const [preview, setPreview] = useState(null);

const handleImageChange = (e) => {
  const file = e.target.files[0];
  setImage(file);

  if (file) {
    setPreview(URL.createObjectURL(file)); // 🔥 preview
  }
};

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("city", city);
    formData.append("phone", phone);
if (image) {
  formData.append("profileImage", image);
}    await addDriver(formData);

    setName("");
    setCity("");
    setPhone("");
    setImage(null);
    setPreview(null);

    onSuccess();
  } catch (error) {
    console.error(error);
    alert("Failed to add driver");
  }
};

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 rounded-xl shadow mb-6 max-w-xl mx-auto"
    >
      <h3 className="text-xl font-bold mb-4">Add Driver</h3>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="w-full mb-3 p-2 border rounded"
      />

      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="City"
        className="w-full mb-3 p-2 border rounded"
      />

      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone"
        className="w-full mb-3 p-2 border rounded"
      />
      <input
  type="file"
  accept="image/*"
  onChange={handleImageChange}
  className="w-full mb-3"
/>

{preview && (
  <img
    src={preview}
    alt="preview"
    className="w-20 h-20 object-cover rounded mb-3"
  />
)}

      <button className="bg-green-500 text-white px-4 py-2 rounded">
        Add Driver
      </button>
    </form>
  );
};

export default AddDriver;