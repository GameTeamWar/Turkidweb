'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ProductOption } from '@/app/api/admin/options/route';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Cog6ToothIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function OptionsPage() {
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    isActive: undefined as boolean | undefined,
    type: '' as string,
    isRequired: undefined as boolean | undefined,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchOptions();
  }, [search, filters]);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.isRequired !== undefined) queryParams.append('isRequired', filters.isRequired.toString());

      const response = await fetch(`/api/admin/options?${queryParams}`);
      const result = await response.json();
      
      if (result.success) {
        setOptions(result.data || []);
      } else {
        toast.error(result.error || 'Opsiyonlar yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Fetch options error:', error);
      toast.error('Opsiyonlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('Bu opsiyonu silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/admin/options/${optionId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Opsiyon silindi');
        fetchOptions();
      } else {
        toast.error(result.error || 'Opsiyon silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete option error:', error);
      toast.error('Opsiyon silinirken hata oluştu');
    }
  };

  const handleToggleActive = async (optionId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/options/${optionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(isActive ? 'Opsiyon deaktif edildi' : 'Opsiyon aktif edildi');
        fetchOptions();
      } else {
        toast.error(result.error || 'Opsiyon durumu güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Toggle option error:', error);
      toast.error('Opsiyon durumu güncellenirken hata oluştu');
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'radio': return 'Tek Seçim';
      case 'checkbox': return 'Çoklu Seçim';
      case 'select': return 'Açılır Liste';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'radio': return 'bg-blue-500/20 text-blue-300';
      case 'checkbox': return 'bg-green-500/20 text-green-300';
      case 'select': return 'bg-purple-500/20 text-purple-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const filteredOptions = useMemo(() =>
    options.filter(option =>
      (option.name?.toLowerCase() || '').includes(search.toLowerCase())
    ), [options, search]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Opsiyon Yönetimi</h1>
          <p className="text-white/70 mt-2">
            Toplam {options.length} opsiyon • {selectedOptions.length} seçili
          </p>
        </div>
        <Link
          href="/admin/options/add"
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Yeni Opsiyon
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
            <input
              type="text"
              placeholder="Opsiyon ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors duration-300"
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <select
              value={filters.isActive?.toString() || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value ? e.target.value === 'true' : undefined }))}
              className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
            >
              <option value="">Tüm Durumlar</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
            >
              <option value="">Tüm Türler</option>
              <option value="radio">Tek Seçim</option>
              <option value="checkbox">Çoklu Seçim</option>
              <option value="select">Açılır Liste</option>
            </select>

            <select
              value={filters.isRequired?.toString() || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, isRequired: e.target.value ? e.target.value === 'true' : undefined }))}
              className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
            >
              <option value="">Tüm Gereksinimler</option>
              <option value="true">Zorunlu</option>
              <option value="false">İsteğe Bağlı</option>
            </select>
          </div>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOptions.map((option) => (
          <div
            key={option.id}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden hover:bg-white/20 transition-all duration-300"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Cog6ToothIcon className="w-6 h-6 text-orange-400" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    option.isActive 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {option.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(option.type)}`}>
                  {getTypeText(option.type)}
                </span>
              </div>

              <h3 className="text-white font-semibold text-lg mb-2">{option.name}</h3>
              
              <div className="flex items-center gap-4 text-sm">
                <span className={`${option.isRequired ? 'text-red-400' : 'text-white/60'}`}>
                  {option.isRequired ? 'Zorunlu' : 'İsteğe Bağlı'}
                </span>
                <span className="text-white/60">
                  {option.minSelect}-{option.maxSelect} seçim
                </span>
              </div>
            </div>

            {/* Choices */}
            <div className="p-6">
              <h4 className="text-white/80 text-sm font-medium mb-3">
                Seçenekler ({option.choices.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {option.choices.slice(0, 3).map(choice => (
                  <div key={choice.id} className="flex justify-between text-sm">
                    <span className="text-white/80">{choice.name}</span>
                    {choice.price > 0 && (
                      <span className="text-green-400">+{choice.price}₺</span>
                    )}
                  </div>
                ))}
                {option.choices.length > 3 && (
                  <div className="text-white/60 text-xs">
                    +{option.choices.length - 3} daha...
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(option.id, option.isActive)}
                  className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-300 ${
                    option.isActive
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                  }`}
                  title={option.isActive ? 'Pasif Et' : 'Aktif Et'}
                >
                  {option.isActive ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                </button>

                <Link
                  href={`/admin/options/${option.id}/edit`}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-lg transition-colors duration-300"
                  title="Düzenle"
                >
                  <PencilIcon className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => handleDeleteOption(option.id)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors duration-300"
                  title="Sil"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOptions.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚙️</div>
          <h3 className="text-white text-xl font-semibold mb-2">Opsiyon bulunamadı</h3>
          <p className="text-white/60 mb-6">
            {search || Object.values(filters).some(Boolean)
              ? 'Arama kriterlerinize uygun opsiyon bulunamadı'
              : 'Henüz hiç opsiyon oluşturulmamış'
            }
          </p>
          <Link
            href="/admin/options/add"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            İlk Opsiyonu Oluştur
          </Link>
        </div>
      )}

      {/* Debug Section - Remove in production */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
        <h3 className="text-blue-300 font-medium mb-2">🔧 Debug Bilgileri</h3>
        <div className="text-blue-200 text-sm space-y-1">
          <div>Toplam opsiyon: {options.length}</div>
          <div>Aktif opsiyon: {options.filter(o => o.isActive).length}</div>
          <div>Filtrelenmiş opsiyon: {filteredOptions.length}</div>
          <div>Arama terimi: "{search}"</div>
          <div>Filtreler: {JSON.stringify(filters)}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Toplam Opsiyon</div>
          <div className="text-white text-2xl font-bold">{options.length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Aktif Opsiyon</div>
          <div className="text-white text-2xl font-bold">{options.filter(o => o.isActive).length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Zorunlu Opsiyon</div>
          <div className="text-white text-2xl font-bold">{options.filter(o => o.isRequired).length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Toplam Seçenek</div>
          <div className="text-white text-2xl font-bold">
            {options.reduce((sum, o) => sum + o.choices.length, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
