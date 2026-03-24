import React, { useState, useRef, useEffect } from 'react';
import { useStore, initFirebaseSync } from '../store';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Upload, X, Save, ArrowRight, Car, Calendar, FileText, Gauge, Fuel } from 'lucide-react';

import { format } from 'date-fns';

export default function ReturnCarHandover() {
  const { id } = useParams<{ id: string }>();
  const { carHandovers, cars, currentUser, returnCarHandover } = useStore();
  
  useEffect(() => {
    initFirebaseSync(['cars', 'carHandovers']);
  }, []);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handover = carHandovers.find(h => h.id === id);
  const car = cars.find(c => c.id === handover?.carId);

  const [formData, setFormData] = useState({
    returnOdometerReading: '',
    returnFuelLevel: 50,
    returnReason: '',
    returnNotes: '',
  });

  const [images, setImages] = useState({
    returnOdometer: '',
    returnRightSide: '',
    returnLeftSide: '',
    returnFront: '',
    returnBack: '',
  });

  const fileInputRefs = {
    returnOdometer: useRef<HTMLInputElement>(null),
    returnRightSide: useRef<HTMLInputElement>(null),
    returnLeftSide: useRef<HTMLInputElement>(null),
    returnFront: useRef<HTMLInputElement>(null),
    returnBack: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    if (!handover || handover.status === 'closed') {
      alert('لا يمكن العثور على سجل الاستلام أو أنه مغلق بالفعل');
      navigate('/car-handovers');
    }
  }, [handover, navigate]);

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
    
    if (!formData.returnOdometerReading) {
      alert('الرجاء إدخال قراءة العداد عند التسليم');
      return;
    }
    if (!formData.returnReason) {
      alert('الرجاء كتابة ملاحظات التسليم');
      return;
    }
    if (!images.returnOdometer || !images.returnRightSide || !images.returnLeftSide || !images.returnFront || !images.returnBack) {
      alert('الرجاء إرفاق جميع الصور المطلوبة');
      return;
    }

    setIsSubmitting(true);

    try {
      returnCarHandover(id!, {
        returnDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
        returnOdometerReading: Number(formData.returnOdometerReading),
        returnFuelLevel: formData.returnFuelLevel,
        returnReason: formData.returnReason,
        returnOdometerImage: images.returnOdometer,
        returnRightSideImage: images.returnRightSide,
        returnLeftSideImage: images.returnLeftSide,
        returnFrontImage: images.returnFront,
        returnBackImage: images.returnBack,
        returnNotes: formData.returnNotes || undefined,
      });
      
      navigate('/car-handovers');
    } catch (error) {
      console.error('Error submitting return:', error);
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

  if (!handover || !car) return null;

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
            تسليم السيارة
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 space-y-8">
          
          {/* Car Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">
              معلومات السيارة
            </h3>
            <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
              <p className="font-bold text-gray-800 dark:text-white">{car?.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{car?.plateNumber}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">رقم المرجع للاستلام: {handover.referenceNumber}</p>
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">
              الصور المطلوبة عند التسليم
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ImageUploadBox type="returnOdometer" label="صورة قراءة العداد" />
              <ImageUploadBox type="returnRightSide" label="صورة من الجانب الأيمن" />
              <ImageUploadBox type="returnLeftSide" label="صورة من الجانب الأيسر" />
              <ImageUploadBox type="returnFront" label="صورة من أمام السيارة" />
              <ImageUploadBox type="returnBack" label="صورة من خلف السيارة" />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">
              تفاصيل التسليم
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Gauge size={16} className="text-indigo-600" />
                  قراءة العداد (كم) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={handover.odometerReading}
                  required
                  value={formData.returnOdometerReading}
                  onChange={(e) => setFormData({ ...formData, returnOdometerReading: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="أدخل قراءة العداد الحالية"
                />
                <p className="text-xs text-gray-500 mt-1">القراءة السابقة: {handover.odometerReading} كم</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Fuel size={16} className="text-indigo-600" />
                  كمية الوقود: <span className="font-bold text-indigo-600 dark:text-indigo-400">{formData.returnFuelLevel}%</span>
                </label>
                <div className="pt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.returnFuelLevel}
                    onChange={(e) => setFormData({ ...formData, returnFuelLevel: Number(e.target.value) })}
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
                ملاحظات التسليم <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.returnReason}
                onChange={(e) => setFormData({ ...formData, returnReason: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                placeholder="اكتب ملاحظات تسليم السيارة هنا..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ملاحظات إضافية (اختياري)
              </label>
              <textarea
                value={formData.returnNotes}
                onChange={(e) => setFormData({ ...formData, returnNotes: e.target.value })}
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
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ وتسليم السيارة'}
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
