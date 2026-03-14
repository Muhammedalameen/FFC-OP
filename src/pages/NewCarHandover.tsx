import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, X, Save, ArrowRight, Car, Calendar, FileText, Gauge, Fuel } from 'lucide-react';

export default function NewCarHandover() {
  const { cars, currentUser, addCarHandover } = useStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    carId: '',
    reason: '',
    expectedReturnDate: '',
    odometerReading: '',
    fuelLevel: 50,
    notes: '',
  });

  const [images, setImages] = useState({
    odometer: '',
    rightSide: '',
    leftSide: '',
    front: '',
    back: '',
  });

  const fileInputRefs = {
    odometer: useRef<HTMLInputElement>(null),
    rightSide: useRef<HTMLInputElement>(null),
    leftSide: useRef<HTMLInputElement>(null),
    front: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null),
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof images) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Compress image before saving
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.6 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setImages(prev => ({ ...prev, [type]: compressedDataUrl }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (type: keyof typeof images) => {
    setImages(prev => ({ ...prev, [type]: '' }));
    if (fileInputRefs[type].current) {
      fileInputRefs[type].current!.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.carId) {
      alert('الرجاء اختيار السيارة');
      return;
    }
    if (!formData.odometerReading) {
      alert('الرجاء إدخال قراءة العداد');
      return;
    }
    if (!formData.reason) {
      alert('الرجاء كتابة سبب الاستلام');
      return;
    }
    if (!images.odometer || !images.rightSide || !images.leftSide || !images.front || !images.back) {
      alert('الرجاء إرفاق جميع الصور المطلوبة');
      return;
    }

    setIsSubmitting(true);

    try {
      addCarHandover({
        carId: formData.carId,
        date: new Date().toISOString().split('T')[0],
        driverId: currentUser!.id,
        odometerReading: Number(formData.odometerReading),
        fuelLevel: formData.fuelLevel,
        reason: formData.reason,
        expectedReturnDate: formData.expectedReturnDate || undefined,
        odometerImage: images.odometer,
        rightSideImage: images.rightSide,
        leftSideImage: images.leftSide,
        frontImage: images.front,
        backImage: images.back,
        notes: formData.notes || undefined,
      });
      
      navigate('/car-handovers');
    } catch (error) {
      console.error('Error submitting handover:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ImageUploadBox = ({ type, label }: { type: keyof typeof images, label: string }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        {images[type] ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 aspect-video">
            <img src={images[type]} alt={label} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(type)}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRefs[type].current?.click()}
            className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Camera className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">التقط أو اختر صورة</p>
            </div>
            <input
              ref={fileInputRefs[type]}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleImageUpload(e, type)}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/car-handovers')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Car className="w-6 h-6 text-indigo-600" />
            تسجيل استلام سيارة
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 space-y-8">
          
          {/* Car Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">
              معلومات السيارة
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                اختر السيارة <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.carId}
                onChange={(e) => setFormData({ ...formData, carId: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                <option value="">-- اختر السيارة --</option>
                {cars.map(car => (
                  <option key={car.id} value={car.id}>
                    {car.name} - {car.plateNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">
              الصور المطلوبة
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ImageUploadBox type="odometer" label="صورة قراءة العداد" />
              <ImageUploadBox type="rightSide" label="صورة من الجانب الأيمن" />
              <ImageUploadBox type="leftSide" label="صورة من الجانب الأيسر" />
              <ImageUploadBox type="front" label="صورة من أمام السيارة" />
              <ImageUploadBox type="back" label="صورة من خلف السيارة" />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">
              تفاصيل الاستلام
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Gauge size={16} className="text-indigo-600" />
                  قراءة العداد (كم) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.odometerReading}
                  onChange={(e) => setFormData({ ...formData, odometerReading: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="أدخل قراءة العداد الحالية"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Fuel size={16} className="text-indigo-600" />
                  كمية الوقود: <span className="font-bold text-indigo-600 dark:text-indigo-400">{formData.fuelLevel}%</span>
                </label>
                <div className="pt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.fuelLevel}
                    onChange={(e) => setFormData({ ...formData, fuelLevel: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium px-1">
                    <span>E</span>
                    <span>1/4</span>
                    <span>1/2</span>
                    <span>3/4</span>
                    <span>F</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                سبب الاستلام <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                placeholder="اكتب سبب استلام السيارة هنا..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                موعد التسليم المتوقع (اختياري)
              </label>
              <input
                type="date"
                value={formData.expectedReturnDate}
                onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ملاحظات (اختياري)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                placeholder="أضف أي ملاحظات أخرى هنا..."
              />
            </div>
          </div>

        </div>

        <div className="p-6 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold disabled:opacity-50"
          >
            <Save size={20} />
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ السجل'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/car-handovers')}
            disabled={isSubmitting}
            className="px-6 py-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-bold border border-gray-200 dark:border-slate-700 disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
