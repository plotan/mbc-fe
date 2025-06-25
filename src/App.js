///
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { LogOut, PlusCircle, Search, Download, Edit, Trash2, X, ChevronLeft, ChevronRight, User, Calendar, BarChart2, DollarSign, Users, Clock, Trophy, Shuffle, Mars, Venus, UserPlus, ClipboardList, RotateCw, Minus, Menu } from 'lucide-react';
// Add these lines at the top of App.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


// In App.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;




// --- Utility Functions ---
const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const getBookingStatus = (booking) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    return today >= startDate && today <= endDate ? 'Open' : 'Closed';
};

// --- Mock Data (for charts only, main data is fetched) ---
const staticCashflowChartData = [
      { month: 'Jan', income: 4000000, expenses: 2400000 }, { month: 'Feb', income: 3000000, expenses: 1398000 },
      { month: 'Mar', income: 2000000, expenses: 9800000 }, { month: 'Apr', income: 2780000, expenses: 3908000 },
      { month: 'May', income: 1890000, expenses: 4800000 }, { month: 'Jun', income: 2390000, expenses: 3800000 },
];
const teamNamePool = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa'];
// NEW: Add this reusable StatCard component before the Dashboard component.
const StatCard = ({ title, value, icon, link, colorClass }) => {
    const colors = {
        indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'hover:border-indigo-300' },
        green: { bg: 'bg-green-100', text: 'text-green-600', border: 'hover:border-green-300' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'hover:border-blue-300' },
        orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'hover:border-orange-300' },
    };
    const selectedColor = colors[colorClass] || colors.indigo;

    return (
        <a href={link} className={`block bg-white p-4 rounded-xl border border-gray-200 transition-all shadow-sm hover:shadow-lg ${selectedColor.border}`}>
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedColor.bg}`}>
                    {React.cloneElement(icon, { className: selectedColor.text, size: 24 })}
                </div>
                <div>
                    <h3 className="font-semibold text-gray-500 text-sm">{title}</h3>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                </div>
            </div>
        </a>
    );
};
// --- Reusable Components ---
const Modal = ({ children, onClose, title, size = 'md' }) => {
    const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl' };
    return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity animate-fade-in">
        <div className={`bg-white p-6 rounded-xl shadow-2xl w-full ${sizeClasses[size]} m-4 transform transition-transform scale-100 relative animate-scale-up`}>
            <h2 className="text-xl font-bold text-gray-800 mb-6">{title}</h2>
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"> <X size={24} /> </button>
            {children}
        </div>
    </div>
)};
const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => (
    <Modal onClose={onCancel} title={title}>
        <p className="text-gray-600 mb-8">{message}</p>
        <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg hover:bg-gray-200 font-semibold text-sm">Cancel</button>
            <button onClick={onConfirm} className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 font-semibold text-sm">Confirm</button>
        </div>
    </Modal>
);
const PageHeader = ({ title, onButtonClick, buttonText, children }) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">{title}</h1>
        <div className="flex items-center gap-4">
            {children}
            {onButtonClick && <button onClick={onButtonClick} className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 flex items-center gap-2 font-semibold text-sm transition-all shadow-sm hover:shadow-md"> <PlusCircle size={18} /> {buttonText} </button>}
        </div>
    </div>
);

// --- Core App Components ---

// MODIFIED: Sidebar component is updated for mobile overlay behavior
const Sidebar = ({ page, handleLogout, isOpen, setIsOpen }) => (
    <>
        {/* Mobile Overlay: This appears behind the sidebar on mobile to dim the content */}
        <div
            onClick={() => setIsOpen(false)}
            className={`fixed inset-0 bg-black/60 z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        />
        {/* Sidebar */}
        <div className={`
            fixed top-0 left-0 h-full bg-white border-r border-gray-200 text-gray-700 
            flex flex-col z-40 transition-transform duration-300 ease-in-out
            ${/* On mobile, slide in from the left. On desktop, it's always visible */''}
            ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
            ${/* On desktop, width changes. On mobile, it's a fixed width when open */''}
            w-60 h-screen ${isOpen ? 'md:w-60' : 'md:w-20'}
        `}>
            <div className={`p-4 font-bold flex items-center ${isOpen ? 'justify-between' : 'justify-center'} border-b border-gray-200 h-16`}>
                {isOpen && <a href="#dashboard" className="text-xl flex items-center gap-2">🏸 <span className="font-bold text-gray-800">Badminton</span></a>}
                {/* This button is only visible on desktop to shrink/expand the sidebar */}
                <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg hidden md:block">
                    {isOpen ? <ChevronLeft /> : <ChevronRight />}
                </button>
            </div>
            <nav className="mt-4 flex-1 space-y-2 px-2">
                {[ { name: 'Dashboard', icon: BarChart2, key: 'dashboard' }, { name: 'Membership', icon: User, key: 'membership' }, { name: 'Booking', icon: Calendar, key: 'booking' }, { name: 'Tournaments', icon: Trophy, key: 'tournaments' }, { name: 'Score Board', icon: ClipboardList, key: 'scoreboard' }, { name: 'Cashflow', icon: DollarSign, key: 'cashflow' }, ].map(item => (
                    <a href={`#${item.key}`} key={item.key} className={`flex items-center p-3 rounded-lg transition-colors duration-200 cursor-pointer ${page === item.key ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-gray-100'}`}>
                        <item.icon size={20} /> {(isOpen) && <span className="ml-4 font-medium">{item.name}</span>}
                    </a>
                ))}
            </nav>
            <div className="p-2 border-t border-gray-200">
                <a onClick={handleLogout} className="flex items-center p-3 rounded-lg transition duration-200 hover:bg-red-50 text-red-600 cursor-pointer">
                    <LogOut size={20} /> {(isOpen) && <span className="ml-4 font-medium">Logout</span>}
                </a>
            </div>
        </div>
    </>
);

// NEW: Header component for mobile view with a burger menu
const Header = ({ setIsOpen }) => (
    <header className="bg-white border-b border-gray-200 p-4 md:hidden sticky top-0 z-20">
        <div className="flex items-center justify-between">
            <a href="#dashboard" className="text-xl flex items-center gap-2">🏸 <span className="font-bold text-gray-800">Badminton</span></a>
            <button onClick={() => setIsOpen(true)} className="text-gray-600 hover:text-indigo-600 p-2">
                <Menu size={24} />
            </button>
        </div>
    </header>
);

