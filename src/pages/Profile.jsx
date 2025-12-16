import React, { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../authContext/AuthProvider";
import { useNavigate } from "react-router-dom";

function Profile() {
  const { user, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", address: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
      // if backend provides avatar url, use it as initial preview
      if (user.avatar_url) setAvatarPreview(user.avatar_url);
    }
  }, [user]);

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSave = () => {
    // TODO: wire up to real API to save profile and avatar
    console.log("Save profile", form, { avatarFile });
    // Example upload flow (uncomment and adjust endpoint if your API supports it):
    // if (avatarFile) {
    //   const fd = new FormData();
    //   fd.append('avatar', avatarFile);
    //   // use fetch or axios to post to your upload endpoint
    //   fetch(`${import.meta.env.VITE_API_URL}/profile/avatar`, { method: 'POST', body: fd, credentials: 'include' })
    //     .then(r => r.json())
    //     .then(data => console.log('uploaded', data))
    //     .catch(err => console.error(err));
    // }
    setEditing(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    // optionally make API call to remove avatar from server
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="w-300 mx-auto px-6 py-12">
      <div className="bg-white mt-10 rounded-xl shadow p-6">
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28 rounded-full bg-green-100 overflow-hidden flex items-center justify-center text-3xl font-bold text-green-600">
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-green-600">
                {form.full_name ? form.full_name.split(" ").map(n => n[0]).slice(0,2).join("") : "U"}
              </span>
            )}

            {/* Overlay single remove control when an avatar is present */}
            {avatarPreview && (
              <button>
                
              </button>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">{form.full_name || "User"}</h2>
            <p className="text-sm text-gray-600">{form.email || "No email provided"}</p>
            <p className="text-sm text-gray-600 mt-1">{form.phone || "No phone"}</p>
          </div>

          <div className="flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="px-4 py-2 border-none text-gray-800 rounded-full font-medium border"
            >
              {avatarPreview ? "Change Image" : "Add Image"}
            </button>

            <button
              onClick={() => setEditing((s) => !s)}
              className="px-4 py-2 rounded-full font-medium"
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
            <button
              onClick={() => logout()}
              className="px-4 py-2 border border-gray-200 rounded-full text-sm "
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-6">
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700">Full name</label>
                <input name="full_name" value={form.full_name} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Email</label>
                <input name="email" value={form.email} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Address</label>
                <input name="address" value={form.address} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" />
              </div>

              <div className="md:col-span-2 flex gap-3 mt-2">
                <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 border rounded">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm text-gray-500">Full name</h4>
                <p className="text-lg text-gray-800 mt-1">{form.full_name || "—"}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500">Email</h4>
                <p className="text-lg text-gray-800 mt-1">{form.email || "—"}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500">Phone</h4>
                <p className="text-lg text-gray-800 mt-1">{form.phone || "—"}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500">Address</h4>
                <p className="text-lg text-gray-800 mt-1">{form.address || "—"}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="p-4 bg-white rounded shadow-sm">
            <p className="text-sm text-gray-600">No recent activity to show.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;