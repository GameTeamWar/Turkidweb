'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UserIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  provider: 'credentials' | 'google';
  isActive: boolean;
  isBanned: boolean;
  bannedAt?: string;
  bannedBy?: string;
  banReason?: string;
  ipAddress?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    role: '',
    provider: '',
    isActive: '',
    isBanned: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchUsers();
  }, [session, status, router]);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.provider) queryParams.append('provider', filters.provider);
      if (filters.isActive) queryParams.append('isActive', filters.isActive);
      if (filters.isBanned) queryParams.append('isBanned', filters.isBanned);

      const response = await fetch(`/api/admin/users?${queryParams}`);
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data || []);
      } else {
        toast.error(result.error || 'Kullanıcılar yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Kullanıcı silindi');
        fetchUsers();
      } else {
        toast.error(result.error || 'Kullanıcı silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('Kullanıcı silinirken hata oluştu');
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(isActive ? 'Kullanıcı deaktif edildi' : 'Kullanıcı aktif edildi');
        fetchUsers();
      } else {
        toast.error(result.error || 'Kullanıcı durumu güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Toggle user error:', error);
      toast.error('Kullanıcı durumu güncellenirken hata oluştu');
    }
  };

  const handleBanUser = async (userId: string, isBanned: boolean, banReason?: string) => {
    if (!isBanned) {
      const reason = prompt('Ban sebebini girin:');
      if (!reason) return;
      banReason = reason;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isBanned: !isBanned,
          banReason: banReason,
          bannedBy: session?.user?.name || 'Admin'
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(isBanned ? 'Kullanıcı ban kaldırıldı' : 'Kullanıcı banlandı');
        fetchUsers();
      } else {
        toast.error(result.error || 'Ban işlemi sırasında hata oluştu');
      }
    } catch (error) {
      console.error('Ban user error:', error);
      toast.error('Ban işlemi sırasında hata oluştu');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    if (!confirm(`Bu kullanıcının rolünü ${newRole === 'admin' ? 'admin' : 'kullanıcı'} yapmak istediğinizden emin misiniz?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Kullanıcı rolü güncellendi');
        fetchUsers();
      } else {
        toast.error(result.error || 'Rol güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Role change error:', error);
      toast.error('Rol güncellenirken hata oluştu');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error('Lütfen en az bir kullanıcı seçin');
      return;
    }

    if (!confirm(`Seçili ${selectedUsers.length} kullanıcı için ${action} işlemini yapmak istediğinizden emin misiniz?`)) return;

    try {
      const promises = selectedUsers.map(userId => {
        switch (action) {
          case 'activate':
            return fetch(`/api/admin/users/${userId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isActive: true }),
            });
          case 'deactivate':
            return fetch(`/api/admin/users/${userId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isActive: false }),
            });
          case 'ban':
            return fetch(`/api/admin/users/${userId}/ban`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                isBanned: true,
                banReason: 'Toplu ban işlemi',
                bannedBy: session?.user?.name || 'Admin'
              }),
            });
          case 'unban':
            return fetch(`/api/admin/users/${userId}/ban`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isBanned: false }),
            });
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      toast.success(`${selectedUsers.length} kullanıcı başarıyla güncellendi`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Toplu işlem sırasında hata oluştu');
    }
  };

  const filteredUsers = useMemo(() =>
    users.filter(user =>
      (user.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (user.uid?.toLowerCase() || '').includes(search.toLowerCase())
    ), [users, search]
  );

  if (status === 'loading' || loading) {
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
          <h1 className="text-3xl font-bold text-white">Kullanıcı Yönetimi</h1>
          <p className="text-white/70 mt-2">
            Toplam {users.length} kullanıcı • {selectedUsers.length} seçili
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowUserModal(true);
          }}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Yeni Kullanıcı
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
            <input
              type="text"
              placeholder="Kullanıcı ara..."
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-white/20">
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
            >
              <option value="">Tüm Roller</option>
              <option value="admin">Admin</option>
              <option value="user">Kullanıcı</option>
            </select>

            <select
              value={filters.provider}
              onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value }))}
              className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
            >
              <option value="">Tüm Sağlayıcılar</option>
              <option value="credentials">Email/Şifre</option>
              <option value="google">Google</option>
            </select>

            <select
              value={filters.isActive}
              onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
              className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
            >
              <option value="">Tüm Durumlar</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>

            <select
              value={filters.isBanned}
              onChange={(e) => setFilters(prev => ({ ...prev, isBanned: e.target.value }))}
              className="bg-white/20 border border-white/30 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-white/50"
            >
              <option value="">Tüm Ban Durumları</option>
              <option value="false">Banlı Değil</option>
              <option value="true">Banlı</option>
            </select>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-white font-medium">
              {selectedUsers.length} kullanıcı seçili
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
              <button
                onClick={() => handleBulkAction('ban')}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
              >
                Banla
              </button>
              <button
                onClick={() => handleBulkAction('unban')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
              >
                Ban Kaldır
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/20">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={() => {
                      if (selectedUsers.length === filteredUsers.length) {
                        setSelectedUsers([]);
                      } else {
                        setSelectedUsers(filteredUsers.map(u => u.id));
                      }
                    }}
                    className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-white font-semibold">Kullanıcı</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Rol</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Sağlayıcı</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Durum</th>
                <th className="px-6 py-4 text-left text-white font-semibold">IP Adresi</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Son Giriş</th>
                <th className="px-6 py-4 text-center text-white font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors duration-300">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(prev => [...prev, user.id]);
                        } else {
                          setSelectedUsers(prev => prev.filter(id => id !== user.id));
                        }
                      }}
                      className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{user.name || 'Adsız Kullanıcı'}</div>
                        <div className="text-white/60 text-sm">{user.email || 'Email bulunamadı'}</div>
                        <div className="text-white/40 text-xs">ID: {user.uid || 'ID bulunamadı'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                      disabled={user.id === session?.user?.id}
                      className={`bg-white/20 border border-white/30 rounded-lg px-3 py-1 text-sm ${
                        user.role === 'admin' 
                          ? 'text-red-300' 
                          : 'text-blue-300'
                      } ${user.id === session?.user?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="user">Kullanıcı</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.provider === 'google' 
                        ? 'bg-blue-500/20 text-blue-300' 
                        : 'bg-gray-500/20 text-gray-300'
                    }`}>
                      {user.provider === 'google' ? 'Google' : 'Email/Şifre'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {user.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                      {user.isBanned && (
                        <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs font-medium">
                          Banlı
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-white/60 text-sm">
                      {user.ipAddress || 'Bilinmiyor'}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white/60 text-sm">
                      {user.lastLoginAt 
                        ? new Date(user.lastLoginAt).toLocaleDateString('tr-TR')
                        : 'Hiç giriş yapmamış'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-lg transition-colors duration-300"
                        title="Görüntüle"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Link>
                      
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowUserModal(true);
                        }}
                        className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 p-2 rounded-lg transition-colors duration-300"
                        title="Düzenle"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        disabled={user.id === session?.user?.id}
                        className={`p-2 rounded-lg transition-colors duration-300 ${
                          user.isActive
                            ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                            : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-400'
                        } ${user.id === session?.user?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={user.isActive ? 'Pasif Et' : 'Aktif Et'}
                      >
                        {user.isActive ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleBanUser(user.id, user.isBanned)}
                        disabled={user.id === session?.user?.id}
                        className={`p-2 rounded-lg transition-colors duration-300 ${
                          user.isBanned
                            ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
                            : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                        } ${user.id === session?.user?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={user.isBanned ? 'Ban Kaldır' : 'Banla'}
                      >
                        <NoSymbolIcon className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === session?.user?.id}
                        className={`bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors duration-300 ${
                          user.id === session?.user?.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Sil"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-white text-xl font-semibold mb-2">Kullanıcı bulunamadı</h3>
            <p className="text-white/60 mb-6">
              {search || Object.values(filters).some(f => f)
                ? 'Arama kriterlerinize uygun kullanıcı bulunamadı'
                : 'Henüz hiç kullanıcı yok'
              }
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Toplam Kullanıcı</div>
          <div className="text-white text-2xl font-bold">{users.length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Admin Kullanıcı</div>
          <div className="text-white text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Aktif Kullanıcı</div>
          <div className="text-white text-2xl font-bold">{users.filter(u => u.isActive).length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white/80 text-sm">Banlı Kullanıcı</div>
          <div className="text-white text-2xl font-bold">{users.filter(u => u.isBanned).length}</div>
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          onSave={() => {
            setShowUserModal(false);
            setEditingUser(null);
            fetchUsers();
          }}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

// User Modal Component
interface UserModalProps {
  user: User | null;
  onSave: () => void;
  onClose: () => void;
}

function UserModal({ user, onSave, onClose }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'user',
    isActive: user?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Ad ve email gerekli');
      return;
    }

    try {
      setLoading(true);
      
      const url = user ? `/api/admin/users/${user.id}` : '/api/admin/users';
      const method = user ? 'PATCH' : 'POST';

      const body = { ...formData };
      if (user && !formData.password) {
        delete body.password; // Don't update password if empty
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success(user ? 'Kullanıcı güncellendi' : 'Kullanıcı oluşturuldu');
        onSave();
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('User save error:', error);
      toast.error('Kullanıcı kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-4">
          {user ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Ad *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
              placeholder="Kullanıcı adını girin..."
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
              placeholder="Email adresini girin..."
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Şifre {user ? '(Değiştirmek için girin)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
              placeholder="Şifreyi girin..."
              required={!user}
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
            >
              <option value="user">Kullanıcı</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-orange-500 bg-white/20 border-white/30 rounded focus:ring-orange-500"
            />
            <span className="ml-2 text-white text-sm">Kullanıcı aktif</span>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/20">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-300 disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : (user ? 'Güncelle' : 'Kaydet')}
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
}