// REPLACE the existing Dashboard component with this enhanced version.
const Dashboard = ({ members, bookings, transactions, tournaments }) => {
    const stats = useMemo(() => {
        const paidMembers = members.filter(m => m.status === 'Paid').length;
        const unpaidMembers = members.length - paidMembers;
        const totalIncome = transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
        const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
        const netBalance = totalIncome - totalExpense;

        return {
            openBookings: bookings.filter(b => getBookingStatus(b) === 'Open').length,
            totalIncome,
            netBalance,
            paidMembers,
            unpaidMembers,
            memberStatusData: [ { name: 'Paid', value: paidMembers, color: '#22c55e' }, { name: 'Unpaid', value: unpaidMembers, color: '#f97316' } ]
        };
    }, [members, bookings, transactions]);
    
    // NEW FEATURE: Create a list of members with pending payments.
    const unpaidMembersList = useMemo(() => {
        return members.filter(m => m.status === 'Unpaid').slice(0, 5); // Get first 5
    }, [members]);

    const cashflowChartData = useMemo(() => {
        if (!transactions || transactions.length === 0) return staticCashflowChartData;
        const dataByMonth = {};
        const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        transactions.forEach(t => {
            const date = new Date(t.date);
            const month = date.toLocaleString('default', { month: 'short' });
            if (!dataByMonth[month]) { dataByMonth[month] = { month, income: 0, expenses: 0 }; }
            if (t.type === 'Income') { dataByMonth[month].income += parseFloat(t.amount || 0); } else { dataByMonth[month].expenses += parseFloat(t.amount || 0); }
        });
        return Object.values(dataByMonth).sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
    }, [transactions]);

    const recentActivities = useMemo(() => {
        const recentMembers = members.slice(0, 2).map(m => ({ type: 'New Member', text: `${m.name} has joined.`, date: m.join_date, icon: <UserPlus className="text-blue-500"/> }));
        const recentCashflow = transactions.slice(0, 2).map(t => ({ type: t.type, text: `${t.description}`, date: t.date, icon: t.type === 'Income' ? <DollarSign className="text-green-500"/> : <DollarSign className="text-orange-500"/> }));
        const recentTournaments = tournaments.slice(0,1).map(t => ({ type: 'New Tournament', text: `${t.name} has been created.`, date: t.created_at, icon: <Trophy className="text-indigo-500"/> }));
        return [...recentMembers, ...recentCashflow, ...recentTournaments].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    }, [members, transactions, tournaments]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h1>
            {/* --- THIS IS THE REDESIGNED CARD SECTION --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <StatCard title="Total Members" value={members.length} icon={<Users />} link="#membership" colorClass="indigo" />
                <StatCard title="Open Bookings" value={stats.openBookings} icon={<Calendar />} link="#booking" colorClass="blue" />
                <StatCard title="Active Tournaments" value={tournaments.filter(t => t.status !== 'Completed').length} icon={<Trophy />} link="#tournaments" colorClass="orange" />
                <StatCard title="Net Balance" value={formatCurrency(stats.netBalance)} icon={<DollarSign />} link="#cashflow" colorClass="green" />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-4">Cashflow Trend</h3>
                     <ResponsiveContainer width="100%" height={300}><LineChart data={cashflowChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" opacity={0.5} /><XAxis dataKey="month" tick={{fill: '#6b7280', fontSize: 12}} stroke="#d1d5db" /><YAxis tickFormatter={value => `${(value/1000)}K`} tick={{fill: '#6b7280', fontSize: 12}} stroke="#d1d5db"/><Tooltip formatter={(value) => formatCurrency(value)} wrapperClassName="!rounded-lg !border-gray-300 shadow-lg" /><Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} /><Line type="monotone" dataKey="income" name="Income" stroke="#4f46e5" strokeWidth={2} activeDot={{ r: 6 }} /><Line type="monotone" dataKey="expenses" name="Expenses" stroke="#8b5cf6" strokeWidth={2} /></LineChart></ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
                         <h3 className="font-semibold text-gray-800 mb-4">Membership Status</h3>
                          <ResponsiveContainer width="100%" height={120}><PieChart><Pie data={stats.memberStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5}>{stats.memberStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip formatter={(value, name) => [value, name]} /></PieChart></ResponsiveContainer>
                        <div className="flex justify-around mt-4 text-xs"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span>Paid: {stats.paidMembers}</div><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span>Unpaid: {stats.unpaidMembers}</div></div>
                    </div>
                    
                    {/* --- THIS IS THE NEW "PENDING PAYMENTS" FEATURE --- */}
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
                         <h3 className="font-semibold text-gray-800 mb-4">Pending Payments</h3>
                         {unpaidMembersList.length > 0 ? (
                            <div className="space-y-3">
                                {unpaidMembersList.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                                <User size={14}/>
                                            </div>
                                            <span className="font-medium text-gray-700">{member.name}</span>
                                        </div>
                                        <a href="#membership" className="text-xs font-semibold text-indigo-600 hover:underline">
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                         ) : (
                            <p className="text-sm text-gray-500">All member fees are settled. Great job!</p>
                         )}
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
                         <h3 className="font-semibold text-gray-800 mb-4">Recent Activities</h3>
                         <div className="space-y-3">{recentActivities.map((activity, index) => (<div key={index} className="flex items-start gap-3 text-sm"><div className="mt-1 flex-shrink-0">{activity.icon}</div><div className="flex-1"><p className="text-gray-800">{activity.text}</p><p className="text-xs text-gray-500">{formatDate(activity.date)}</p></div></div>))}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
const Membership = ({ members, setMembers, bookings }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [deletingMember, setDeletingMember] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    

    const activeMembers = useMemo(() => {
        const activeCourtNames = bookings.filter(b => getBookingStatus(b) === 'Open').map(b => b.court_name);
        return members.filter(m => activeCourtNames.includes(m.court_name));
    }, [members, bookings]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const formData = new FormData(e.target);
        const memberData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            status: formData.get('status'),
            gender: formData.get('gender'),
            booking_id: formData.get('booking_id'),
        };

        const courtBooking = bookings.find(b => b.id === parseInt(memberData.booking_id));
        const membersInCourt = members.filter(m => m.booking_id === parseInt(memberData.booking_id));
        if (!editingMember && courtBooking && membersInCourt.length >= courtBooking.max_members) {
            setError(`Cannot add member. ${courtBooking.court_name} is full (${courtBooking.max_members} members max).`);
            return;
        }

        try {
            if (editingMember) {
                const response = await fetch(`${API_BASE_URL}/api/members/${editingMember.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(memberData)
                });
                const updatedMember = await response.json();
                setMembers(members.map(m => m.id === editingMember.id ? { ...m, ...updatedMember, court_name: courtBooking.court_name } : m));
            } else {
                const response = await fetch(`${API_BASE_URL}/api/members`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(memberData)
                });
                const newMember = await response.json();
                setMembers([{...newMember, court_name: courtBooking.court_name}, ...members]);
            }
        } catch (error) {
            console.error("Error saving member:", error);
        } finally {
            setShowModal(false); setEditingMember(null);
        }
    };
    
    const handleDelete = async () => {
        if (!deletingMember) return;
        try {
            await fetch(`${API_BASE_URL}/api/members/${deletingMember.id}`, { method: 'DELETE' });
            setMembers(members.filter(m => m.id !== deletingMember.id));
        } catch(error) {
            console.error("Error deleting member:", error);
        } finally {
            setDeletingMember(null);
        }
    };
    
    const membersWithCost = useMemo(() => activeMembers.map(member => {
            const courtBooking = bookings.find(b => b.id === member.booking_id);
            if (!courtBooking) return { ...member, individualCost: 0 };
            const membersInCourt = activeMembers.filter(m => m.booking_id === member.booking_id).length;
            return { ...member, individualCost: membersInCourt > 0 ? courtBooking.cost / membersInCourt : 0 };
        }), [activeMembers, bookings]);
    const filteredMembers = useMemo(() => membersWithCost.filter(member => member.name.toLowerCase().includes(searchTerm.toLowerCase())), [membersWithCost, searchTerm]);
    return (
        <div className="p-4 sm:p-6 md:p-8">
            <PageHeader title="Active Memberships" onButtonClick={() => { setEditingMember(null); setError(''); setShowModal(true); }} buttonText="Add Member" />
            <div className="mb-6 relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Search member by name..." className="pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr className="border-b border-gray-200"><th className="p-4 text-left font-semibold text-gray-600">Name</th><th className="p-4 text-left font-semibold text-gray-600">Court</th><th className="p-4 text-left font-semibold text-gray-600">Individual Cost</th><th className="p-4 text-left font-semibold text-gray-600">Status</th><th className="p-4 text-left font-semibold text-gray-600">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredMembers.map(member => (<tr key={member.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-medium text-gray-800">
                                    <div className="flex items-center gap-2">
                                        {member.gender === 'Male' ? <Mars size={16} className="text-blue-500"/> : <Venus size={16} className="text-pink-500"/>}
                                        <span>{member.name}</span>
                                    </div>
                                </td>
                        <td className="p-4 text-gray-600">{member.court_name}</td>
                        <td className="p-4 text-gray-600 font-medium">{formatCurrency(member.individualCost)}</td><td className="p-4"><span className={`px-2.5 py-1 rounded-full font-medium text-xs ${member.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{member.status}</span></td><td className="p-4 flex gap-2"><button onClick={() => { setEditingMember(member); setError(''); setShowModal(true); }} className="text-gray-500 hover:text-indigo-600 p-1.5 rounded-md hover:bg-gray-100"><Edit size={16}/></button><button onClick={() => setDeletingMember(member)} className="text-gray-500 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50"><Trash2 size={16}/></button></td></tr>))}
                    </tbody>
                </table>
            </div>
            {showModal && <Modal onClose={() => { setShowModal(false); setEditingMember(null); }} title={editingMember ? 'Edit Member' : 'Add New Member'}><form onSubmit={handleFormSubmit} className="space-y-4">{error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}<div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" name="name" defaultValue={editingMember?.name} className="w-full p-2.5 border border-gray-300 rounded-lg" required /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" name="phone" defaultValue={editingMember?.phone} className="w-full p-2.5 border border-gray-300 rounded-lg" required /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Court</label><select name="booking_id" defaultValue={editingMember?.booking_id} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white">{bookings.filter(b => getBookingStatus(b) === 'Open').map(b => <option key={b.id} value={b.id}>{b.court_name}</option>)}</select></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select name="status" defaultValue={editingMember?.status} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white"><option value="Paid">Paid</option><option value="Unpaid">Unpaid</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select name="gender" defaultValue={editingMember?.gender} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white"><option value="Male">Male</option><option value="Female">Female</option></select></div></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => { setShowModal(false); setEditingMember(null); }} className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg font-semibold text-sm">Cancel</button><button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm">Save</button></div></form></Modal>}
            {deletingMember && <ConfirmationModal title="Delete Member" message={`Are you sure you want to delete ${deletingMember.name}?`} onConfirm={handleDelete} onCancel={() => setDeletingMember(null)} />}
        </div>
    );
};
const Booking = ({ bookings, setBookings, members }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const [deletingBooking, setDeletingBooking] = useState(null);
    // State for the member list modal
    const [viewingMembersFor, setViewingMembersFor] = useState(null);
    const [error, setError] = useState('');


    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        const formData = new FormData(e.target);
        // Get all field values from the form, including new ones
        const bookingData = {
            court_name: formData.get('court_name'),
            location: formData.get('location'),
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
            cost: parseFloat(formData.get('cost')),
            max_members: parseInt(formData.get('max_members')),
            day: formData.get('day'),
            start_hour: formData.get('start_hour'),
            end_hour: formData.get('end_hour'),
            maps_url: formData.get('maps_url')
        };

        try {
            let response;
            if (editingBooking) {
                response = await fetch(`${API_BASE_URL}/api/bookings/${editingBooking.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookingData) });
            } else {
                response = await fetch(`${API_BASE_URL}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookingData) });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Failed to save booking.');
            }

            const savedBooking = await response.json();

            if (editingBooking) {
                setBookings(bookings.map(b => b.id === editingBooking.id ? savedBooking : b));
            } else {
                setBookings([savedBooking, ...bookings]);
            }

            setShowModal(false);
            setEditingBooking(null);

        } catch (error) {
            console.error("Error saving booking:", error);
            setError(error.message);
        }
    };

    const handleDelete = async () => {
        if (!deletingBooking) return;
        try {
            await fetch(`${API_BASE_URL}/api/bookings/${deletingBooking.id}`, { method: 'DELETE' });
            setBookings(bookings.filter(b => b.id !== deletingBooking.id));
        } catch (error) {
            console.error("Error deleting booking:", error);
            // Optionally, set an error state to show in a toast/notification
        } finally {
            setDeletingBooking(null);
        }
    };

    // Find members for the selected booking using useMemo for efficiency
    const membersInSelectedBooking = useMemo(() => {
        if (!viewingMembersFor) return [];
        return members.filter(m => m.booking_id === viewingMembersFor.id);
    }, [viewingMembersFor, members]);

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <PageHeader title="Court Bookings" onButtonClick={() => { setEditingBooking(null); setError(''); setShowModal(true); }} buttonText="Add Booking" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {bookings.map(booking => {
                    const status = getBookingStatus(booking);
                    return (
                        <div key={booking.id} className="bg-white p-5 rounded-xl border border-gray-200 group flex flex-col">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-gray-800">{booking.court_name}</h3>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingBooking(booking); setError(''); setShowModal(true); }} className="text-gray-500 hover:text-indigo-600 p-1.5 rounded-md hover:bg-gray-100"><Edit size={16}/></button>
                                    <button onClick={() => setDeletingBooking(booking)} className="text-gray-500 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">{booking.location}</p>
                            <div className="mt-4 pt-4 border-t border-gray-100 text-sm space-y-2">
                                <p className="flex items-center justify-between"><span className="font-semibold text-gray-600">Period:</span> <span className="text-gray-800 font-medium">{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</span></p>
                                <p className="flex items-center justify-between"><span className="font-semibold text-gray-600">Total Cost:</span> <span className="text-gray-800 font-medium">{formatCurrency(booking.cost)}</span></p>
                                <p className="flex items-center justify-between"><span className="font-semibold text-gray-600">Max Members:</span> <span className="text-gray-800 font-medium flex items-center gap-1"><Users size={14}/>{booking.max_members}</span></p>
                                <p className="flex items-center justify-between"><span className="font-semibold text-gray-600">Status:</span><span className={`px-2.5 py-1 rounded-full font-medium text-xs ${status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{status}</span></p>
                                {/* Display new fields */}
                                {booking.day && booking.start_hour && (
                                     <p className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-600 flex items-center gap-1.5"><Clock size={14}/> Schedule:</span>
                                        <span className="text-gray-800 font-medium">{booking.day}, {booking.start_hour.substring(0,5)} - {booking.end_hour.substring(0,5)}</span>
                                    </p>
                                )}
                                {booking.maps_url && (
                                     <p className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-600">Maps:</span>
                                        <a href={booking.maps_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">View Location</a>
                                    </p>
                                )}
                            </div>
                             {/* Add View Members button */}
                             <div className="mt-auto pt-4">
                                <button
                                    onClick={() => setViewingMembersFor(booking)}
                                    className="w-full bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 font-semibold text-sm flex items-center justify-center gap-2">
                                    <Users size={16} /> View Members
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
            {showModal && (
                 <Modal onClose={() => { setShowModal(false); setEditingBooking(null); }} title={editingBooking ? 'Edit Booking' : 'Add New Booking'}>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Court Name</label><input type="text" name="court_name" defaultValue={editingBooking?.court_name} className="w-full p-2.5 border border-gray-300 rounded-lg" required /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input type="text" name="location" defaultValue={editingBooking?.location} className="w-full p-2.5 border border-gray-300 rounded-lg" required /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" name="start_date" defaultValue={editingBooking?.start_date.split('T')[0]} className="w-full p-2.5 border border-gray-300 rounded-lg" required /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><input type="date" name="end_date" defaultValue={editingBooking?.end_date.split('T')[0]} className="w-full p-2.5 border border-gray-300 rounded-lg" required /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (Rp)</label><input type="number" name="cost" defaultValue={editingBooking?.cost} className="w-full p-2.5 border border-gray-300 rounded-lg" required /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Members</label><input type="number" name="max_members" defaultValue={editingBooking?.max_members} className="w-full p-2.5 border border-gray-300 rounded-lg" required /></div>
                            {/* Add new form fields */}
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                                <select name="day" defaultValue={editingBooking?.day} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white" required>
                                    <option value="">Select a Day</option>
                                    <option>Sunday</option><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Maps URL</label>
                                <input type="url" name="maps_url" placeholder="https://maps.app.goo.gl/..." defaultValue={editingBooking?.maps_url} className="w-full p-2.5 border border-gray-300 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Hour</label>
                                <input type="time" name="start_hour" defaultValue={editingBooking?.start_hour} className="w-full p-2.5 border border-gray-300 rounded-lg" required />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Hour</label>
                                <input type="time" name="end_hour" defaultValue={editingBooking?.end_hour} className="w-full p-2.5 border border-gray-300 rounded-lg" required />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => { setShowModal(false); setEditingBooking(null); }} className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg font-semibold text-sm">Cancel</button>
                            <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm">Save</button>
                        </div>
                    </form>
                </Modal>
            )}
            {deletingBooking && <ConfirmationModal title="Delete Booking" message={`Are you sure you want to delete the booking for ${deletingBooking.court_name}?`} onConfirm={handleDelete} onCancel={() => setDeletingBooking(null)} />}

            {/* Modal to display the list of members for a booking */}
            {viewingMembersFor && (
                <Modal onClose={() => setViewingMembersFor(null)} title={`Members in ${viewingMembersFor.court_name}`}>
                    {membersInSelectedBooking.length > 0 ? (
                        <ul className="space-y-3 max-h-80 overflow-y-auto">
                            {membersInSelectedBooking.map(member => (
                                <li key={member.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                         {member.gender === 'Male' ? <Mars size={16} className="text-blue-500"/> : <Venus size={16} className="text-pink-500"/>}
                                        <span className="font-medium text-gray-800">{member.name}</span>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full font-medium text-xs ${member.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{member.status}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-4">No members have been assigned to this booking yet.</p>
                    )}
                     <div className="flex justify-end pt-6">
                        <button type="button" onClick={() => setViewingMembersFor(null)} className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg font-semibold text-sm">Close</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};
// REPLACE the old Cashflow component in App.js with this new, enhanced version.
const Cashflow = ({ transactions, setTransactions }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [deletingTransaction, setDeletingTransaction] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('all');

    // Create a list of unique months from transactions for the filter dropdown
    const monthOptions = useMemo(() => {
        const months = new Set(transactions.map(t => t.date.substring(0, 7))); // 'YYYY-MM'
        return Array.from(months).map(monthStr => {
            const date = new Date(monthStr + '-02'); // Use day 2 to avoid timezone issues
            return {
                value: monthStr,
                label: date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
            };
        });
    }, [transactions]);

    // Filter transactions based on the selected month
    const filteredTransactions = useMemo(() => {
        if (selectedMonth === 'all') {
            return transactions;
        }
        return transactions.filter(t => t.date.substring(0, 7) === selectedMonth);
    }, [transactions, selectedMonth]);

    // Calculate totals based on the *filtered* transactions
    const { totalIncome, totalExpense, netBalance } = useMemo(() => {
        const income = filteredTransactions
            .filter(t => t.type === 'Income')
            .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
        const expense = filteredTransactions
            .filter(t => t.type === 'Expense')
            .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
        return { totalIncome: income, totalExpense: expense, netBalance: income - expense };
    }, [filteredTransactions]);


    const handleExport = () => {
        const doc = new jsPDF();
        const reportTitle = "Cashflow Report";
        const monthLabel = selectedMonth === 'all' ? 'All Time' : monthOptions.find(m => m.value === selectedMonth)?.label || '';
        const generatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // --- PDF Header ---
        doc.setFontSize(18);
        doc.setTextColor('#1e3a8a'); // Dark Blue
        doc.text("Badminton Pro Club", 14, 22);
        doc.setFontSize(12);
        doc.setTextColor('#1f2937'); // Dark Gray
        doc.text(reportTitle, 14, 30);
        doc.setFontSize(10);
        doc.setTextColor('#6b7280'); // Lighter Gray
        doc.text(`Period: ${monthLabel}`, 14, 36);

        // --- Data Table ---
        autoTable(doc, {
            startY: 45,
            head: [['Date', 'Description', 'Type', 'Amount']],
            body: filteredTransactions.map(t => [formatDate(t.date), t.description, t.type, formatCurrency(t.amount)]),
            theme: 'striped',
            headStyles: {
                fillColor: '#312e81', // Indigo
                textColor: '#ffffff'
            },
            styles: {
                font: 'helvetica',
                fontSize: 9
            },
            // Add a footer to each page
            didDrawPage: (data) => {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor('#6b7280');
                doc.text(`Generated on: ${generatedDate}`, 14, doc.internal.pageSize.height - 10);
                doc.text(`Page ${data.pageNumber} of ${pageCount}`, doc.internal.pageSize.width - 35, doc.internal.pageSize.height - 10);
            }
        });

        // --- Summary Section ---
        let finalY = doc.lastAutoTable.finalY; // Get Y position of the last table
        doc.setFontSize(12);
        doc.text("Financial Summary", 14, finalY + 15);

        // Total Income
        doc.setFontSize(10);
        doc.setTextColor('#166534'); // Green
        doc.text("Total Income:", 14, finalY + 22);
        doc.text(formatCurrency(totalIncome), 60, finalY + 22);

        // Total Expense
        doc.setTextColor('#be123c'); // Red
        doc.text("Total Expense:", 14, finalY + 28);
        doc.text(formatCurrency(totalExpense), 60, finalY + 28);

        // Net Balance
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#1e3a8a'); // Dark Blue
        doc.text("Net Balance:", 14, finalY + 36);
        doc.text(formatCurrency(netBalance), 60, finalY + 36);

        doc.save(`cashflow-report-${selectedMonth}.pdf`);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const transactionData = { type: formData.get('type'), description: formData.get('description'), amount: parseFloat(formData.get('amount')), date: formData.get('date') };
        try {
            if (editingTransaction) {
                // Not implemented in backend example, but would be a PUT request
            } else {
                const response = await fetch(`${API_BASE_URL}/api/cashflow`, {method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(transactionData)});
                const newTransaction = await response.json();
                setTransactions([newTransaction, ...transactions].sort((a,b) => new Date(b.date) - new Date(a.date)));
            }
        } catch (error) { console.error("Error saving transaction", error) }
        finally { setShowModal(false); setEditingTransaction(null); }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`${API_BASE_URL}/api/cashflow/${id}`, { method: 'DELETE' });
            setTransactions(transactions.filter(t => t.id !== id));
        } catch(err) { console.error(err); }
        finally { setDeletingTransaction(null); }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <PageHeader title="Cashflow">
                 <div className="flex items-center gap-4">
                    <div>
                        <label htmlFor="month-filter" className="sr-only">Filter by Month</label>
                        <select
                            id="month-filter"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Time</option>
                            {monthOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={() => { setEditingTransaction(null); setShowModal(true); }} className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-semibold text-sm"><PlusCircle size={18} /> Add Transaction</button>
                    <button onClick={handleExport} className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg flex items-center gap-2 font-semibold text-sm"><Download size={18} /> Export PDF</button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-green-50 p-6 rounded-xl"><h3 className="text-green-800 font-semibold">Total Income</h3><p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(totalIncome)}</p></div>
                <div className="bg-orange-50 p-6 rounded-xl"><h3 className="text-orange-800 font-semibold">Total Expense</h3><p className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(totalExpense)}</p></div>
                <div className="bg-indigo-50 p-6 rounded-xl"><h3 className="text-indigo-800 font-semibold">Net Balance</h3><p className="text-2xl font-bold text-indigo-600 mt-2">{formatCurrency(netBalance)}</p></div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr className="border-b"><th className="p-4 text-left font-semibold text-gray-600">Date</th><th className="p-4 text-left font-semibold text-gray-600">Description</th><th className="p-4 text-left font-semibold text-gray-600">Type</th><th className="p-4 text-right font-semibold text-gray-600">Amount</th><th className="p-4 text-left font-semibold text-gray-600">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredTransactions.map(t => (<tr key={t.id}><td className="p-4 text-gray-600">{formatDate(t.date)}</td><td className="p-4 font-medium text-gray-800">{t.description}</td><td className="p-4"><span className={`font-semibold text-xs ${t.type === 'Income' ? 'text-green-700' : 'text-orange-700'}`}>{t.type}</span></td><td className={`p-4 text-right font-mono ${t.type === 'Income' ? 'text-green-600' : 'text-orange-600'}`}>{formatCurrency(t.amount)}</td><td className="p-4 flex gap-2"><button onClick={() => { setEditingTransaction(t); setShowModal(true); }} className="text-gray-500 hover:text-indigo-600 p-1.5 rounded-md"><Edit size={16}/></button><button onClick={() => setDeletingTransaction(t)} className="text-gray-500 hover:text-red-600 p-1.5 rounded-md"><Trash2 size={16}/></button></td></tr>))}
                    </tbody>
                </table>
            </div>

            {showModal && <Modal onClose={() => { setShowModal(false); setEditingTransaction(null); }} title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}><form onSubmit={handleFormSubmit} className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select name="type" defaultValue={editingTransaction?.type} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white"><option value="Income">Income</option><option value="Expense">Expense</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" name="date" defaultValue={editingTransaction?.date || new Date().toISOString().split('T')[0]} className="w-full p-2.5 border border-gray-300 rounded-lg" required /></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input type="text" name="description" defaultValue={editingTransaction?.description} className="w-full p-2.5 border border-gray-300 rounded-lg" required /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rp)</label><input type="number" step="1" name="amount" defaultValue={editingTransaction?.amount} className="w-full p-2.5 border border-gray-300 rounded-lg" required /></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => { setShowModal(false); setEditingTransaction(null); }} className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg font-semibold text-sm">Cancel</button><button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm">Save</button></div></form></Modal>}
            {deletingTransaction && <ConfirmationModal title="Delete Transaction" message={`Are you sure you want to delete this transaction?`} onConfirm={() => handleDelete(deletingTransaction.id)} onCancel={() => setDeletingTransaction(null)} />}
        </div>
    );
};
const Tournament = ({ tournaments, setTournaments, members }) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(null);
    const [deletingTournament, setDeletingTournament] = useState(null);
    const [viewingTournament, setViewingTournament] = useState(null);

    const handleCreate = async (newTournamentData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tournaments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTournamentData) });
            const newTournament = await response.json();
            setTournaments([newTournament, ...tournaments]);
        } catch(err) { console.error(err); }
        finally { setShowCreateModal(false); }
    };
    const handleUpdate = async (updatedTournament) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tournaments/${updatedTournament.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedTournament) });
            const result = await response.json();
            setTournaments(tournaments.map(t => t.id === updatedTournament.id ? result : t));
        } catch(err) { console.error(err); }
        finally { setShowEditModal(null); }
    };
    const handleDelete = async () => {
        if (!deletingTournament) return;
        try {
            await fetch(`${API_BASE_URL}/api/tournaments/${deletingTournament.id}`, { method: 'DELETE' });
            setTournaments(tournaments.filter(t => t.id !== deletingTournament.id));
        } catch(err) { console.error(err); }
        finally { setDeletingTournament(null); }
    }

    if (viewingTournament) {
        return <TournamentBracket tournament={viewingTournament} setTournament={(t) => { handleUpdate(t); setViewingTournament(t); }} onBack={() => setViewingTournament(null)} />;
    }

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <PageHeader title="Tournaments" onButtonClick={() => setShowCreateModal(true)} buttonText="Create Tournament" />
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-4 text-left font-semibold text-gray-600">Name</th><th className="p-4 text-left font-semibold text-gray-600">Type</th><th className="p-4 text-left font-semibold text-gray-600">Status</th><th className="p-4 text-left font-semibold text-gray-600">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {tournaments.map(t => (
                            <tr key={t.id}>
                                <td className="p-4 font-medium text-gray-800">{t.name}</td>
                                <td className="p-4 text-gray-600">{t.type}</td>
                                <td className="p-4"><span className={`px-2.5 py-1 rounded-full font-medium text-xs ${t.status === 'Completed' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>{t.status}</span></td>
                                <td className="p-4 flex items-center gap-2">
                                    <button onClick={() => setViewingTournament(t)} className="font-medium text-indigo-600 hover:text-indigo-800">View Bracket</button>
                                    <button onClick={() => setShowEditModal(t)} className="text-gray-500 hover:text-indigo-600 p-1.5 rounded-md hover:bg-gray-100"><Edit size={16}/></button>
                                    <button onClick={() => setDeletingTournament(t)} className="text-gray-500 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showCreateModal && <CreateTournamentModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} members={members} />}
            {showEditModal && <Modal onClose={() => setShowEditModal(null)} title="Edit Tournament">
                    <div className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
                        <input type="text" value={showEditModal.name} onChange={(e) => setShowEditModal({...showEditModal, name: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg"/></div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowEditModal(null)} className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg font-semibold text-sm">Cancel</button>
                            <button onClick={() => handleUpdate(showEditModal)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm">Save Changes</button>
                        </div>
                    </div>
                </Modal>}
            {deletingTournament && <ConfirmationModal title="Delete Tournament" message={`Are you sure you want to delete "${deletingTournament.name}"? This action cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDeletingTournament(null)} />}
        </div>
    );
};
const CreateTournamentModal = ({ onClose, onCreate, members }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState("Men's Singles");
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [externalPlayers, setExternalPlayers] = useState([]);
    const [externalPlayerName, setExternalPlayerName] = useState('');
    const [externalPlayerGender, setExternalPlayerGender] = useState('Male');
    const [error, setError] = useState('');
    
    const allAvailablePlayers = useMemo(() => {
        const memberPlayers = members.map(m => ({...m, type: 'member'}));
        const external = externalPlayers.map(p => ({...p, type: 'external'}));
        const combined = [...memberPlayers, ...external];
        if (type === "Men's Singles" || type === "Men's Doubles") return combined.filter(p => p.gender === 'Male');
        if (type === "Women's Singles" || type === "Women's Doubles") return combined.filter(p => p.gender === 'Female');
        if (type === "Mixed Doubles") return combined;
        return [];
    }, [type, members, externalPlayers]);
    const handleAddExternalPlayer = () => {
        if (!externalPlayerName) return;
        setExternalPlayers([...externalPlayers, { id: `ext-${Date.now()}`, name: externalPlayerName, gender: externalPlayerGender }]);
        setExternalPlayerName('');
    };
    const handlePlayerSelect = (playerId) => { setSelectedPlayers(prev => prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]); };
    const handleCreate = () => {
        setError('');
        if (!name.trim()) { setError('Tournament Name is required.'); return; }
        const minPlayers = type.includes('Doubles') ? 4 : 2;
        if (selectedPlayers.length < minPlayers) { setError(`At least ${minPlayers} players must be selected for ${type}.`); return; }
        if (type.includes('Doubles') && selectedPlayers.length % 2 !== 0) { setError('An even number of players must be selected for Doubles.'); return; }
        
        let teams = [];
        const players = selectedPlayers.map(id => allAvailablePlayers.find(m => m.id === id));
        let shuffledNames = [...teamNamePool].sort(() => 0.5 - Math.random());
        
        if (type.includes('Singles')) teams = players.map(p => ({ id: p.id, name: p.name, players:[p] }));
        else {
            let shuffled = [...players].sort(() => 0.5 - Math.random());
            if (type === 'Mixed Doubles') {
                const men = shuffled.filter(p => p.gender === 'Male');
                const women = shuffled.filter(p => p.gender === 'Female');
                if (men.length !== women.length) { setError('Mixed Doubles requires an equal number of male and female players.'); return; }
                for (let i = 0; i < men.length; i++) { 
                    const teamName = `Team ${shuffledNames.pop() || (i + 1)}`;
                    teams.push({ id: `team-${i}`, name: teamName, players: [men[i], women[i]] }); 
                }
            } else {
                 for (let i = 0; i < shuffled.length; i += 2) { 
                    if (shuffled[i+1]) { 
                        const teamName = `Team ${shuffledNames.pop() || (i/2 + 1)}`;
                        teams.push({ id: `team-${i}`, name: teamName, players: [shuffled[i], shuffled[i+1]] }); 
                    } 
                }
            }
        }
        
        let powerOf2 = 1;
        while(powerOf2 < teams.length) powerOf2 *= 2;
        const byes = powerOf2 - teams.length;
        for(let i=0; i<byes; i++) teams.push({id: `bye-${i}`, name: 'BYE', players:[]});
        const shuffledTeams = teams.sort(() => 0.5 - Math.random());
        const initialRound = [];
        for (let i = 0; i < shuffledTeams.length; i += 2) {
            const team1 = shuffledTeams[i], team2 = shuffledTeams[i+1];
            let winner = null;
            if (team1.name === 'BYE') winner = team2;
            if (team2.name === 'BYE') winner = team1;
            initialRound.push({ matchId: `m${i/2}`, team1, team2, winner });
        }
        onCreate({ name, type, status: 'Upcoming', bracket: [initialRound] });
    };

    const GenderIcon = ({gender}) => gender === 'Male' ? <Mars size={14} className="text-blue-500" /> : <Venus size={14} className="text-pink-500" />;

    return (
        <Modal onClose={onClose} title="Create New Tournament" size="2xl">
           <div className="space-y-4">
                {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tournament Type</label><select value={type} onChange={e => {setType(e.target.value); setSelectedPlayers([])}} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white"><option>Men's Singles</option><option>Women's Singles</option><option>Men's Doubles</option><option>Women's Doubles</option><option>Mixed Doubles</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Add External Player (Guest)</label><div className="flex gap-2"><input type="text" placeholder="Guest Name" value={externalPlayerName} onChange={e => setExternalPlayerName(e.target.value)} className="flex-grow p-2.5 border border-gray-300 rounded-lg" /><select value={externalPlayerGender} onChange={e => setExternalPlayerGender(e.target.value)} className="p-2.5 border border-gray-300 rounded-lg bg-white"><option>Male</option><option>Female</option></select><button onClick={handleAddExternalPlayer} className="bg-gray-200 text-gray-700 px-4 rounded-lg hover:bg-gray-300"><UserPlus size={18}/></button></div></div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Players ({selectedPlayers.length} selected)</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border border-gray-200 rounded-lg p-2 max-h-60 overflow-y-auto">
                        {allAvailablePlayers.map(player => (<label key={player.id} className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${selectedPlayers.includes(player.id) ? 'bg-indigo-100' : 'hover:bg-gray-50'}`}><input type="checkbox" checked={selectedPlayers.includes(player.id)} onChange={() => handlePlayerSelect(player.id)} className="form-checkbox h-4 w-4 text-indigo-600"/><GenderIcon gender={player.gender} /><span className="flex-1">{player.name}</span>{player.type === 'external' && <span className="text-xs text-gray-500">(Guest)</span>}</label>))}
                    </div>
                </div>
                 <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg font-semibold text-sm">Cancel</button><button onClick={handleCreate} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm">Create Bracket</button></div>
            </div>
        </Modal>
    );
};
// REPLACE the existing TournamentBracket component with this enhanced version.
const TournamentBracket = ({ tournament, setTournament, onBack }) => {
    const [bracket, setBracket] = useState(tournament.bracket);
    // STATE: For mobile view, track the current round index
    const [currentRound, setCurrentRound] = useState(0);
    // STATE: For determining which view to render
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        // This effect detects screen size changes to switch between mobile and desktop views
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setBracket(tournament.bracket);
        // Reset to the first round if the tournament data changes
        setCurrentRound(0);
    }, [tournament.bracket]);

    // This effect automatically creates the next round when the current one is complete
    useEffect(() => {
        if (!Array.isArray(bracket) || bracket.length === 0) return;
        const lastRound = bracket[bracket.length - 1];
        if (!Array.isArray(lastRound)) return;

        const winners = lastRound.map(match => match.winner).filter(Boolean);
        // Check if all matches in the last round have a winner and it's not the final match
        if (winners.length > 0 && winners.length === lastRound.length && winners.length > 1) {
             // If the bracket is balanced, create the next round
            if (winners.length % 2 === 0) {
                const nextRound = [];
                for (let i = 0; i < winners.length; i += 2) { 
                    nextRound.push({ matchId: `r${bracket.length}-m${i/2}`, team1: winners[i], team2: winners[i+1], winner: null });
                }
                setBracket(prevBracket => [...prevBracket, nextRound]);
            }
        }
    }, [bracket]);

    const setWinner = (roundIndex, matchIndex, winner) => {
        const newBracket = JSON.parse(JSON.stringify(bracket)); // Deep copy
        newBracket[roundIndex][matchIndex].winner = winner;
        
        const updatedTournament = { ...tournament, bracket: newBracket };
        
        // Determine if the tournament is completed
        const finalRound = newBracket[newBracket.length - 1];
        const isCompleted = finalRound.length === 1 && finalRound[0].winner;

        if (isCompleted) {
            updatedTournament.status = 'Completed';
        } else {
            updatedTournament.status = 'In Progress';
        }
        
        setTournament(updatedTournament); // This triggers the API call in the parent
    };

    const MatchCard = ({ match, roundIndex, matchIndex }) => (
        <div className="bg-white p-2.5 rounded-lg border border-gray-200 relative shadow-sm">
           <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
               Match {matchIndex + 1}
           </div>
           <div className="flex flex-col gap-1 text-sm">
            {[match.team1, match.team2].map((team, teamIndex) => {
                if (!team) return null; // Handle cases where a team might be null temporarily
                const isWinner = match.winner?.id === team.id;
                const canSetWinner = !match.winner && team.name !== 'BYE' && tournament.status !== 'Completed';

                return (
                    <div 
                        key={teamIndex} 
                        onClick={() => canSetWinner && setWinner(roundIndex, matchIndex, team)} 
                        className={`
                            flex justify-between items-center p-2 rounded-md transition-all
                            ${canSetWinner ? 'cursor-pointer hover:bg-indigo-50' : ''} 
                            ${isWinner ? 'bg-green-100' : ''}
                        `}
                    >
                        <div>
                            <span className={`
                                ${isWinner ? 'font-bold text-green-800' : 'text-gray-700'}
                                ${team.name === 'BYE' ? 'text-gray-400' : ''}
                            `}>
                                {team.name}
                            </span>
                            {Array.isArray(team.players) && team.players.length > 1 && 
                                <div className="text-xs text-gray-500 mt-0.5">{team.players.map(p => p.name).join(' & ')}</div>
                            }
                        </div>
                        {isWinner && <span className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full font-bold">WIN</span>}
                    </div>
                );
            })}
            </div>
        </div>
    );
    
    // RENDER FUNCTION for the paginated mobile view
    const renderMobileView = () => (
        <div className="flex flex-col">
            <h3 className="font-bold text-center text-gray-500 text-sm uppercase tracking-wider mb-8">
                Round {currentRound + 1}
            </h3>
            <div className="flex flex-col gap-8">
                {Array.isArray(bracket[currentRound]) && bracket[currentRound].map((match, matchIndex) => (
                    <MatchCard key={match.matchId} match={match} roundIndex={currentRound} matchIndex={matchIndex} />
                ))}
            </div>
            {/* Mobile Navigation */}
            <div className="mt-8 flex items-center justify-between">
                <button 
                    onClick={() => setCurrentRound(r => r - 1)}
                    disabled={currentRound === 0}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm font-medium text-gray-600">
                    {currentRound + 1} / {bracket.length}
                </span>
                <button 
                    onClick={() => setCurrentRound(r => r + 1)}
                    disabled={currentRound >= bracket.length - 1}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );

    // RENDER FUNCTION for the horizontally scrollable desktop view
    const renderDesktopView = () => (
        <div className="flex gap-8 overflow-x-auto pb-4">
            {Array.isArray(bracket) && bracket.map((round, roundIndex) => (
                <div key={roundIndex} className="flex flex-col gap-10 min-w-[300px] pt-8">
                    <h3 className="font-bold text-center text-gray-500 text-sm uppercase tracking-wider">
                        Round {roundIndex + 1}
                    </h3>
                    {Array.isArray(round) && round.map((match, matchIndex) => (
                       <MatchCard key={match.matchId} match={match} roundIndex={roundIndex} matchIndex={matchIndex} />
                    ))}
                </div>
            ))}
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg mr-4 flex items-center">
                    <ChevronLeft size={20}/> <span className="hidden sm:inline ml-1">Back</span>
                </button>
                <div>
                    <h1 className="text-xl sm:text-3xl font-bold text-gray-800">{tournament.name}</h1>
                    <p className="text-gray-500">{tournament.type} - {tournament.status}</p>
                </div>
            </div>

            {/* Conditionally render the correct view based on screen size */}
            {isMobile ? renderMobileView() : renderDesktopView()}
        </div>
    );
};
const ScoreCounter = () => {
    const [score1, setScore1] = useState(0);
    const [score2, setScore2] = useState(0);
    const [name1, setName1] = useState('Team 1');
    const [name2, setName2] = useState('Team 2');
    
    const handleReset = () => {
        setScore1(0);
        setScore2(0);
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <PageHeader title="Live Score Counter">
                <button onClick={handleReset} className="bg-gray-200 text-gray-800 px-4 py-2.5 rounded-lg hover:bg-gray-300 flex items-center gap-2 font-semibold text-sm transition-all">
                    <RotateCw size={16} /> Reset Scores
                </button>
            </PageHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {/* Team 1 Score */}
                <div className="bg-white p-6 rounded-xl border-4 border-indigo-500 text-center flex flex-col">
                    <input type="text" value={name1} onChange={(e) => setName1(e.target.value)} className="text-3xl font-bold text-gray-800 text-center bg-transparent focus:outline-none focus:bg-gray-100 rounded-lg py-2 mb-4" />
                    <p className="text-8xl font-bold text-indigo-600 my-auto">{score1}</p>
                    <div className="flex justify-center gap-4 mt-6">
                        <button onClick={() => setScore1(s => s > 0 ? s - 1 : 0)} className="bg-gray-200 text-gray-800 rounded-full w-16 h-16 flex items-center justify-center text-3xl hover:bg-gray-300"><Minus/></button>
                        <button onClick={() => setScore1(s => s + 1)} className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl hover:bg-indigo-700"><PlusCircle/></button>
                    </div>
                </div>
                 {/* Team 2 Score */}
                 <div className="bg-white p-6 rounded-xl border-4 border-gray-300 text-center flex flex-col">
                    <input type="text" value={name2} onChange={(e) => setName2(e.target.value)} className="w-full text-3xl font-bold text-gray-800 text-center bg-transparent focus:outline-none focus:bg-gray-100 rounded-lg py-2 mb-4" />
                    <p className="text-8xl font-bold text-gray-800 my-auto">{score2}</p>
                    <div className="flex justify-center gap-4 mt-6">
                        <button onClick={() => setScore2(s => s > 0 ? s - 1 : 0)} className="bg-gray-200 text-gray-800 rounded-full w-16 h-16 flex items-center justify-center text-3xl hover:bg-gray-300"><Minus/></button>
                        <button onClick={() => setScore2(s => s + 1)} className="bg-gray-800 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl hover:bg-black"><PlusCircle/></button>
                    </div>
                </div>
            </div>
        </div>
    );
};
const LoginPage = ({ onLogin, error }) => {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">🏸 Badminton Pro</h1>
                    <p className="text-gray-500 mt-2 text-sm">Admin Login</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">Username</label>
                        <input
                            className="w-full p-2.5 border border-gray-300 rounded-lg"
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
                        <input
                            className="w-full p-2.5 border border-gray-300 rounded-lg"
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Login</button>
                </form>
            </div>
        </div>
    );
};

// REPLACE the old LandingPage component in App.js with this new, enhanced version.
const LandingPage = ({ onAdminLogin }) => {
    useEffect(() => {
        document.title = "Badminton Pro | Jakarta's Premier Badminton Club & Court Booking";
        // Create or update the meta description tag
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', 'Join Badminton Pro, the top badminton club in Jakarta. We offer modern court facilities, professional coaching, competitive tournaments, and a vibrant community for all skill levels.');

        // Optional: Cleanup function to reset title when the component unmounts
        return () => {
            document.title = 'Badminton Pro'; // Or your default app title
        };
    }, []); // Empty dependency array means this runs only once on mount
    return (
    <div className="bg-white text-gray-800 font-sans antialiased">
        {/* --- Header --- */}
        <header className="sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-gray-200">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">🏸 Badminton Pro</h1>
                <nav className="hidden md:flex gap-8 items-center text-sm font-semibold">
                    <a href="#about" className="hover:text-indigo-600 transition-colors">About</a>
                    <a href="#programs" className="hover:text-indigo-600 transition-colors">Programs</a>
                    <a href="#contact" className="hover:text-indigo-600 transition-colors">Contact</a>
                </nav>
                <a href="#contact" className="hidden md:inline-block bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 text-sm font-semibold shadow-sm">
                    Become a Member
                </a>
            </div>
        </header>

        {/* --- Full-Screen Hero Section --- */}
        <section className="relative h-screen text-white flex items-center justify-center">
            {/* The background image is the same as before */}
            <img src="https://images.unsplash.com/photo-1750008267598-7f68e1a25ab8?q=80&w=2070&auto=format&fit=crop" alt="Badminton action" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center px-4 animate-fade-in">
                    {/* The heading and paragraph are the same as before */}
                    <h2 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">Unleash Your Inner Champion</h2>
                    <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">Join a vibrant community of passionate players. All skill levels welcome.</p>
                    <a href="#programs" className="mt-8 inline-block bg-white text-indigo-700 font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition-transform hover:scale-105">
                        Explore Programs
                    </a>
                </div>
            </div>
        </section>
        
        {/* --- About/Features Section --- */}
        <section id="about" className="py-20 bg-gray-50">
            <div className="container mx-auto px-6 text-center">
                <h3 className="text-3xl font-bold mb-4">The Premier Badminton Experience</h3>
                <p className="text-gray-600 max-w-3xl mx-auto mb-12">We are dedicated to providing the best facilities, a welcoming community, and opportunities for players of every level to thrive.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 bg-white rounded-xl shadow-md border">
                        <Trophy size={40} className="mx-auto text-indigo-500 mb-4" />
                        <h4 className="font-bold text-lg mb-2">Modern Facilities</h4>
                        <p className="text-sm text-gray-600">Professional-grade courts with excellent lighting and amenities to ensure the best playing conditions.</p>
                    </div>
                    <div className="p-8 bg-white rounded-xl shadow-md border">
                        <Users size={40} className="mx-auto text-indigo-500 mb-4" />
                        <h4 className="font-bold text-lg mb-2">Vibrant Community</h4>
                        <p className="text-sm text-gray-600">Connect with fellow badminton enthusiasts, find hitting partners, and join our regular social events.</p>
                    </div>
                    <div className="p-8 bg-white rounded-xl shadow-md border">
                        <BarChart2 size={40} className="mx-auto text-indigo-500 mb-4" />
                        <h4 className="font-bold text-lg mb-2">All Skill Levels</h4>
                        <p className="text-sm text-gray-600">From absolute beginners to advanced competitors, we offer programs and events tailored to you.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Programs Section --- */}
        <section id="programs" className="py-20">
            <div className="container mx-auto px-6 text-center">
                <h3 className="text-3xl font-bold mb-12">Find Your Perfect Game</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="border rounded-lg p-6 hover:shadow-xl transition-shadow">
                        <h4 className="font-bold text-xl mb-2">Casual Play</h4>
                        <p className="text-gray-600">Book a court and enjoy a friendly game with your friends and family.</p>
                    </div>
                    <div className="border rounded-lg p-6 hover:shadow-xl transition-shadow">
                        <h4 className="font-bold text-xl mb-2">Tournaments</h4>
                        <p className="text-gray-600">Test your skills in our monthly singles, doubles, and mixed-doubles tournaments.</p>
                    </div>
                    <div className="border rounded-lg p-6 hover:shadow-xl transition-shadow">
                        <h4 className="font-bold text-xl mb-2">Leagues</h4>
                        <p className="text-gray-600">Join a competitive league for a season of structured and challenging matches.</p>
                    </div>
                    <div className="border rounded-lg p-6 hover:shadow-xl transition-shadow">
                        <h4 className="font-bold text-xl mb-2">Coaching</h4>
                        <p className="text-gray-600">Private and group lessons available from our certified professional coaches.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Footer --- */}
        <footer id="contact" className="bg-gray-800 text-white">
            <div className="container mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                    <div>
                        <h3 className="text-lg font-bold mb-4">Badminton Pro</h3>
                        <p className="text-gray-400 text-sm">Your destination for all things badminton in Jakarta.</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-4">Contact Us</h3>
                        <p className="text-gray-400 text-sm">123 Badminton Ave, Jakarta, Indonesia</p>
                        <p className="text-gray-400 text-sm">contact@badmintonpro.com</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-4">Follow Us</h3>
                        <div className="flex justify-center md:justify-start gap-6">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">Instagram</a>
                            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">TikTok</a>
                        </div>
                    </div>
                </div>
                <div className="mt-12 border-t border-gray-700 pt-6 flex flex-col sm:flex-row justify-between items-center text-sm">
                    <p className="text-gray-500 mb-4 sm:mb-0">&copy; {new Date().getFullYear()} Badminton Pro. All Rights Reserved.</p>
                    <button onClick={onAdminLogin} className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-xs font-semibold">
                        Admin Login
                    </button>
                </div>
            </div>
        </footer>
    </div>
    );
};

// --- Main App Component ---
export default function App() {
    const [page, setPage] = useState(window.location.hash.substring(1) || 'landing');
    // const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [loginError, setLoginError] = useState('');

    // State for all data, now fetched from API
    const [members, setMembers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    
    // Fetch all data from the API on initial load or when auth state changes
    useEffect(() => {
        if(isAuthenticated) {
            const fetchData = async () => {
                try {
                    const [membersRes, bookingsRes, cashflowRes, tournamentsRes] = await Promise.all([
                        fetch(`${API_BASE_URL}/api/members`),
                        fetch(`${API_BASE_URL}/api/bookings`),
                        fetch(`${API_BASE_URL}/api/cashflow`),
                        fetch(`${API_BASE_URL}/api/tournaments`),
                    ]);
                    setMembers(await membersRes.json());
                    setBookings(await bookingsRes.json());
                    setTransactions(await cashflowRes.json());
                    setTournaments(await tournamentsRes.json());
                } catch (error) {
                    console.error("Failed to fetch initial data:", error);
                }
            };
            fetchData();
        }
    }, [isAuthenticated]);


    useEffect(() => {
        const handleResize = () => { if (window.innerWidth < 768) { setIsSidebarOpen(false); } };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.substring(1);
            if (isAuthenticated) {
                setPage(hash || 'dashboard');
            } else {
                setPage(hash === 'login' ? 'login' : 'landing');
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Set initial page
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [isAuthenticated]);

    useEffect(() => {
        // Load PDF generation libraries
        const jspdfScript = document.createElement('script');
        jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        jspdfScript.async = true;
        document.body.appendChild(jspdfScript);

        const autotableScript = document.createElement('script');
        autotableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf-autotable.min.js';
        autotableScript.async = true;
        document.body.appendChild(autotableScript);

        return () => {
            document.body.removeChild(jspdfScript);
            document.body.removeChild(autotableScript);
        };
    }, []);

    const handleLogin = async (username, password) => {
        setLoginError(''); // Clear previous errors
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Login failed');
            }

            const { token } = await response.json();
            localStorage.setItem('token', token); // Store the token
            setIsAuthenticated(true);
            window.location.hash = 'dashboard';

        } catch (error) {
            console.error("Login error:", error);
            setLoginError(error.message);
        }
    };
    const handleLogout = () => {
        localStorage.removeItem('token'); // Remove the token
        setIsAuthenticated(false);
        window.location.hash = 'landing';
    };
    
    const renderPage = () => {
        switch (page) {
            case 'dashboard': return <Dashboard members={members} bookings={bookings} transactions={transactions} tournaments={tournaments}/>;
            case 'membership': return <Membership members={members} setMembers={setMembers} bookings={bookings} />;
            case 'booking': return <Booking bookings={bookings} setBookings={setBookings} members={members} />;
            case 'tournaments': return <Tournament tournaments={tournaments} setTournaments={setTournaments} members={members} />;
            case 'scoreboard': return <ScoreCounter />;
            case 'cashflow': return <Cashflow transactions={transactions} setTransactions={setTransactions} />;
            default: return <LandingPage onAdminLogin={() => window.location.hash = 'login'} />;
        }
    };

    if (!isAuthenticated) {
        // Pass the error state and handler to LoginPage
        if (page === 'login') return <LoginPage onLogin={handleLogin} error={loginError} />;
        return <LandingPage onAdminLogin={() => window.location.hash = 'login'} />
    }
    
    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <div className="flex">
                <Sidebar page={page} handleLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                <div className="flex-1 flex flex-col h-screen">
                    {/* The new header is rendered here */}
                    <Header setIsOpen={setIsSidebarOpen} />
                    <main className="flex-1 overflow-y-auto">
                        {renderPage()}
                    </main>
                </div>
            </div>
        </div>
    );
}
