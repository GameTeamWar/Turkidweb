// app/admin/tags/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tag } from '@/app/api/admin/tags/route';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tags');
      const result = await response.json();
      
      if (result.success) {
        setTags(result.data || []);
      } else {
        toast.error(result.error || 'Etiketler yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Fetch tags error:', error);
      toast.error('Etiketler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Bu etiketi silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/admin/tags/${tagId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Etiket silindi');
        fetchTags();
      } else {
        toast.error(result.error || 'Etiket silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete tag error:', error);
      toast.error('Etiket silinirken hata oluştu');
    }
  };

  const handleToggleActive = async (tagId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/tags/${tagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(isActive ? 'Etiket deaktif edildi' : 'Etiket aktif edildi');
        fetchTags();
      } else {
        toast.error(result.error || 'Etiket durumu güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Toggle tag error:', error);
      toast.error('Etiket durumu güncellenirken hata oluştu');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedTags.length === 0) {
      toast.error('Lütfen en az bir etiket seçin');
      return;
    }

    if (!confirm(`Seçili ${selectedTags.length} etiket için ${action} işlemini yapmak istediğinizden emin misiniz?`)) return;

    try {
      const promises = selectedTags.map(tagId => 
        fetch(`/api/admin/tags/${tagId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            isActive: action === 'activate' ? true : false 
          }),
        })
    }

      await Promise.all(promises);
      toast.success(`${selectedTags.length} etiket başarıyla güncellendi`);
      setSelectedTags([]);
      fetchTags();
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Toplu işlem sırasında hata oluştu');
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(search.toLowerCase()) ||
    tag.description.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-3xl font-bold text-white">Etiket Yönetimi</h1>
          <p className="text-white/70 mt-2">
            Toplam {tags.length} etiket • {selectedTags.length} seçili
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTag(null);
            setShowModal(true);
          }}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Yeni Etiket
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
            <input
              type="text"
              placeholder="Etiket ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTags.length > 0 && (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-white font-medium">
              {selectedTags.length} etiket seçili
            </span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleBulkAction('activate')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
              >
                Aktif Et
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
              >
                Pasif Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTags.map((tag) => (
          <div
            key={tag.id}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden hover:bg-white/20 transition-all duration-300"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTags(prev => [...prev, tag.id]);
                    } else {
                      setSelectedTags(prev => prev.filter(id => id !== tag.id));
                    }
                  }}
                  className="w-4 h-4 text-orange-500 bg-white/80 border-white/30 rounded focus:ring-orange-500"
                />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  tag.isActive 
                    ? 'bg-green-500/80 text-white' 
                    : 'bg-gray-500/80 text-white'
                }`}>
                  {tag.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.icon || '🏷️'}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{tag.name}</h3>
                  <code className="text-orange-300 text-xs">#{tag.slug}</code>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {tag.description && (
                <p className="text-white/60 text-sm mb-3 line-clamp-2">{tag.description}</p>
              )}
              
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-white/60">Kullanım:</span>
                <span className="text-white font-medium">{tag.usageCount} ürün</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(tag.id, tag.isActive)}
                  className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-300 ${
                    tag.isActive
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                  }`}
                  title={tag.isActive ? 'Pasif Et' : 'Aktif Et'}
                >
                  {tag.isActive ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    setEditingTag(tag);
                    setShowModal(true);
                  }}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-lg transition-colors duration-300"
                  title="Düzenle"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteTag(tag.id)}
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

      {filteredTags.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-white text-xl font-semibold mb-2">Etiket bulunamadı</h3>
          <p className="text-white/60 mb-6">
            {search 
              ? 'Arama kriterlerinize uygun etiket bulunamadı'
              : 'Henüz hiç etiket oluşturulmamış'
            }
          </p>
          <button
            onClick={() => {
              setEditingTag(null);
              setShowModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            İlk Etiketi Oluştur
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Toplam Etiket</div>
          <div className="text-white text-2xl font-bold">{tags.length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Aktif Etiket</div>
          <div className="text-white text-2xl font-bold">{tags.filter(t => t.isActive).length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Kullanılan Etiket</div>
          <div className="text-white text-2xl font-bold">{tags.filter(t => t.usageCount > 0).length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Toplam Kullanım</div>
          <div className="text-white text-2xl font-bold">{tags.reduce((sum, t) => sum + t.usageCount, 0)}</div>
        </div>
      </div>

      {/* Tag Modal */}
      {showModal && (
        <TagModal
          tag={editingTag}
          onSave={() => {
            setShowModal(false);
            setEditingTag(null);
            fetchTags();
          }}
          onClose={() => {
            setShowModal(false);
            setEditingTag(null);
          }}
        />
      )}
    </div>
  );
}

// Tag Modal Component
interface TagModalProps {
  tag: Tag | null;
  onSave: () => void;
  onClose: () => void;
}

function TagModal({ tag, onSave, onClose }: TagModalProps) {
  const [formData, setFormData] = useState({
    name: tag?.name || '',
    slug: tag?.slug || '',
    color: tag?.color || '#ef4444',
    icon: tag?.icon || '🏷️',
    description: tag?.description || '',
    isActive: tag?.isActive ?? true,
    sortOrder: tag?.sortOrder || 999,
  });
  const [loading, setLoading] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: !tag ? generateSlug(name) : prev.slug
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Etiket adı gerekli');
      return;
    }

    try {
      setLoading(true);
      
      const url = tag ? `/api/admin/tags/${tag.id}` : '/api/admin/tags';
      const method = tag ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(tag ? 'Etiket güncellendi' : 'Etiket oluşturuldu');
        onSave();
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Tag save error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const commonColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#64748b', '#6b7280', '#374151'
  ];

  const commonIcons = [
    '🏷️', '⭐', '🔥', '✨', '💎', '🎯', '🚀', '💯',
    '🌟', '🎊', '🎉', '🎁', '❤️', '👍', '🔴', '🟢',
    '🔵', '🟡', '🟣', '🟠', '⚡', '💡', '🌈', '🎨'
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">
          {tag ? 'Etiket Düzenle' : 'Yeni Etiket Ekle'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div 
              className="w-16 h-16 rounded-lg mx-auto mb-2 flex items-center justify-center text-white text-2xl"
              style={{ backgroundColor: formData.color }}
            >
              {formData.icon}
            </div>
            <div className="text-white font-medium">{formData.name || 'Etiket Adı'}</div>
            <code className="text-orange-300 text-xs">#{formData.slug || 'slug'}</code>
          </div>

          {/* Name */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Etiket Adı *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
              placeholder="Etiket adını girin..."
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
              placeholder="etiket-slug"
              pattern="^[a-z0-9-]+$"
              required
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Renk *
            </label>
            <div className="grid grid-cols-10 gap-2 mb-2">
              {commonColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-lg border-2 ${
                    formData.color === color ? 'border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="w-full h-10 bg-white/20 border border-white/30 rounded-lg"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              İkon
            </label>
            <div className="grid grid-cols-8 gap-2 mb-2">
              {commonIcons.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  className={`p-2 rounded-lg text-lg transition-colors ${
                    formData.icon === icon
                      ? 'bg-orange-500/30 border-2 border-orange-500'
                      : 'bg-white/10 hover:bg-white/20 border-2 border-transparent'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
              placeholder="Emoji girin..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 resize-none"
              placeholder="Etiket açıklaması (isteğe bağlı)..."
            />
          </div>

          {/* Settings */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
              />
              <span className="ml-2 text-white text-sm">Etiket aktif</span>
            </label>

            <div className="flex items-center gap-2">
              <label className="text-white text-sm">Sıra:</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 999 }))}
                className="w-16 px-2 py-1 bg-white/20 border border-white/30 rounded text-white text-sm focus:outline-none focus:border-white/50"
                min="0"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/20">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-300 disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : (tag ? 'Güncelle' : 'Kaydet')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-300"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );