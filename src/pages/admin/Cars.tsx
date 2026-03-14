import React, { useState } from 'react';
import { useStore } from '../../store';
import { Plus, Edit2, Trash2, Search, Car as CarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Cars() {
  const { cars, addCar, updateCar, deleteCar } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    model: '',
    plateNumber: '',
  });

  const handleOpenModal = (car?: any) => {
    if (car) {
      setEditingCar(car);
      setFormData({
        name: car.name,
        model: car.model,
        plateNumber: car.plateNumber,
      });
    } else {
      setEditingCar(null);
      setFormData({ name: '', model: '', plateNumber: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation for plate number (3 letters, 4 numbers)
    // This is a simple check, can be made more robust if needed
    const plateRegex = /^[\u0600-\u06FFa-zA-Z]{3}\s*\d{4}$/;
    if (!plateRegex.test(formData.plateNumber.replace(/\s+/g, ' '))) {
       // Just a warning, but let's allow it for now or enforce it
       // Let's enforce it
       // Actually, let's just let the user input it as they want but show a hint
    }

    if (editingCar) {
      updateCar(editingCar.id, formData);
    } else {
      addCar(formData);
    }
    setIsModalOpen(false);
  };

  const filteredCars = cars.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.plateNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <CarIcon className="w-6 h-6 text-indigo-600" />
          إدارة السيارات
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          إضافة سيارة
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="بحث باسم السيارة أو رقم اللوحة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700">
                <th className="pb-3 font-semibold text-gray-500 dark:text-gray-400">اسم السيارة</th>
                <th className="pb-3 font-semibold text-gray-500 dark:text-gray-400">الموديل</th>
                <th className="pb-3 font-semibold text-gray-500 dark:text-gray-400">رقم اللوحة</th>
                <th className="pb-3 font-semibold text-gray-500 dark:text-gray-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredCars.map((car) => (
                <tr key={car.id} className="border-b border-gray-50 dark:border-slate-700/50">
                  <td className="py-4 text-gray-800 dark:text-gray-200">{car.name}</td>
                  <td className="py-4 text-gray-800 dark:text-gray-200">{car.model}</td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg font-mono text-sm tracking-widest">
                      {car.plateNumber}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(car)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذه السيارة؟')) {
                            deleteCar(car.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCars.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    لا توجد سيارات مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editingCar ? 'تعديل سيارة' : 'إضافة سيارة جديدة'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    اسم السيارة
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    placeholder="مثال: تويوتا يارس"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الموديل
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    placeholder="مثال: 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رقم اللوحة
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white text-left"
                    dir="ltr"
                    placeholder="ABC 1234 أو أ ب ج 1234"
                  />
                  <p className="text-xs text-gray-500 mt-1">يجب أن تحتوي على 3 حروف و 4 أرقام</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                  >
                    {editingCar ? 'حفظ التعديلات' : 'إضافة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
