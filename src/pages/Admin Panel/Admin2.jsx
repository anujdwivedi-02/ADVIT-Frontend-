import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../../authContext/AuthProvider'

const Admin2 = () => {
  // --- 1. Constants & Helpers ---
  const initialFormState = { 
    username: '', email: '', investment_type: '', amount: '', 
    fd_amount: '', mutual_amount: '', retirement_amount: '', 
    fixed_deposit_amount: '', fund_management_amount: '', 
    name: '', address: '', duration: '', month: '', 
    return_rate: '', currency: 'INR', contact: '', pan: '', aadhar: '',
    start_date: '', // ISO string (YYYY-MM-DD)
    invester_id: '',
    password: '',
    profit_value: ''
  }

  const API_BASE = 'http://localhost:3002'

  // --- 2. State Definitions ---
  const [activeTab, setActiveTab] = useState('manage')
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [investmentFilter, setInvestmentFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // FIX: Context Safe Access
  const { user: currentUser, refreshUser } = useContext(AuthContext) || {} 

  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState(initialFormState)
  const [viewUser, setViewUser] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  // --- 3. Format Helpers ---
  const onlyDigits = (value, maxLen) => {
    const d = (value || '').toString().replace(/\D/g, '')
    return typeof maxLen === 'number' ? d.slice(0, maxLen) : d
  }

  const sanitizeDecimal = (value) => {
    if (!value && value !== 0) return ''
    let s = value.toString().replace(/[^0-9.]/g, '')
    const parts = s.split('.')
    if (parts.length <= 1) return parts[0]
    return parts[0] + '.' + parts.slice(1).join('').slice(0, 6)
  }

  const sanitizePan = (value) => {
    if (!value) return ''
    return value.toString().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
  }

  const computeTotalReturns = (amount, ratePercent, years) => {
    const a = parseFloat(amount)
    const r = parseFloat(ratePercent)
    const t = parseFloat(years)
    if (!isFinite(a) || !isFinite(r) || !isFinite(t) || a <= 0 || t <= 0) return null
    const rate = r / 100
    const totalGain = a * (Math.pow(1 + rate, t) - 1)
    return totalGain
  }

  const formatCurrency = (value, currency = 'INR') => {
    if (value === null || value === undefined) return '—'
    try {
      const opts = { maximumFractionDigits: 2 }
      const locale = currency === 'USD' ? 'en-US' : 'en-IN'
      const cur = currency === 'USD' ? 'USD' : 'INR'
      return new Intl.NumberFormat(locale, { ...opts, style: 'currency', currency: cur }).format(value)
    } catch  {
      const num = Number(value)
      if (Number.isFinite(num)) return num.toFixed(2)
      return '—'
    }
  }

  // --- 4. API Logic ---
  const fetchUsers = async (query = '') => {
    setLoading(true)
    setError(null)
    try {
      const url = query 
        ? `${API_BASE}/users/?q=${encodeURIComponent(query)}` 
        : `${API_BASE}/users/`
      
      const res = await axios.get(url)
      setUsers(res.data || [])
    } catch (err) {
      console.error('Failed to fetch users', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // --- 5. Effects ---
  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers(searchTerm)
    }, 400)
    return () => clearTimeout(t)
  }, [searchTerm])

  // --- 6. Handlers ---
  const openEdit = (u) => {
    setEditingUser(u)
    setEditForm({
      username: u.username || u.name || '',
      email: u.email || '',
      investment_type: u.investment_type || '',
      amount: u.amount || '',
      fd_amount: u.fd_amount || '',
      mutual_amount: u.mutual_amount || '',
      retirement_amount: u.retirement_amount || '',
      fixed_deposit_amount: u.fixed_deposit_amount || '',
      fund_management_amount: u.fund_management_amount || '',
      name: u.name || '',
      address: u.address || '',
      duration: u.duration || '',
      month: u.month || '',
      return_rate: u.return_rate || '',
      currency: u.currency || 'INR',
      contact: u.contact || '',
      pan: u.pan || '',
      aadhar: u.aadhar || '',
      start_date: u.start_date || '',
      invester_id: u.invester_id || '',
      password: '',
      profit_value: u.profit_value || ''
    })
  }
  const openView = (u) => {
    setViewUser(u)
    setEditingUser(null)
  }
  const closeView = () => {
    setViewUser(null)
    setEditingUser(null)
  }

  const closeEdit = () => {
    setEditingUser(null)
    setEditForm(initialFormState)
  }

  const preparePayload = (form) => {
    return {
      ...form,
      amount: Number(form.amount) || 0,
      duration: Number(form.duration) || 0,
      return_rate: Number(form.return_rate) || 0,
      month: Number(form.month) || 0,
      fd_amount: Number(form.fd_amount) || 0,
      mutual_amount: Number(form.mutual_amount) || 0,
      retirement_amount: Number(form.retirement_amount) || 0,
      fixed_deposit_amount: Number(form.fixed_deposit_amount) || 0,
      fund_management_amount: Number(form.fund_management_amount) || 0,
      username: form.username || form.name,
      invester_id: form.invester_id,
      password: form.password,
      profit_value: Number(form.profit_value) || 0
    }
  }

  const saveEdit = async () => {
    if (!editingUser) return
    try {
      const payload = preparePayload(editForm)
      const userId = editingUser._id || editingUser.id;
      
      const res = await axios.patch(`${API_BASE}/users/${userId}/`, payload)
      const updated = res.data
      
      setUsers((prev) => prev.map((p) => {
          const pId = p._id || p.id;
          const uId = updated._id || updated.id;
          return pId === uId ? updated : p
      }))
      
      const editedMatchesCurrent = currentUser && ((updated.id && updated.id === currentUser.id) || (updated.email && updated.email === currentUser.email));
      if (editedMatchesCurrent && refreshUser) {
        await refreshUser()
      }
      
      await fetchUsers(searchTerm)
      alert('User updated successfully')
      closeEdit()
    } catch (err) {
      console.error('Failed to update user', err)
      alert('Update failed: ' + (err.response?.data?.message || err.message))
    }
  }

  const addUser = async () => {
    try {
      // Frontend validation
      if (!editForm.name || editForm.name.trim().length < 3) {
        alert('Name must be at least 3 characters long');
        return;
      }
      if (!editForm.invester_id || editForm.invester_id.trim().length < 3) {
        alert('Invester ID must be at least 3 characters long');
        return;
      }
      if (!editForm.password || editForm.password.length < 5) {
        alert('Password must be at least 5 characters long');
        return;
      }
      if (!editForm.email) {
        alert('Email is required');
        return;
      }

      // Check for duplicate invester_id in current users (frontend only)
      const duplicate = users.find(u => u.invester_id === editForm.invester_id);
      if (duplicate) {
        alert('Invester ID already exists. Please use a unique ID.');
        return;
      }

      const payload = preparePayload(editForm);
      await axios.post(`${API_BASE}/users/`, payload);
      await fetchUsers();
      alert('User Added Successfully!');
      setEditForm(initialFormState);
      setActiveTab('manage');
    } catch (err) {
      console.error('Failed to add user', err);
      const msg = err.response?.data?.message || err.message || 'Add user failed';
      alert('Add user failed: ' + msg);
    }
  }

  const [deleteUserId, setDeleteUserId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const handleDelete = async (id) => {
    if (!id) return alert('Cannot determine user id');
    setDeleteUserId(id);
    setShowDeleteConfirm(true);
  };
  const confirmDelete = async () => {
    if (!deleteUserId) return;
    try {
      await axios.delete(`${API_BASE}/users/${deleteUserId}`);
      await fetchUsers(searchTerm);
      setShowDeleteConfirm(false);
      setDeleteUserId(null);
    } catch (err) {
      console.error('Delete failed', err);
      const msg = err.response?.data?.message || err.message || 'Delete failed';
      alert('Delete failed: ' + msg);
      setShowDeleteConfirm(false);
      setDeleteUserId(null);
    }
  };
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteUserId(null);
  };

  // --- 7. Filtered Users ---
  let filteredUsers = users;
  if (investmentFilter) {
    filteredUsers = filteredUsers.filter(u => (u.investment_type || '').toLowerCase() === investmentFilter.toLowerCase());
  }
  if (yearFilter) {
    filteredUsers = filteredUsers.filter(u => String(u.duration || u.investment?.duration || '') === yearFilter);
  }

  // --- 8. Render ---
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r shadow-sm flex flex-col">
        <div className="p-6 text-xl font-bold text-blue-600 border-b">ADMIN Panel</div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('manage')} className={`w-full text-left p-3 rounded ${activeTab === 'manage' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
            Manage Users
          </button>
          <button onClick={() => setActiveTab('registration')} className={`w-full text-left p-3 rounded ${activeTab === 'registration' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
            User Registration
          </button>
        </nav>
        <div className="p-4 border-t">
          {/* <Link to="/admin/login" className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 transition">Log Out</Link> */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white p-4 shadow-sm flex justify-between items-center">
          <div className="flex space-x-4">
            <input 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                type="text" 
                placeholder="Search by Name or Email..." 
                className="border p-2 rounded text-sm w-64" 
            />
          </div>
          <button className="bg-gray-200 p-2 rounded-full hover:bg-gray-300">⚙️</button>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {/* Filter Dropdown for Manage Users */}
          {activeTab === 'manage' && (
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <label className="font-medium">Filter by Investment Type:</label>
              <select
                className="border p-2 rounded"
                value={investmentFilter}
                onChange={e => setInvestmentFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="Fixed Deposit">Fixed Deposit</option>
                <option value="SIP">SIP</option>
                <option value="Fund Management">Fund Management</option>
                <option value="Retirement Planning">Retirement Planning</option>
              </select>
              <label className="font-medium ml-4">Year:</label>
              <select
                className="border p-2 rounded"
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
              >
                <option value="">All</option>
                {[...new Set(users.map(u => String(u.duration || u.investment?.duration || '')).filter(Boolean))].sort((a,b)=>a-b).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
          {activeTab === 'registration' && (
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-6 text-gray-700 border-b pb-2">User Registration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Name</label>
                  <input value={editForm.name} onChange={(e) => setEditForm(s => ({ ...s, name: e.target.value }))} type="text" className="mt-1 w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Enter Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Invester ID</label>
                  <input value={editForm.invester_id} onChange={(e) => setEditForm(s => ({ ...s, invester_id: e.target.value }))} type="text" className="mt-1 w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Enter Invester ID" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Password</label>
                  <div className="relative">
                    <input
                      value={editForm.password}
                      onChange={(e) => setEditForm(s => ({ ...s, password: e.target.value }))}
                      type={showPassword ? "text" : "password"}
                      className="mt-1 w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none pr-10"
                      placeholder="Enter Password"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m1.875-2.25A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-1.875 2.25A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m1.875-2.25A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-1.875 2.25A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                  <input value={editForm.email} onChange={(e) => setEditForm(s => ({ ...s, email: e.target.value }))} type="email" className="mt-1 w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Enter Email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Address</label>
                  <input value={editForm.address} onChange={(e) => setEditForm(s => ({ ...s, address: e.target.value }))} type="text" className="mt-1 w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Enter Address" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Start Date</label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={e => setEditForm(s => ({ ...s, start_date: e.target.value }))}
                    className="mt-1 w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">Investment Type</label>
                  <select value={editForm.investment_type} onChange={(e) => setEditForm(s => ({ ...s, investment_type: e.target.value }))} className="mt-1 w-full border p-2 rounded">
                    <option value="">Select</option>
                    <option value="SIP">SIP</option>
                    <option value="Fixed Deposit">Fixed Deposit</option>
                    <option value="Fund Management">Fund Management</option>
                    <option value="Retirement Planning">Retirement Planning</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Duration (Years)</label>
                  <input value={editForm.duration} onChange={(e) => setEditForm(s => ({ ...s, duration: onlyDigits(e.target.value) }))} type="text" inputMode="numeric" className="mt-1 w-full border p-2 rounded" placeholder="3" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">Month</label>
                  <select value={editForm.month} onChange={(e) => setEditForm(s => ({ ...s, month: e.target.value }))} className="mt-1 w-full border p-2 rounded">
                    <option value="">Select Month</option>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">Invested Amount</label>
                  <input value={editForm.amount} onChange={(e) => setEditForm(s => ({ ...s, amount: onlyDigits(e.target.value) }))} type="text" inputMode="numeric" className="mt-1 w-full border p-2 rounded" placeholder="100000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Return Rate (%)</label>
                  <input value={editForm.return_rate} onChange={(e) => setEditForm(s => ({ ...s, return_rate: sanitizeDecimal(e.target.value) }))} type="text" inputMode="decimal" className="mt-1 w-full border p-2 rounded" placeholder="12" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600"> Profit Amount </label>
                  <input value={editForm.profit_value} onChange={(e) => setEditForm(s => ({ ...s, profit_value: sanitizeDecimal(e.target.value) }))} type="text" inputMode="decimal" className="mt-1 w-full border p-2 rounded" placeholder="12" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Current Amount</label>
                  <input value={editForm.current_amount} onChange={(e) => setEditForm(s => ({ ...s, current_amount: sanitizeDecimal(e.target.value) }))} type="text" inputMode="decimal" className="mt-1 w-full border p-2 rounded" placeholder="12" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">Currency</label>
                  <div className="mt-2 space-x-4">
                    <label><input checked={editForm.currency === 'INR'} onChange={() => setEditForm(s => ({ ...s, currency: 'INR' }))} type="radio" name="currency" value="INR" /> INR</label>
                    <label><input checked={editForm.currency === 'USD'} onChange={() => setEditForm(s => ({ ...s, currency: 'USD' }))} type="radio" name="currency" value="USD" /> USD</label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">Contact Number</label>
                  <input value={editForm.contact} onChange={(e) => setEditForm(s => ({ ...s, contact: onlyDigits(e.target.value, 10) }))} type="text" inputMode="numeric" maxLength={10} className="mt-1 w-full border p-2 rounded" placeholder="10 digits" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">PAN Number</label>
                  <input value={editForm.pan} onChange={(e) => setEditForm(s => ({ ...s, pan: sanitizePan(e.target.value) }))} type="text" inputMode="text" maxLength={10} className="mt-1 w-full border p-2 rounded" placeholder="ABCDE1234F" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Adhar Number</label>
                  <input value={editForm.aadhar} onChange={(e) => setEditForm(s => ({ ...s, aadhar: onlyDigits(e.target.value, 12) }))} type="text" inputMode="numeric" maxLength={12} className="mt-1 w-full border p-2 rounded" placeholder="12 digits" />
                </div>
              </div>

              <div className="mt-10 flex justify-between">
                <button onClick={() => setEditForm(initialFormState)} className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition">RESET Form</button>
                <button onClick={addUser} className="px-8 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow-lg transition">Register User</button>
              </div>
            </div>
          )}

          {/* Manage Tab */}
          {activeTab === 'manage' && (
            <div className="bg-white rounded shadow p-4">
              <h1 className="text-2xl font-bold mb-4">All Users</h1>
              {loading && <div>Loading users...</div>}
              {error && <div className="text-red-500">{error}</div>}
              {!loading && (
                <div className="overflow-x-auto">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full table-auto">
                      <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">Email</th>
                          <th className="px-4 py-2 text-left">Investment Type</th>
                          <th className="px-4 py-2 text-left">Total Returns</th>
                          <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No current user exist</td>
                          </tr>
                        )}
                        {filteredUsers.map((u) => {
                          const amt = u.amount ?? u.investment?.amount
                          const rate = u.return_rate ?? u.investment?.return_rate
                          const yrs = u.duration ?? u.investment?.duration
                          const gain = computeTotalReturns(amt, rate, yrs)
                          return (
                            <tr key={u._id || u.id || u.email} className="border-t hover:bg-gray-50 cursor-pointer">
                              <td className="px-4 py-3">{u.name || u.username || '—'}</td>
                              <td className="px-4 py-3">{u.email || '—'}</td>
                              <td className="px-4 py-3">{u.investment_type || '—'}</td>
                              <td className="px-4 py-3">{gain !== null ? formatCurrency(gain, u.currency || 'INR') : '—'}</td>
                              <td className="px-4 py-3 flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openView(u);
                                  }}
                                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                >
                                  View
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(u);
                                  }}
                                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                >
                                  Edit
                                </button>
                              
                                                    {/* Delete Confirmation Modal */}
                                                    {showDeleteConfirm && (
                                                      <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: 'none'}}>
                                                        <div className="bg-white p-6 rounded shadow max-w-sm w-full">
                                                          <h3 className="text-lg font-semibold mb-4">Are you sure you want to delete this user?</h3>
                                                          <div className="flex justify-end gap-4">
                                                            <button onClick={cancelDelete} className="px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
                                                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    )}
                                          {/* View Modal */}
                                          {viewUser && (
                                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
                                              <div className="bg-white p-6 rounded shadow max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                                <div className="flex justify-between items-center mb-4 border-b pb-2">
                                                  <h3 className="text-xl font-semibold">View User: {viewUser.name}</h3>
                                                  <div className="flex items-center gap-4">
                                                    {/* Days Left Top Right */}
                                                    <span className="bg-green-100 text-green-700 font-semibold px-4 py-1 rounded-full text-sm flex flex-col items-end">
                                                      <span>Days Left:</span>
                                                      <span>
                                                        {(() => {
                                                          if (!viewUser.start_date || !viewUser.duration) return '—';
                                                          const start = new Date(viewUser.start_date);
                                                          const years = parseFloat(viewUser.duration);
                                                          if (!years || isNaN(start.getTime())) return '—';
                                                          const end = new Date(start);
                                                          end.setFullYear(start.getFullYear() + years);
                                                          const now = new Date();
                                                          let diff = end - now;
                                                          if (diff <= 0) return '0 years 0 months 0 days';
                                                          // Calculate years, months, days
                                                          let days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                          let y = Math.floor(days / 365);
                                                          let m = Math.floor((days % 365) / 30.44);
                                                          let d = Math.floor((days % 365) % 30.44);
                                                          return `${y} years ${m} months ${d} days`;
                                                        })()}
                                                      </span>
                                                    </span>
                                                    <button onClick={closeView} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                                                  </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  <div>
                                                    <label className="block text-sm font-medium">Invester ID</label>
                                                    <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.invester_id || '—'}</div>
                                                  </div>
                                                  <div>
                                                    <label className="block text-sm font-medium">Password</label>
                                                    <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.password || '—'}</div>
                                                  </div>
                                                                                                    <div>
                                                                                                      <label className="block text-sm font-medium">Start Date</label>
                                                                                                      <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.start_date ? new Date(viewUser.start_date).toLocaleDateString() : '—'}</div>
                                                                                                    </div>

                                                  <div>
                                                    <label className="block text-sm font-medium">Full Name</label>
                                                    <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.name}</div>
                                                  </div>
                                                  <div>
                                                    <label className="block text-sm font-medium">Email</label>
                                                    <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.email}</div>
                                                  </div>
                                                  <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium">Address</label>
                                                    <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.address}</div>
                                                  </div>
                                                  <div>
                                                    <label className="block text-sm font-medium">Investment Type</label>
                                                    <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.investment_type}</div>
                                                  </div>
                                                  <div>
                                                    <label className="block text-sm font-medium">Currency</label>
                                                    <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.currency}</div>
                                                  </div>
                                                  <div>
                                                    <label className="block text-sm font-medium">Invested Amount</label>
                                                    <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.amount}</div>
                                                  </div>
                                                 
                                                   <div>
                                                    <label className="block text-sm font-medium">Profit Amount</label>
                                                    <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.profit_value}</div>
                                                  </div>
                                                   <div>
                                                    <label className="block text-sm font-medium">Curent Amount</label>
                                                    <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.current_amount}</div>
                                                  </div>

                                                  <div>
                                                    <label className="block text-sm font-medium">Return Rate (%)</label>
                                                    <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.return_rate}</div>
                                                  </div>
                                                  <div>
                                                    <label className="block text-sm font-medium">Duration (Years)</label>
                                                    <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.duration}</div>
                                                  </div>
                                                  <div>
                                                    <label className="block text-sm font-medium">Month</label>
                                                    <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.month}</div>
                                                  </div>
                                                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-2 border-t pt-2">
                                                    <div>
                                                      <label className="block text-sm font-medium">Contact</label>
                                                      <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.contact}</div>
                                                    </div>
                                                    <div>
                                                      <label className="block text-sm font-medium">PAN</label>
                                                      <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.pan}</div>
                                                    </div>
                                                    <div>
                                                      <label className="block text-sm font-medium">Aadhar</label>
                                                      <div className="w-full px-3 py-2 border rounded bg-gray-100">{viewUser.aadhar}</div>
                                                    </div>
                                                  </div>
                                                  <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-2 bg-gray-50 p-2 rounded">
                                                    <div>
                                                      <label className="block text-xs text-gray-500">FD Amount</label>
                                                      <div className="w-full px-2 py-1 border rounded text-sm bg-gray-100">{viewUser.fd_amount}</div>
                                                    </div>
                                                    <div>
                                                      <label className="block text-xs text-gray-500">Mutual Amt</label>
                                                      <div className="w-full px-2 py-1 border rounded text-sm bg-gray-100">{viewUser.mutual_amount}</div>
                                                    </div>
                                                    <div>
                                                      <label className="block text-xs text-gray-500">Retirement Amt</label>
                                                      <div className="w-full px-2 py-1 border rounded text-sm bg-gray-100">{viewUser.retirement_amount}</div>
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="mt-4 flex justify-end border-t pt-4">
                                                  <button className="px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200" onClick={closeView}>Close</button>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(u._id || u.id);
                                  }}
                                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit Modal */}
          {editingUser && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
              <div className="bg-white p-6 rounded shadow max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-xl font-semibold">Edit User: {editingUser.name}</h3>
                    <button onClick={closeEdit} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ... Same Edit Fields as Registration ... */}
                  <div>
                    <label className="block text-sm font-medium">Full Name</label>
                    <input className="w-full px-3 py-2 border rounded" value={editForm.name} onChange={(e) => setEditForm(s => ({ ...s, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Invester ID</label>
                    <input className="w-full px-3 py-2 border rounded" value={editForm.invester_id} onChange={(e) => setEditForm(s => ({ ...s, invester_id: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Password</label>
                    <input className="w-full px-3 py-2 border rounded" type="password" value={editForm.password} onChange={(e) => setEditForm(s => ({ ...s, password: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input className="w-full px-3 py-2 border rounded" value={editForm.email} onChange={(e) => setEditForm(s => ({ ...s, email: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Address</label>
                    <input className="w-full px-3 py-2 border rounded" value={editForm.address} onChange={(e) => setEditForm(s => ({ ...s, address: e.target.value }))} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Investment Type</label>
                    <select className="w-full px-3 py-2 border rounded" value={editForm.investment_type} onChange={(e) => setEditForm(s => ({ ...s, investment_type: e.target.value }))}>
                      <option value="">Select</option>
                      <option value="SIP">SIP</option>
                      <option value="Fixed Deposit">Fixed Deposit</option>
                      <option value="Fund Management">Fund Management</option>
                      <option value="Retirement Planning">Retirement Planning</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Currency</label>
                    <select className="w-full px-3 py-2 border rounded" value={editForm.currency} onChange={(e) => setEditForm(s => ({ ...s, currency: e.target.value }))}>
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Main Amount</label>
                    <input className="w-full px-3 py-2 border rounded" value={editForm.amount} onChange={(e) => setEditForm(s => ({ ...s, amount: onlyDigits(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Return Rate (%)</label>
                    <input className="w-full px-3 py-2 border rounded" value={editForm.return_rate} onChange={(e) => setEditForm(s => ({ ...s, return_rate: sanitizeDecimal(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Profit Amount </label>
                    <input className="w-full px-3 py-2 border rounded" value={editForm.profit_value} onChange={(e) => setEditForm(s => ({ ...s, profit_value: sanitizeDecimal(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Current Amount </label>
                    <input className="w-full px-3 py-2 border rounded" value={editForm.current_amount} onChange={(e) => setEditForm(s => ({ ...s, current_amount: sanitizeDecimal(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Duration (Years)</label>
                    <input className="w-full px-3 py-2 border rounded" value={editForm.duration} onChange={(e) => setEditForm(s => ({ ...s, duration: onlyDigits(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Month</label>
                    <input className="w-full px-3 py-2 border rounded" value={editForm.month} onChange={(e) => setEditForm(s => ({ ...s, month: onlyDigits(e.target.value) }))} />
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-2 border-t pt-2">
                     <div>
                        <label className="block text-sm font-medium">Contact</label>
                        <input className="w-full px-3 py-2 border rounded" value={editForm.contact} onChange={(e) => setEditForm(s => ({ ...s, contact: onlyDigits(e.target.value, 10) }))} maxLength={10}/>
                     </div>
                     <div>
                        <label className="block text-sm font-medium">PAN</label>
                        <input className="w-full px-3 py-2 border rounded" value={editForm.pan} onChange={(e) => setEditForm(s => ({ ...s, pan: sanitizePan(e.target.value) }))} maxLength={10}/>
                     </div>
                     <div>
                        <label className="block text-sm font-medium">Aadhar</label>
                        <input className="w-full px-3 py-2 border rounded" value={editForm.aadhar} onChange={(e) => setEditForm(s => ({ ...s, aadhar: onlyDigits(e.target.value, 12) }))} maxLength={12}/>
                     </div>
                  </div>

                   <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-2 bg-gray-50 p-2 rounded">
                    <div>
                        <label className="block text-xs text-gray-500">FD Amount</label>
                        <input className="w-full px-2 py-1 border rounded text-sm" value={editForm.fd_amount} onChange={(e) => setEditForm(s => ({ ...s, fd_amount: onlyDigits(e.target.value) }))} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">Mutual Amt</label>
                        <input className="w-full px-2 py-1 border rounded text-sm" value={editForm.mutual_amount} onChange={(e) => setEditForm(s => ({ ...s, mutual_amount: onlyDigits(e.target.value) }))} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">Retirement Amt</label>
                        <input className="w-full px-2 py-1 border rounded text-sm" value={editForm.retirement_amount} onChange={(e) => setEditForm(s => ({ ...s, retirement_amount: onlyDigits(e.target.value) }))} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                  <button className="px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200" onClick={closeEdit}>Cancel</button>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={saveEdit}>Save Changes</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

export default Admin2