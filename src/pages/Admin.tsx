import React, { useState } from 'react';
import { useStore, User, Branch, OperationalItem, InventoryItem, CustomRole, AVAILABLE_PERMISSIONS, ScheduledReadingItem } from '../store';
import { Users, Building2, ClipboardList, Package, Trash2, Plus, Save, Shield, ArrowRight, Clock } from 'lucide-react';

export default function Admin() {
  const { 
    currentUser, customRoles,
    users, addUser, updateUser, deleteUser,
    branches, addBranch, updateBranch, deleteBranch,
    operationalItems, addOperationalItem, updateOperationalItem, deleteOperationalItem,
    inventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem, copyInventoryItems,
    addCustomRole, updateCustomRole, deleteCustomRole,
    scheduledReadingItems, addScheduledReadingItem, updateScheduledReadingItem, deleteScheduledReadingItem
  } = useStore();

  const [activeTab, setActiveTab] = useState<'users' | 'branches' | 'operational' | 'inventory' | 'roles' | 'scheduled'>('users');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New User State
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({ employeeId: '', pin: '', name: '', roleId: customRoles[0]?.id || '', branchId: '' });
  
  // New Branch State
  const [newBranch, setNewBranch] = useState<Omit<Branch, 'id'>>({ name: '' });
  
  // New Operational Item State
  const [newOpItem, setNewOpItem] = useState<Omit<OperationalItem, 'id'>>({ name: '', category: '' });
  
  // New Inventory Item State
  const [newInvItem, setNewInvItem] = useState<Omit<InventoryItem, 'id'>>({ branchIds: [], name: '', unit: '', category: '' });

  // New Role State
  const [newRole, setNewRole] = useState<Omit<CustomRole, 'id'>>({ name: '', permissions: [] });

  // New Scheduled Item State
  const [newScheduledItem, setNewScheduledItem] = useState<Omit<ScheduledReadingItem, 'id'>>({ 
    name: '', 
    unit: '', 
    type: 'number', 
    scheduledTime: '09:00', 
    category: '' 
  });

  // Copy Inventory State
  const [copySource, setCopySource] = useState('');
  const [copyTarget, setCopyTarget] = useState('');

  const userRole = customRoles.find(r => r.id === currentUser?.roleId);
  if (!userRole?.permissions.includes('manage_system')) {
    return <div className="p-8 text-center text-red-600">غير مصرح لك بالدخول لهذه الصفحة</div>;
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateUser(editingId, newUser);
      setEditingId(null);
    } else {
      addUser(newUser);
    }
    setNewUser({ employeeId: '', pin: '', name: '', roleId: customRoles[0]?.id || '', branchId: '' });
  };

  const handleEditUser = (user: User) => {
    setEditingId(user.id);
    setNewUser({ employeeId: user.employeeId, pin: user.pin, name: user.name, roleId: user.roleId, branchId: user.branchId });
    setActiveTab('users');
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateBranch(editingId, newBranch);
      setEditingId(null);
    } else {
      addBranch(newBranch);
    }
    setNewBranch({ name: '' });
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingId(branch.id);
    setNewBranch({ name: branch.name });
    setActiveTab('branches');
  };

  const handleAddOpItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateOperationalItem(editingId, newOpItem);
      setEditingId(null);
    } else {
      addOperationalItem(newOpItem);
    }
    setNewOpItem({ name: '', category: '' });
  };

  const handleEditOpItem = (item: OperationalItem) => {
    setEditingId(item.id);
    setNewOpItem({ name: item.name, category: item.category });
    setActiveTab('operational');
  };

  const handleAddInvItem = (e: React.FormEvent) => {
    e.preventDefault();
    const itemData = {
      ...newInvItem,
      branchIds: selectedBranchId ? [...new Set([...newInvItem.branchIds, selectedBranchId])] : newInvItem.branchIds
    };

    if (editingId) {
      updateInventoryItem(editingId, itemData);
      setEditingId(null);
    } else {
      addInventoryItem(itemData);
    }
    setNewInvItem({ branchIds: [], name: '', unit: '' });
  };

  const handleEditInvItem = (item: InventoryItem) => {
    setEditingId(item.id);
    setNewInvItem({ branchIds: item.branchIds, name: item.name, unit: item.unit, category: item.category });
    setActiveTab('inventory');
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateCustomRole(editingId, newRole);
      setEditingId(null);
    } else {
      addCustomRole(newRole);
    }
    setNewRole({ name: '', permissions: [] });
  };

  const handleEditRole = (role: CustomRole) => {
    setEditingId(role.id);
    setNewRole({ name: role.name, permissions: role.permissions });
    setActiveTab('roles');
  };

  const handleAddScheduledItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateScheduledReadingItem(editingId, newScheduledItem);
      setEditingId(null);
    } else {
      addScheduledReadingItem(newScheduledItem);
    }
    setNewScheduledItem({ name: '', unit: '', type: 'number', scheduledTime: '09:00', category: '' });
  };

  const handleEditScheduledItem = (item: ScheduledReadingItem) => {
    setEditingId(item.id);
    setNewScheduledItem({ 
      name: item.name, 
      unit: item.unit || '', 
      type: item.type, 
      scheduledTime: item.scheduledTime, 
      category: item.category 
    });
    setActiveTab('scheduled');
  };

  const handleCopyInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (copySource && copyTarget && copySource !== copyTarget) {
      copyInventoryItems(copySource, copyTarget);
      alert('تم نسخ الأصناف بنجاح');
      setCopySource('');
      setCopyTarget('');
    }
  };

  const togglePermission = (permId: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const tabs = [
    { id: 'users', name: 'المستخدمين', icon: Users },
    { id: 'roles', name: 'الصلاحيات', icon: Shield },
    { id: 'branches', name: 'الفروع', icon: Building2 },
    { id: 'operational', name: 'بنود التشغيل', icon: ClipboardList },
    { id: 'scheduled', name: 'القراءات المجدولة', icon: Clock },
    { id: 'inventory', name: 'أصناف المخزون', icon: Package },
  ] as const;

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900">لوحة الإدارة</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Icon size={18} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingId ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h2>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">الاسم</label>
                <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">الرقم الوظيفي</label>
                <input type="text" value={newUser.employeeId} onChange={e => setNewUser({...newUser, employeeId: e.target.value})} className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">كود الدخول</label>
                <input type="text" value={newUser.pin} onChange={e => setNewUser({...newUser, pin: e.target.value})} className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">الصلاحية</label>
                <select value={newUser.roleId} onChange={e => setNewUser({...newUser, roleId: e.target.value})} className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" required>
                  {customRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">الفرع (اختياري)</label>
                <select value={newUser.branchId} onChange={e => setNewUser({...newUser, branchId: e.target.value})} className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2">
                  <option value="">كافة الفروع</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-5 flex gap-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 flex justify-center items-center gap-2">
                  <Plus size={18} /> {editingId ? 'حفظ التعديلات' : 'إضافة مستخدم'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setNewUser({ employeeId: '', pin: '', name: '', roleId: customRoles[0]?.id || '', branchId: '' }); }} className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white px-4 py-2 rounded-xl">إلغاء</button>
                )}
              </div>
            </form>

            <div className="mt-8">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">قائمة المستخدمين</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400">الاسم</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400">الرقم الوظيفي</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400">الصلاحية</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400">الفرع</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400 w-24">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{user.employeeId}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {customRoles.find(r => r.id === user.roleId)?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {user.branchId ? branches.find(b => b.id === user.branchId)?.name : 'كافة الفروع'}
                        </td>
                        <td className="px-4 py-3 text-sm flex gap-2">
                          <button onClick={() => handleEditUser(user)} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">تعديل</button>
                          {user.id !== currentUser.id && (
                            <button onClick={() => deleteUser(user.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingId ? 'تعديل صلاحية' : 'إضافة صلاحية جديدة'}</h2>
            <form onSubmit={handleAddRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">اسم الصلاحية</label>
                <input type="text" value={newRole.name} onChange={e => setNewRole({...newRole, name: e.target.value})} className="w-full md:w-1/2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" required placeholder="مثال: مشرف فرع" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">الأذونات</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <label key={perm.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={newRole.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-slate-300">{perm.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={!newRole.name || newRole.permissions.length === 0} className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 transition-all">
                  <Plus size={18} /> {editingId ? 'حفظ التعديلات' : 'إضافة الصلاحية'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setNewRole({ name: '', permissions: [] }); }} className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white px-4 py-2 rounded-xl">إلغاء</button>
                )}
              </div>
            </form>

            <div className="mt-8">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">قائمة الصلاحيات</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customRoles.map(role => (
                  <div key={role.id} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold text-gray-900 dark:text-white">{role.name}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditRole(role)} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 text-sm">تعديل</button>
                        {/* Prevent deleting roles that are in use or default ones */}
                        {!['r1', 'r2', 'r3'].includes(role.id) && !users.some(u => u.roleId === role.id) && (
                          <button onClick={() => deleteCustomRole(role.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map(permId => {
                        const perm = AVAILABLE_PERMISSIONS.find(p => p.id === permId);
                        return perm ? (
                          <span key={permId} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 text-[10px] px-2 py-1 rounded-md font-bold">
                            {perm.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingId ? 'تعديل فرع' : 'إضافة فرع جديد'}</h2>
            <form onSubmit={handleAddBranch} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">اسم الفرع</label>
                <input type="text" value={newBranch.name} onChange={e => setNewBranch({name: e.target.value})} className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" required />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 flex justify-center items-center gap-2 transition-all">
                  <Plus size={18} /> {editingId ? 'حفظ' : 'إضافة'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setNewBranch({ name: '' }); }} className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white px-4 py-2 rounded-xl">إلغاء</button>
                )}
              </div>
            </form>

            <div className="mt-8">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">قائمة الفروع</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {branches.map(branch => (
                  <div key={branch.id} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">{branch.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditBranch(branch)} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 text-sm">تعديل</button>
                      <button onClick={() => deleteBranch(branch.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'operational' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingId ? 'تعديل بند تشغيل' : 'إضافة بند تشغيل جديد'}</h2>
            <form onSubmit={handleAddOpItem} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">اسم البند</label>
                <input type="text" value={newOpItem.name} onChange={e => setNewOpItem({...newOpItem, name: e.target.value})} className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" required />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">التصنيف</label>
                <input type="text" value={newOpItem.category} onChange={e => setNewOpItem({...newOpItem, category: e.target.value})} className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" required placeholder="مثال: النظافة، المعدات..." />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 flex justify-center items-center gap-2 transition-all">
                  <Plus size={18} /> {editingId ? 'حفظ' : 'إضافة'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setNewOpItem({ name: '', category: '' }); }} className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white px-4 py-2 rounded-xl">إلغاء</button>
                )}
              </div>
            </form>

            <div className="mt-8">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">قائمة بنود التشغيل</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400">اسم البند</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400">التصنيف</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400 w-24">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {operationalItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.category}</td>
                        <td className="px-4 py-3 text-sm flex gap-2">
                          <button onClick={() => handleEditOpItem(item)} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">تعديل</button>
                          <button onClick={() => deleteOperationalItem(item.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingId ? 'تعديل قراءة مجدولة' : 'إضافة قراءة مجدولة جديدة'}</h2>
            <form onSubmit={handleAddScheduledItem} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">اسم القراءة</label>
                <input type="text" value={newScheduledItem.name} onChange={e => setNewScheduledItem({...newScheduledItem, name: e.target.value})} className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" required placeholder="مثال: حرارة الثلاجة" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">النوع</label>
                <select value={newScheduledItem.type} onChange={e => setNewScheduledItem({...newScheduledItem, type: e.target.value as 'number' | 'boolean'})} className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" required>
                  <option value="number">رقمي (قيمة)</option>
                  <option value="boolean">فحص (نعم/لا)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">الوحدة (اختياري)</label>
                <input type="text" value={newScheduledItem.unit} onChange={e => setNewScheduledItem({...newScheduledItem, unit: e.target.value})} className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" placeholder="مثال: °C" disabled={newScheduledItem.type === 'boolean'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">وقت التسجيل</label>
                <input type="time" value={newScheduledItem.scheduledTime} onChange={e => setNewScheduledItem({...newScheduledItem, scheduledTime: e.target.value})} className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">التصنيف</label>
                <input type="text" value={newScheduledItem.category} onChange={e => setNewScheduledItem({...newScheduledItem, category: e.target.value})} className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" required placeholder="مثال: المعدات" />
              </div>
              <div className="md:col-span-3 lg:col-span-5 flex gap-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 flex justify-center items-center gap-2 transition-all">
                  <Plus size={18} /> {editingId ? 'حفظ التعديلات' : 'إضافة القراءة'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setNewScheduledItem({ name: '', unit: '', type: 'number', scheduledTime: '09:00', category: '' }); }} className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white px-4 py-2 rounded-xl">إلغاء</button>
                )}
              </div>
            </form>

            <div className="mt-8">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">قائمة القراءات المجدولة</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400">اسم القراءة</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400">النوع</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400">الوقت</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400">التصنيف</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-slate-400 w-24">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {scheduledReadingItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {item.name} {item.unit ? `(${item.unit})` : ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {item.type === 'number' ? 'رقمي' : 'فحص'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.scheduledTime}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.category}</td>
                        <td className="px-4 py-3 text-sm flex gap-2">
                          <button onClick={() => handleEditScheduledItem(item)} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">تعديل</button>
                          <button onClick={() => deleteScheduledReadingItem(item.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {!selectedBranchId ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">إدارة أصناف المخزون حسب الفرع</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branches.map(branch => (
                    <div key={branch.id} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{branch.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                          {inventoryItems.filter(item => item.branchIds.includes(branch.id)).length} صنف مسجل
                        </p>
                      </div>
                      <button 
                        onClick={() => setSelectedBranchId(branch.id)}
                        className="w-full bg-white dark:bg-slate-800 border border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors font-medium"
                      >
                        إدارة أصناف المخزون
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-12 p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
                  <h3 className="text-md font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
                    <Package size={20} />
                    أدوات سريعة
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-700 dark:text-slate-300">نسخ الأصناف بين الفروع</h4>
                      <form onSubmit={handleCopyInventory} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">من فرع</label>
                            <select value={copySource} onChange={e => setCopySource(e.target.value)} className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 text-sm" required>
                              <option value="">اختر المصدر</option>
                              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">إلى فرع</label>
                            <select value={copyTarget} onChange={e => setCopyTarget(e.target.value)} className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 text-sm" required>
                              <option value="">اختر الهدف</option>
                              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 text-sm font-bold transition-all">
                          نسخ الأصناف
                        </button>
                      </form>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-700 dark:text-slate-300">إضافة صنف عام (لكافة الفروع)</h4>
                      <button 
                        onClick={() => {
                          setNewInvItem({ branchIds: branches.map(b => b.id), name: '', unit: '' });
                          // We don't have a "Global" view, but we can just open the first branch or a generic one.
                          // Or better, just show the add form here.
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={18} /> إضافة صنف جديد
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        setSelectedBranchId(null);
                        setEditingId(null);
                        setNewInvItem({ branchIds: [], name: '', unit: '' });
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                      <ArrowRight size={24} className="rotate-180" />
                    </button>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        أصناف المخزون: {branches.find(b => b.id === selectedBranchId)?.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-slate-400">إدارة وتعديل الأصناف الخاصة بهذا الفرع</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 sticky top-6">
                      <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">
                        {editingId ? 'تعديل صنف' : 'إضافة صنف جديد'}
                      </h3>
                      <form onSubmit={handleAddInvItem} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">اسم الصنف</label>
                          <input 
                            type="text" 
                            value={newInvItem.name} 
                            onChange={e => setNewInvItem({...newInvItem, name: e.target.value})} 
                            className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" 
                            required 
                            placeholder="مثال: دجاج طازج"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">مجموعة المنتج</label>
                          <input 
                            type="text" 
                            value={newInvItem.category} 
                            onChange={e => setNewInvItem({...newInvItem, category: e.target.value})} 
                            className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" 
                            required 
                            placeholder="مثال: بروتين، خضروات..." 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">الوحدة</label>
                          <input 
                            type="text" 
                            value={newInvItem.unit} 
                            onChange={e => setNewInvItem({...newInvItem, unit: e.target.value})} 
                            className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2" 
                            required 
                            placeholder="كجم، حبة، لتر..." 
                          />
                        </div>
                        <div className="pt-2 flex gap-2">
                          <button type="submit" className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 flex justify-center items-center gap-2 font-bold shadow-lg shadow-indigo-500/20 transition-all">
                            {editingId ? <Save size={18} /> : <Plus size={18} />}
                            {editingId ? 'حفظ التعديلات' : 'إضافة الصنف'}
                          </button>
                          {editingId && (
                            <button 
                              type="button" 
                              onClick={() => { 
                                setEditingId(null); 
                                setNewInvItem({ branchIds: [], name: '', unit: '', category: '' }); 
                              }} 
                              className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white px-4 py-3 rounded-xl font-bold"
                            >
                              إلغاء
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="overflow-hidden border border-gray-100 dark:border-slate-700 rounded-3xl">
                      <table className="w-full text-right">
                        <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                          <tr>
                            <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">اسم الصنف</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">مجموعة المنتج</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400">الوحدة</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-slate-400 w-32">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700 bg-white dark:bg-slate-900/50">
                          {inventoryItems
                            .filter(item => item.branchIds.includes(selectedBranchId))
                            .map(item => (
                              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">{item.category}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">{item.unit}</td>
                                <td className="px-6 py-4 text-sm">
                                  <div className="flex gap-3">
                                    <button 
                                      onClick={() => handleEditInvItem(item)} 
                                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-bold"
                                    >
                                      تعديل
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (confirm('هل أنت متأكد من حذف هذا الصنف؟ سيتم حذفه من كافة الفروع.')) {
                                          deleteInventoryItem(item.id);
                                        }
                                      }} 
                                      className="text-red-500 hover:text-red-700 p-1"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          {inventoryItems.filter(item => item.branchIds.includes(selectedBranchId)).length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                                <Package size={48} className="mx-auto mb-4 opacity-20" />
                                <p>لا توجد أصناف مسجلة لهذا الفرع بعد</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
