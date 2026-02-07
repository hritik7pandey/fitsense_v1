'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';

const SUPER_ADMIN_EMAIL = '224spy@gmail.com';

interface PaymentInstallment {
  id: number;
  amount: number;
  paymentMode: string;
  notes: string;
  paidAt: string;
}

interface MemberRecord {
  id: number;
  srNo?: number;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  planName?: string;
  planTotalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentInstallments: PaymentInstallment[];
  membershipStartDate?: string;
  membershipEndDate?: string;
  notes?: string;
  isSignedUp: boolean;
  subscriptionStatus?: 'active' | 'expired' | 'expiring' | 'none';
  createdAt: string;
}

interface Stats {
  total: number;
  signedUp: number;
  notSignedUp: number;
  pendingPayments: number;
  fullyPaid: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  noSubscription: number;
  expiringSoon: number;
  totalRevenue: number;
  collectedAmount: number;
  pendingAmount: number;
}

export default function MemberRegistryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  const [records, setRecords] = useState<MemberRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuperAdminMenu, setShowSuperAdminMenu] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberRecord | null>(null);
  const [expandedPayments, setExpandedPayments] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    planName: '',
    planTotalAmount: '',
    paidAmount: '',
    membershipStartDate: '',
    membershipEndDate: '',
    notes: ''
  });
  
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMode: 'CASH',
    notes: ''
  });

  const filterOptions = [
    { value: 'all', label: 'All Members', icon: '👥' },
    { value: 'active-subscription', label: 'Active Subscriptions', icon: '✅' },
    { value: 'expired-subscription', label: 'Expired Subscriptions', icon: '❌' },
    { value: 'expiring-soon', label: 'Expiring Soon (7 days)', icon: '⚠️' },
    { value: 'pending-payment', label: 'Pending Payments', icon: '💳' },
    { value: 'fully-paid', label: 'Fully Paid', icon: '💰' },
    { value: 'signed-up', label: 'App Users', icon: '📱' },
    { value: 'not-signed-up', label: 'Not on App', icon: '📋' },
    { value: 'no-subscription', label: 'No Subscription', icon: '🔓' },
  ];

  useEffect(() => {
    fetchRecords();
  }, [search, filter]);

  // Helper to get auth token
  const getToken = (): string | null => localStorage.getItem('accessToken') || localStorage.getItem('token');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`/api/v1/admin/member-records?search=${search}&filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRecords(data.records || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/v1/admin/member-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          planTotalAmount: parseFloat(formData.planTotalAmount) || 0,
          paidAmount: parseFloat(formData.paidAmount) || 0,
          paymentInstallments: formData.paidAmount ? [{
            id: Date.now(),
            amount: parseFloat(formData.paidAmount),
            paymentMode: 'CASH',
            notes: 'Initial payment',
            paidAt: new Date().toISOString()
          }] : []
        })
      });
      
      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          name: '', email: '', phone: '', planName: '',
          planTotalAmount: '', paidAmount: '',
          membershipStartDate: '', membershipEndDate: '', notes: ''
        });
        fetchRecords();
      }
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/v1/admin/member-records/${selectedMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          planTotalAmount: parseFloat(formData.planTotalAmount) || 0,
          paidAmount: parseFloat(formData.paidAmount) || selectedMember.paidAmount,
        })
      });
      
      if (res.ok) {
        setShowEditModal(false);
        setSelectedMember(null);
        fetchRecords();
      }
    } catch (error) {
      console.error('Failed to update member:', error);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedMember) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/v1/admin/member-records/${selectedMember.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(paymentData.amount),
          paymentMode: paymentData.paymentMode,
          notes: paymentData.notes
        })
      });
      
      if (res.ok) {
        setShowPaymentModal(false);
        setPaymentData({ amount: '', paymentMode: 'CASH', notes: '' });
        setSelectedMember(null);
        fetchRecords();
      }
    } catch (error) {
      console.error('Failed to add payment:', error);
    }
  };

  const handleDeleteMember = async (id: number, memberName: string, isSignedUp: boolean) => {
    if (isSignedUp) {
      alert(`${memberName} is a registered app user. Please delete from Manage Members page instead to properly remove their account and all associated data.`);
      return;
    }
    
    if (!confirm(`Delete ${memberName} from registry? This cannot be undone.`)) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/v1/admin/member-records/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || data.error || 'Failed to delete');
        return;
      }
      fetchRecords();
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const token = getToken();
      const res = await fetch('/api/v1/admin/member-records/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`Imported ${data.imported} members successfully!`);
        fetchRecords();
      } else {
        alert(data.error || 'Failed to import');
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const exportToCSV = () => {
    const headers = ['Sr No', 'Name', 'Email', 'Phone', 'Plan', 'Total', 'Paid', 'Pending', 'Status', 'Last Payment', 'End Date'];
    const rows = records.map((r, i) => {
      const lastPayment = r.paymentInstallments?.[r.paymentInstallments.length - 1];
      return [
        i + 1,
        r.name,
        r.email || '',
        r.phone || '',
        r.planName || '',
        r.planTotalAmount,
        r.paidAmount,
        r.remainingAmount,
        r.subscriptionStatus || 'none',
        lastPayment ? new Date(lastPayment.paidAt).toLocaleDateString() : '',
        r.membershipEndDate ? new Date(r.membershipEndDate).toLocaleDateString() : ''
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `member_registry_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Super Admin Actions
  const handleSuperAdminAction = async (action: string) => {
    const confirmMessages: Record<string, string> = {
      'clear-payments': 'This will CLEAR ALL payment history and reset paid amounts to 0. Are you sure?',
      'clear-all': 'This will DELETE ALL member records. This cannot be undone! Are you sure?',
      'reset-sync': 'This will delete all records and re-sync from the users table. Continue?'
    };
    
    if (!confirm(confirmMessages[action])) return;
    
    try {
      const token = getToken();
      const res = await fetch(`/api/v1/admin/member-records?action=${action}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchRecords();
      } else {
        alert(data.error || 'Failed to perform action');
      }
    } catch (error) {
      console.error('Super admin action failed:', error);
    }
    setShowSuperAdminMenu(false);
  };

  const handleClearMemberPayments = async (memberId: number, memberName: string) => {
    if (!confirm(`Clear all payment history for ${memberName}? This will reset their paid amount to 0.`)) return;
    
    try {
      const token = getToken();
      const res = await fetch(`/api/v1/admin/member-records/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paidAmount: 0,
          paymentInstallments: []
        })
      });
      
      if (res.ok) {
        alert('Payment history cleared');
        fetchRecords();
      }
    } catch (error) {
      console.error('Failed to clear payments:', error);
    }
  };

  const handleDeleteSpecificPayment = async (memberId: number, paymentId: number, amount: number) => {
    if (!confirm(`Delete payment of ₹${amount}? This will update the member's paid amount.`)) return;
    
    try {
      const token = getToken();
      const res = await fetch(`/api/v1/admin/member-records/${memberId}/payment?paymentId=${paymentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Payment deleted');
        fetchRecords();
      } else {
        alert(data.error || 'Failed to delete payment');
      }
    } catch (error) {
      console.error('Failed to delete payment:', error);
    }
  };

  const getStatusBadge = (member: MemberRecord) => {
    const status = member.subscriptionStatus;
    if (status === 'active') return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Active</span>;
    if (status === 'expiring') return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">Expiring Soon</span>;
    if (status === 'expired') return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">Expired</span>;
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">No Plan</span>;
  };

  const openEditModal = (member: MemberRecord) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
      planName: member.planName || '',
      planTotalAmount: member.planTotalAmount?.toString() || '',
      paidAmount: member.paidAmount?.toString() || '',
      membershipStartDate: member.membershipStartDate?.split('T')[0] || '',
      membershipEndDate: member.membershipEndDate?.split('T')[0] || '',
      notes: member.notes || ''
    });
    setShowEditModal(true);
  };

  const openPaymentModal = (member: MemberRecord) => {
    setSelectedMember(member);
    setPaymentData({ amount: '', paymentMode: 'CASH', notes: '' });
    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <button onClick={() => router.push('/app/admin')} className="text-gray-400 hover:text-white mb-2 flex items-center gap-2 text-sm">
            ← Back to Admin
          </button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Member Registry</h1>
          <p className="text-gray-400 mt-1 text-sm">Complete member database with payment tracking</p>
        </div>

        {/* Action Buttons - Responsive Grid */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <input type="file" ref={fileInputRef} accept=".csv,.xlsx" onChange={handleImport} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs sm:text-sm text-white flex items-center justify-center gap-1.5">
            📥 Import CSV
          </button>
          <button onClick={exportToCSV} className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs sm:text-sm text-white flex items-center justify-center gap-1.5">
            📤 Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium flex items-center justify-center gap-1.5 text-xs sm:text-sm col-span-2 sm:col-span-1">
            + Add Member
          </button>
          
          {/* Super Admin Menu */}
          {isSuperAdmin && (
            <div className="relative col-span-2 sm:col-span-1">
              <button 
                onClick={() => setShowSuperAdminMenu(!showSuperAdminMenu)} 
                className="w-full sm:w-auto px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs sm:text-sm text-white flex items-center justify-center gap-2"
              >
                ⚙️ Admin Tools
              </button>
              
              {showSuperAdminMenu && (
                <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[200px]">
                  <button
                    onClick={() => handleSuperAdminAction('reset-sync')}
                    className="w-full px-4 py-3 text-left hover:bg-gray-700 text-white text-sm border-b border-gray-700"
                  >
                    🔄 Re-sync from Users
                  </button>
                  <button
                    onClick={() => handleSuperAdminAction('clear-payments')}
                    className="w-full px-4 py-3 text-left hover:bg-gray-700 text-yellow-400 text-sm border-b border-gray-700"
                  >
                    💳 Clear All Payments
                  </button>
                  <button
                    onClick={() => handleSuperAdminAction('clear-all')}
                    className="w-full px-4 py-3 text-left hover:bg-gray-700 text-red-400 text-sm"
                  >
                    🗑️ Delete All Records
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 mb-6">
          <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-700">
            <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Total</p>
            <p className="text-xl sm:text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-green-500/30">
            <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Active</p>
            <p className="text-xl sm:text-2xl font-bold text-green-400">{stats.activeSubscriptions}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-red-500/30">
            <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Expired</p>
            <p className="text-xl sm:text-2xl font-bold text-red-400">{stats.expiredSubscriptions}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-yellow-500/30">
            <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Expiring</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-400">{stats.expiringSoon}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-blue-500/30">
            <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Collected</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-400">₹{Number(stats.collectedAmount || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-orange-500/30">
            <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Pending</p>
            <p className="text-lg sm:text-2xl font-bold text-orange-400">₹{Number(stats.pendingAmount || 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {filterOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Sr</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Contact</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Pending</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Last Payment</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {loading ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-400">No members found</td></tr>
              ) : (
                records.map((member, idx) => {
                  const lastPayment = member.paymentInstallments?.[member.paymentInstallments.length - 1];
                  return (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-400">{member.srNo || idx + 1}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-xs text-gray-500 md:hidden">{member.phone || member.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div>
                          <p className="text-gray-300">{member.phone || '-'}</p>
                          <p className="text-xs text-gray-500">{member.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{member.planName || '-'}</td>
                      <td className="px-4 py-3 text-right text-gray-300">₹{Number(member.planTotalAmount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-green-400">₹{Number(member.paidAmount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={member.remainingAmount > 0 ? 'text-orange-400' : 'text-gray-400'}>
                          ₹{Number(member.remainingAmount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {lastPayment ? (
                          <div className="relative">
                            <button 
                              onClick={() => setExpandedPayments(expandedPayments === member.id ? null : member.id)}
                              className="text-left hover:bg-gray-700/50 rounded px-2 py-1 -ml-2"
                            >
                              <p className="text-gray-300 text-xs">{new Date(lastPayment.paidAt).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500">{lastPayment.paymentMode} - ₹{lastPayment.amount}</p>
                            </button>
                            
                            {/* Payment History Dropdown */}
                            <AnimatePresence>
                              {expandedPayments === member.id && member.paymentInstallments.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute z-50 top-full left-0 mt-1 bg-gray-900 rounded-lg border border-gray-700 shadow-xl p-3 min-w-[250px]"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-gray-400 font-medium">Payment History</p>
                                    {isSuperAdmin && (
                                      <span className="text-[10px] text-yellow-400/70">Super Admin</span>
                                    )}
                                  </div>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {member.paymentInstallments.map((p, i) => (
                                      <div key={i} className="text-xs border-b border-gray-700/50 pb-2 last:border-0 flex items-center justify-between gap-2">
                                        <div className="flex-1">
                                          <div className="flex justify-between">
                                            <span className="text-green-400">₹{p.amount}</span>
                                            <span className="text-gray-500">{p.paymentMode}</span>
                                          </div>
                                          <p className="text-gray-500">{new Date(p.paidAt).toLocaleDateString()}</p>
                                        </div>
                                        {isSuperAdmin && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteSpecificPayment(member.id, p.id, p.amount);
                                            }}
                                            className="p-1 hover:bg-red-500/20 rounded text-red-400 flex-shrink-0"
                                            title="Delete this payment"
                                          >
                                            ✕
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">No payments</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(member)}
                        {member.isSignedUp && <span className="ml-1 text-blue-400" title="App User">📱</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openPaymentModal(member)}
                            className="p-2 hover:bg-green-500/20 rounded-lg text-green-400"
                            title="Add Payment"
                          >
                            💵
                          </button>
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          {isSuperAdmin && member.paidAmount > 0 && (
                            <button
                              onClick={() => handleClearMemberPayments(member.id, member.name)}
                              className="p-2 hover:bg-yellow-500/20 rounded-lg text-yellow-400"
                              title="Clear Payment History"
                            >
                              🧹
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMember(member.id, member.name, member.isSignedUp)}
                            className={`p-2 rounded-lg ${member.isSignedUp ? 'hover:bg-gray-500/20 text-gray-500' : 'hover:bg-red-500/20 text-red-400'}`}
                            title={member.isSignedUp ? "Delete from Manage Members" : "Delete"}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">Add New Member</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={formData.planName}
                    onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="e.g., 6 Month Plan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Plan Total Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.planTotalAmount}
                      onChange={(e) => setFormData({ ...formData, planTotalAmount: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Initial Paid Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.paidAmount}
                      onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.membershipStartDate}
                      onChange={(e) => setFormData({ ...formData, membershipStartDate: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.membershipEndDate}
                      onChange={(e) => setFormData({ ...formData, membershipEndDate: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-20"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium"
                >
                  Add Member
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Member Modal */}
      <AnimatePresence>
        {showEditModal && selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">Edit Member</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={formData.planName}
                    onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Plan Total Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.planTotalAmount}
                      onChange={(e) => setFormData({ ...formData, planTotalAmount: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Paid Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.paidAmount}
                      disabled
                      className="w-full px-4 py-2 bg-gray-600 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                      title="Use Add Payment to update this"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use "Add Payment" to update</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.membershipStartDate}
                      onChange={(e) => setFormData({ ...formData, membershipStartDate: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.membershipEndDate}
                      onChange={(e) => setFormData({ ...formData, membershipEndDate: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-20"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateMember}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-800 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-2">Add Payment</h2>
              <p className="text-gray-400 text-sm mb-4">
                For: <span className="text-white font-medium">{selectedMember.name}</span>
                <br />
                Pending: <span className="text-orange-400 font-medium">₹{Number(selectedMember.remainingAmount || 0).toLocaleString()}</span>
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder={`Max: ${selectedMember.remainingAmount}`}
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Payment Mode</label>
                  <select
                    value={paymentData.paymentMode}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Notes</label>
                  <input
                    type="text"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPayment}
                  disabled={!paymentData.amount || parseFloat(paymentData.amount) <= 0}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Record Payment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

