import React, { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

const Body = () => {
  const [puppies, setPuppies] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    age: "",
  });
  const [editingId, setEditingId] = useState(null);

  const fetchPuppies = async () => {
    try {
      const res = await api.get("/puppies");
      setPuppies(res.data);
    } catch (err) {
      console.error("Failed to fetch puppies", err);
    }
  };

  useEffect(() => {
    fetchPuppies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        // PUT
        const res = await api.put(`/puppies/${editingId}`, {
          ...formData,
          age: Number(formData.age),
        });
        setPuppies((prev) =>
          prev.map((p) => (p.id === editingId ? res.data : p))
        );
      } else {
        // POST
        const res = await api.post("/puppies", {
          ...formData,
          age: Number(formData.age),
        });
        setPuppies((prev) => [...prev, res.data]);
      }

      setFormData({ name: "", breed: "", age: "" });
      setEditingId(null);
    } catch (err) {
      console.error("Failed to save puppy", err);
    }
  };

  const handleEdit = (puppy) => {
    setEditingId(puppy.id);
    setFormData({
      name: puppy.name,
      breed: puppy.breed,
      age: puppy.age.toString(),
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/puppies/${id}`);
      setPuppies((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete puppy", err);
    }
  };

  return (
    <main className="body">
      <section className="table-section">
        <h2>Puppies</h2>
        <table className="puppy-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Breed</th>
              <th>Age</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {puppies.map((puppy) => (
              <tr key={puppy.id}>
                <td>{puppy.id}</td>
                <td>{puppy.name}</td>
                <td>{puppy.breed}</td>
                <td>{puppy.age}</td>
                <td>
                  <button onClick={() => handleEdit(puppy)}>Edit</button>
                  <button onClick={() => handleDelete(puppy.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {puppies.length === 0 && (
              <tr>
                <td colSpan="5">No puppies yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="form-section">
        <h2>{editingId ? "Edit Puppy" : "Add Puppy"}</h2>
        <form onSubmit={handleSubmit} className="puppy-form">
          <label>
            Name:
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Breed:
            <input
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Age:
            <input
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              required
            />
          </label>
          <button type="submit">
            {editingId ? "Update Puppy" : "Add Puppy"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default Body;
