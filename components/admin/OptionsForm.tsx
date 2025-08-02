'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ProductOption, ProductOptionChoice } from '@/app/api/admin/options/route';
import { 
  PlusIcon, 
  TrashIcon, 
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface OptionsFormData {
  name: string;
  type: 'radio' | 'checkbox' | 'select';
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  isActive: boolean;
  choices: ProductOptionChoice[];
}

interface OptionsFormProps {
  optionId?: string;
  initialData?: ProductOption;
}

export function OptionsForm({ optionId, initialData }: OptionsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [choices, setChoices] = useState<ProductOptionChoice[]>(initialData?.choices || []);
  const [newChoice, setNewChoice] = useState({ name: '', price: 0 });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<OptionsFormData>({
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'radio',
      isRequired: initialData?.isRequired || false,
      minSelect: initialData?.minSelect || 0,
      maxSelect: initialData?.maxSelect || 1,
      sortOrder: initialData?.sortOrder || 1,
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      choices: initialData?.choices || []
    }
  });

  const watchType = watch('type');
  const watchIsRequired = watch('isRequired');
  const watchMinSelect = watch('minSelect');
  const watchMaxSelect = watch('maxSelect');

  // Auto-adjust min/max select based on type and requirement
  useEffect(() => {
    if (watchType === 'radio') {
      setValue('minSelect', watchIsRequired ? 1 : 0);
      setValue('maxSelect', 1);
    } else if (watchType === 'select') {
      setValue('minSelect', watchIsRequired ? 1 : 0);
      setValue('maxSelect', 1);
    }
  }, [watchType, watchIsRequired, setValue]);

  const handleAddChoice = () => {
    if (!newChoice.name.trim()) {
      toast.error('Seçenek adı gerekli');
      return;
    }

    const choice: ProductOptionChoice = {
      id: `choice_${Date.now()}`,
      name: newChoice.name.trim(),
      price: newChoice.price,
      isActive: true,
      sortOrder: choices.length + 1
    };

    setChoices([...choices, choice]);
    setNewChoice({ name: '', price: 0 });
  };

  const handleDeleteChoice = (choiceId: string) => {
    setChoices(choices.filter(c => c.id !== choiceId));
  };

  const handleMoveChoice = (choiceId: string, direction: 'up' | 'down') => {
    const index = choices.findIndex(c => c.id === choiceId);
    if (index === -1) return;

    const newChoices = [...choices];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newChoices.length) return;

    [newChoices[index], newChoices[targetIndex]] = [newChoices[targetIndex], newChoices[index]];
    
    // Update sort orders
    newChoices.forEach((choice, idx) => {
      choice.sortOrder = idx + 1;
    });

    setChoices(newChoices);
  };

  const onSubmit = async (data: OptionsFormData) => {
    try {
      setLoading(true);

      if (choices.length === 0) {
        toast.error('En az bir seçenek eklemelisiniz');
        return;
      }

      if (data.minSelect > choices.length) {
        toast.error('Minimum seçim sayısı, toplam seçenek sayısından fazla olamaz');
        return;
      }

      if (data.maxSelect > choices.length) {
        toast.error('Maksimum seçim sayısı, toplam seçenek sayısından fazla olamaz');
        return;
      }

      if (data.minSelect > data.maxSelect) {
        toast.error('Minimum seçim, maksimum seçimden fazla olamaz');
        return;
      }

      const formData = {
        ...data,
        choices: choices
      };

      const url = optionId 
        ? `/api/admin/options/${optionId}`
        : '/api/admin/options';
      
      const method = optionId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(optionId ? 'Opsiyon güncellendi!' : 'Opsiyon eklendi!');
        router.push('/admin/options');
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {optionId ? 'Opsiyon Düzenle' : 'Yeni Opsiyon Ekle'}
          </h2>
          <p className="text-white/70">
            Ürün seçeneklerini oluşturun ve düzenleyin
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Preview */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">Önizleme</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{watch('name') || 'Opsiyon Adı'}</span>
                {watchIsRequired && <span className="text-red-400">*</span>}
              </div>
              <div className="space-y-2">
                {choices.map(choice => (
                  <label key={choice.id} className="flex items-center gap-2 text-white/80">
                    <input
                      type={watchType === 'checkbox' ? 'checkbox' : 'radio'}
                      name="preview"
                      disabled
                      className="w-4 h-4 text-orange-500"
                    />
                    <span>
                      {choice.name} 
                      {choice.price > 0 && <span className="text-green-400 ml-1">(+{choice.price}₺)</span>}
                    </span>
                  </label>
                ))}
              </div>
              <div className="text-white/60 text-sm">
                {watchType === 'checkbox' 
                  ? `${watchMinSelect}-${watchMaxSelect} arası seçim`
                  : watchIsRequired ? 'Zorunlu seçim' : 'İsteğe bağlı seçim'
                }
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Opsiyon Adı *
              </label>
              <input
                type="text"
                {...register('name', { 
                  required: 'Opsiyon adı gerekli',
                  minLength: { value: 2, message: 'En az 2 karakter olmalı' }
                })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="Örn: Baharat Seçimi"
              />
              {errors.name && (
                <p className="text-red-300 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Seçim Türü *
              </label>
              <select
                {...register('type')}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
              >
                <option value="radio">Tek Seçim (Radio)</option>
                <option value="checkbox">Çoklu Seçim (Checkbox)</option>
                <option value="select">Açılır Liste (Select)</option>
              </select>
            </div>
          </div>

          {/* Requirements */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('isRequired')}
                className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
              />
              <label className="ml-2 text-white text-sm">
                Zorunlu seçim
              </label>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Minimum Seçim
              </label>
              <input
                type="number"
                min="0"
                {...register('minSelect', {
                  min: { value: 0, message: 'Minimum 0 olabilir' },
                  max: { value: 10, message: 'Maksimum 10 olabilir' }
                })}
                disabled={watchType === 'radio' || watchType === 'select'}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 disabled:opacity-50"
                placeholder="0"
              />
              {errors.minSelect && (
                <p className="text-red-300 text-sm mt-1">{errors.minSelect.message}</p>
              )}
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Maksimum Seçim
              </label>
              <input
                type="number"
                min="1"
                {...register('maxSelect', {
                  min: { value: 1, message: 'Minimum 1 olmalı' },
                  max: { value: 10, message: 'Maksimum 10 olabilir' }
                })}
                disabled={watchType === 'radio' || watchType === 'select'}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 disabled:opacity-50"
                placeholder="1"
              />
              {errors.maxSelect && (
                <p className="text-red-300 text-sm mt-1">{errors.maxSelect.message}</p>
              )}
            </div>
          </div>

          {/* Choices */}
          <div>
            <label className="block text-white text-sm font-medium mb-4">
              Seçenekler *
            </label>

            {/* Existing Choices */}
            <div className="space-y-3 mb-4">
              {choices.map((choice, index) => (
                <div key={choice.id} className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                  <div className="flex-1">
                    <span className="text-white font-medium">{choice.name}</span>
                    {choice.price > 0 && (
                      <span className="text-green-400 ml-2">(+{choice.price}₺)</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMoveChoice(choice.id, 'up')}
                      disabled={index === 0}
                      className="text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUpIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveChoice(choice.id, 'down')}
                      disabled={index === choices.length - 1}
                      className="text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDownIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChoice(choice.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Choice */}
            <div className="flex gap-3">
              <input
                type="text"
                value={newChoice.name}
                onChange={(e) => setNewChoice(prev => ({ ...prev, name: e.target.value }))}
                className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="Seçenek adı"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={newChoice.price}
                onChange={(e) => setNewChoice(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="w-32 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="Fiyat"
              />
              <button
                type="button"
                onClick={handleAddChoice}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg transition-colors duration-300"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Sıralama
              </label>
              <input
                type="number"
                min="1"
                {...register('sortOrder', {
                  min: { value: 1, message: 'Minimum 1 olmalı' }
                })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder="1"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                />
                <span className="ml-2 text-white text-sm">
                  Opsiyon aktif
                </span>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-4 pt-6 border-t border-white/20">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {optionId ? 'Güncelleniyor...' : 'Ekleniyor...'}
                </div>
              ) : (
                optionId ? 'Opsiyonu Güncelle' : 'Opsiyonu Ekle'
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/options')}
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300"
            >
              İptal
            </button>

            {!optionId && (
              <button
                type="button"
                onClick={() => {
                  reset();
                  setChoices([]);
                  setNewChoice({ name: '', price: 0 });
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300"
              >
                Temizle
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
