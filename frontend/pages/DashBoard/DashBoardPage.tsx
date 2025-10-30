import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import Logout from "@/components/auth/Logout";
import { useAuthStore } from "@/stores/useAuthStore";
import useBoardStore from '@/stores/useBoardStore';
import type { Board } from '@/types/board';
import { useEffect, useState } from "react";
import type { Workspace } from '@/types/workspace';
import api from '@/lib/axios';
import { Search, Plus, Sparkles, Edit2, Trash2, Star, Clock, Users, Layout } from "lucide-react";
import { useRef } from 'react';

// small helper to format relative time in Vietnamese
function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '';
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000); // seconds
  if (diff < 10) return 'vừa xong';
  if (diff < 60) return `${diff} giây trước`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  const years = Math.floor(months / 12);
  return `${years} năm trước`;
}

const DashBoardPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [showSidebarPreview, setShowSidebarPreview] = useState(false);
  const [showHeaderPreview, setShowHeaderPreview] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const creatingWorkspaceRef = useRef(false);
  const [showEditWorkspace, setShowEditWorkspace] = useState(false);
  const [editWorkspaceId, setEditWorkspaceId] = useState<string | null>(null);
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const editingWorkspaceRef = useRef(false);
  const [searchText, setSearchText] = useState('');

  const onCreateWorkspace = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (creatingWorkspaceRef.current) return;
    if (!newWorkspaceName.trim() || newWorkspaceName.trim().length < 2) {
      alert('Tên không gian phải có ít nhất 2 ký tự');
      return;
    }
    try {
      creatingWorkspaceRef.current = true;
      const res = await api.post('/workspaces', { name: newWorkspaceName.trim() });
      const ws = res.data.workspace as Workspace | undefined;
      if (ws && ws._id) {
        setWorkspaces((s) => [...s, ws]);
        setSelectedWorkspaceId(ws._id);
      }
      setNewWorkspaceName('');
      setShowCreateWorkspace(false);
    } catch (err) {
      console.error('create workspace error', err);
      alert('Tạo không gian thất bại');
    } finally {
      creatingWorkspaceRef.current = false;
    }
  };

  const boards = useBoardStore((s) => s.boards);
  const loading = useBoardStore((s) => s.loading);
  const fetchBoards = useBoardStore((s) => s.fetchBoards);
  const addBoard = useBoardStore((s) => s.addBoard);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await api.get('/workspaces');
        const list = (res.data.workspaces || []) as Workspace[];
        if (list.length) {
          setWorkspaces(list);
          const diqit = list.find((w) => w.name?.toLowerCase() === 'diqit') || list[0];
          setSelectedWorkspaceId(diqit._id);
        } else {
          setWorkspaces([]);
          setSelectedWorkspaceId(null);
        }
      } catch (err) {
        console.debug('load workspaces failed', err);
      }
    })();
  }, [user, fetchBoards]);

  useEffect(() => {
    if (!user) return;
    fetchBoards(selectedWorkspaceId ?? undefined);
  }, [fetchBoards, selectedWorkspaceId, user]);

  useEffect(() => {
    if (!boards || !boards.length) return;
    const boardsWithWorkspace = boards
      .map((b) => (b as unknown as { workspace?: Workspace | string }).workspace)
      .filter(Boolean)
      .map((w) => (typeof w === 'string' ? { _id: w, name: 'Không tên' } as Workspace : (w as Workspace)));

    if (!boardsWithWorkspace.length) return;

    setWorkspaces((current) => {
      const existingIds = new Set(current.map((w) => String(w._id)));
      const toAdd: Workspace[] = [];
      for (const w of boardsWithWorkspace) {
        if (w && w._id && !existingIds.has(String(w._id))) {
          toAdd.push({ _id: String(w._id), name: w.name || 'Không tên' });
          existingIds.add(String(w._id));
        }
      }
      if (toAdd.length) {
        if (!selectedWorkspaceId && toAdd.length) {
          setSelectedWorkspaceId(toAdd[0]._id);
        }
        return [...current, ...toAdd];
      }

      if (!selectedWorkspaceId && boardsWithWorkspace.length) {
        const first = boardsWithWorkspace[0];
        if (first && first._id) setSelectedWorkspaceId(String(first._id));
      }

      return current;
    });
  }, [boards, selectedWorkspaceId]);

  const filteredBoards = boards.filter((b) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return (
      (b.title || '').toLowerCase().includes(q) ||
      (b.description || '').toLowerCase().includes(q)
    );
  });

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const submittingRef = useRef(false);

  const onCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submittingRef.current) return;
    if (title.trim().length < 2) {
      alert('Tiêu đề phải có ít nhất 2 ký tự');
      return;
    }
    try {
      submittingRef.current = true;
      const created = await addBoard({ title: title.trim(), description: description.trim(), workspace: selectedWorkspaceId ?? undefined });
      setShowCreate(false);
      setTitle('');
      setDescription('');
      if (created && created._id) {
        navigate(`/board/${created._id}`);
      }
    } catch (err) {
      console.error('create board error', err);
    } finally {
      submittingRef.current = false;
    }
  };

  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const editingRef = useRef(false);

  const openEdit = (b: Board) => {
    setEditId(b._id);
    setEditTitle(b.title || '');
    setEditDescription(b.description || '');
    setShowEdit(true);
  };

  const onEditSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editId) return;
    if (editingRef.current) return;
    if (editTitle.trim().length < 2) {
      alert('Tiêu đề phải có ít nhất 2 ký tự');
      return;
    }
    try {
      editingRef.current = true;
      await useBoardStore.getState().updateBoard(editId, { title: editTitle.trim(), description: editDescription.trim() });
      setShowEdit(false);
      setEditId(null);
    } catch (err) {
      console.error('edit board error', err);
    } finally {
      editingRef.current = false;
    }
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm('Bạn có chắc muốn xóa bảng này không?');
    if (!ok) return;
    try {
      await useBoardStore.getState().removeBoard(id);
    } catch (err) {
      console.error('delete board error', err);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-purple">
      {/* Sidebar với Gradient Sky-Pastel */}
      <aside className="w-72 glass-strong border-r border-[hsl(var(--border))] flex flex-col shadow-glow relative overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(200,100%,75%)] via-[hsl(195,100%,85%)] to-[hsl(190,100%,88%)] opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col h-full p-5">
          {/* Logo Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-chat flex items-center justify-center shadow-glow">
                <Sparkles className="w-6 h-6 text-[hsl(var(--primary-foreground))]" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(200,100%,60%)] to-[hsl(190,100%,70%)] bg-clip-text text-transparent">
                Kanban X
              </h1>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-[hsl(200,100%,75%)]/20 to-[hsl(195,100%,85%)]/10 p-3 rounded-xl border border-[hsl(var(--primary))]/20">
                <Layout className="w-4 h-4 text-[hsl(var(--primary))] mb-1" />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Bảng</p>
                <p className="text-lg font-bold text-[hsl(var(--foreground))]">{boards.length}</p>
              </div>
              <div className="bg-gradient-to-br from-[hsl(200,100%,75%)]/20 to-[hsl(195,100%,85%)]/10 p-3 rounded-xl border border-[hsl(var(--primary))]/20">
                <Users className="w-4 h-4 text-[hsl(var(--primary))] mb-1" />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Không gian</p>
                <p className="text-lg font-bold text-[hsl(var(--foreground))]">{workspaces.length}</p>
              </div>
            </div>
          </div>

          {/* Workspace Section */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[hsl(var(--muted-foreground))] text-xs font-semibold uppercase tracking-wider">
                Không gian làm việc
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateWorkspace(true)}
                className="h-7 px-2 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {workspaces.length > 0 ? (
                workspaces.map((ws) => (
                  <div 
                    key={ws._id} 
                    className={`group relative rounded-xl transition-all duration-300 ${
                      ws._id === selectedWorkspaceId 
                        ? 'bg-gradient-chat shadow-glow' 
                        : 'hover:bg-[hsl(var(--muted))]'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedWorkspaceId(ws._id)}
                      className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                        ws._id === selectedWorkspaceId 
                          ? 'text-[hsl(var(--primary-foreground))]' 
                          : 'text-[hsl(var(--foreground))]'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        ws._id === selectedWorkspaceId 
                          ? 'bg-white status-online' 
                          : 'bg-[hsl(var(--primary))]'
                      }`}></div>
                      <span className="font-medium flex-1 truncate">{ws.name}</span>
                      
                    </button>

                    {/* Hover Actions */}
                    <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                      ws._id === selectedWorkspaceId ? 'opacity-100' : ''
                    }`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-white/20 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditWorkspaceId(ws._id);
                          setEditWorkspaceName(ws.name || '');
                          setShowEditWorkspace(true);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-red-500/20 rounded-lg text-[hsl(var(--destructive))]"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = window.confirm(`Xóa không gian "${ws.name}"?`);
                          if (!ok) return;
                          try {
                            await api.delete(`/workspaces/${ws._id}`);
                            setWorkspaces((cur) => cur.filter((w) => w._id !== ws._id));
                            if (selectedWorkspaceId === ws._id) {
                              const left = workspaces.filter((x) => x._id !== ws._id);
                              setSelectedWorkspaceId(left[0]?._id ?? null);
                            }
                          } catch (err) {
                            console.error('delete workspace error', err);
                            alert('Xóa không thành công');
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center bg-[hsl(var(--muted))] rounded-xl border-2 border-dashed border-[hsl(var(--border))]">
                  <Layout className="w-8 h-8 text-[hsl(var(--muted-foreground))] mx-auto mb-2" />
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
                    Chưa có không gian làm việc
                  </p>
                  <Button 
                    onClick={() => setShowCreateWorkspace(true)} 
                    className="w-full bg-gradient-chat text-[hsl(var(--primary-foreground))] shadow-soft"
                  >
                    Tạo không gian mới
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Section */}
          <div className="mt-auto pt-4 border-t border-[hsl(var(--border))]">
            <div
              className="relative flex items-center gap-3 p-3 rounded-xl cursor-pointer bg-gradient-to-r from-[hsl(200,100%,75%)]/20 to-[hsl(195,100%,85%)]/10 hover:from-[hsl(200,100%,75%)]/30 hover:to-[hsl(195,100%,85%)]/20 transition-all duration-300 border border-[hsl(var(--primary))]/20"
              onClick={() => navigate("/profile")}
              onMouseEnter={() => setShowSidebarPreview(true)}
              onMouseLeave={() => setShowSidebarPreview(false)}
            >
              <Avatar className="ring-2 ring-[hsl(var(--primary))]/30">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} />
                ) : (
                  <AvatarFallback className="bg-gradient-chat text-[hsl(var(--primary-foreground))]">
                    {user?.username?.[0] || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                  {user?.username || "Người dùng"}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--online))] status-online"></span>
                  Gói miễn phí
                </p>
              </div>

              {showSidebarPreview && (
                <div className="absolute left-full top-0 ml-3 z-50">
                  <div className="glass-strong text-sm p-4 rounded-xl shadow-glow border border-[hsl(var(--border))]">
                    <div className="font-semibold text-[hsl(var(--foreground))]">{user?.displayName || user?.username}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{user?.email}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header với Gradient */}
        <header className="sticky top-0 z-40 glass-strong border-b border-[hsl(var(--border))] px-8 py-5 shadow-soft backdrop-blur-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">
                  {workspaces.find(w => w._id === selectedWorkspaceId)?.name || 'Không gian làm việc'}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Cập nhật gần đây
                  </span>
                  <span className="px-3 py-1 text-xs font-semibold bg-gradient-chat text-[hsl(var(--primary-foreground))] rounded-full shadow-soft">
                    Gói miễn phí
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tìm kiếm bảng..."
                  className="w-80 pl-11 h-11 glass border-[hsl(var(--border))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 transition-all duration-200 rounded-xl"
                />
              </div>
              
              <Button 
                onClick={() => setShowCreate(true)} 
                className="bg-gradient-chat text-[hsl(var(--primary-foreground))] shadow-glow hover:shadow-[0_0_60px_hsl(200_100%_70%/0.4)] transition-all duration-300 h-11 px-6 rounded-xl font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Tạo bảng mới
              </Button>
              
              <div
                className="cursor-pointer relative"
                onClick={() => navigate("/profile")}
                onMouseEnter={() => setShowHeaderPreview(true)}
                onMouseLeave={() => setShowHeaderPreview(false)}
              >
                <Avatar className="w-11 h-11 ring-2 ring-[hsl(var(--primary))]/30 hover:ring-[hsl(var(--primary))]/60 transition-all duration-200">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} />
                  ) : (
                    <AvatarFallback className="bg-gradient-chat text-[hsl(var(--primary-foreground))]">
                      {(user?.displayName?.[0] || user?.username?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>

                {showHeaderPreview && (
                  <div className="absolute right-0 mt-3 z-50">
                    <div className="glass-strong text-sm p-4 rounded-xl shadow-glow border border-[hsl(var(--border))]">
                      <div className="font-semibold text-[hsl(var(--foreground))]">{user?.displayName || user?.username}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{user?.email}</div>
                    </div>
                  </div>
                )}
              </div>
              
              <Logout />
            </div>
          </div>
        </header>

        {/* Board Grid */}
        <section className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-[hsl(var(--foreground))] flex items-center gap-3">
              <Layout className="w-6 h-6 text-[hsl(var(--primary))]" />
              Bảng của bạn
              <span className="text-base text-[hsl(var(--muted-foreground))] font-normal bg-[hsl(var(--muted))] px-3 py-1 rounded-full">
                {filteredBoards.length}
              </span>
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[hsl(var(--muted-foreground))]">Đang tải...</p>
                </div>
              </div>
            ) : filteredBoards.length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-20">
                <div className="text-center">
                  <Layout className="w-20 h-20 text-[hsl(var(--muted-foreground))] mx-auto mb-4 opacity-50" />
                  <p className="text-[hsl(var(--foreground))] font-medium mb-2">Chưa có bảng nào</p>
                  <p className="text-[hsl(var(--muted-foreground))] text-sm mb-4">Tạo bảng đầu tiên để bắt đầu</p>
                  <Button onClick={() => setShowCreate(true)} className="bg-gradient-chat text-[hsl(var(--primary-foreground))] shadow-glow">
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo bảng mới
                  </Button>
                </div>
              </div>
            ) : (
              filteredBoards.map((b: Board, index: number) => (
                <div
                  key={b._id}
                  onClick={() => navigate(`/board/${b._id}`)}
                  className="group relative glass-strong rounded-2xl overflow-hidden shadow-soft hover:shadow-glow transition-all duration-300 cursor-pointer border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] message-bounce hover:-translate-y-1"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Gradient Overlay on Image */}
                  <div className="h-40 bg-cover bg-center relative overflow-hidden" style={{ backgroundImage: `url(${b.image || '/img/default-board.jpg'})` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-[hsl(200,100%,75%)]/20 to-[hsl(195,100%,85%)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Actions */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white rounded-lg shadow-soft"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(b);
                        }}
                      >
                        <Edit2 className="w-4 h-4 text-[hsl(var(--primary))]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-red-50 rounded-lg shadow-soft"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(b._id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-[hsl(var(--destructive))]" />
                      </Button>
                    </div>

                    {/* Star Badge */}
                    <div className="absolute bottom-3 left-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white rounded-lg shadow-soft"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Star className="w-4 h-4 text-amber-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h4 className="text-base font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors duration-200 mb-2 line-clamp-1">
                      {b.title}
                    </h4>
                    {b.description && (
                      <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-3">
                        {b.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-[hsl(var(--border))]">
                      <div className="flex -space-x-2 items-center">
                          {/* owner avatar (distinct) */}
                          {(() => {
                            const ownerObj = (b.owner && typeof b.owner === 'object') ? (b.owner as { _id?: string; avatarUrl?: string; displayName?: string; username?: string }) : undefined;
                            const ownerId = !ownerObj && b.owner ? String(b.owner) : ownerObj?._id;
                            if (ownerObj || ownerId) {
                              const avatarUrl = ownerObj?.avatarUrl || null;
                              const name = ownerObj?.displayName || ownerObj?.username || (ownerId ? ownerId : 'Owner');
                              const initials = name ? name.split(' ').map((p: string) => p[0]).slice(0,2).join('') : (ownerId ? String(ownerId).slice(0,2) : 'O');
                              return (
                                <div key={String(ownerId || 'owner')} title={`Owner: ${name}`} className="w-8 h-8 rounded-full ring-2 ring-[hsl(var(--primary))] overflow-hidden border-2 border-white bg-[hsl(var(--muted))] flex items-center justify-center text-xs font-bold text-white">
                                  {avatarUrl ? (
                                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[11px]">{String(initials).toUpperCase()}</span>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {/* members (exclude owner if duplicated) */}
                          {((b.members || []) as (string | { _id?: string; avatarUrl?: string; displayName?: string; username?: string; photoUrl?: string })[])
                            .filter((m) => {
                              const mId = typeof m === 'string' ? m : (m && (m._id || ''));
                              const ownerObj = (b.owner && typeof b.owner === 'object') ? (b.owner as { _id?: string }) : undefined;
                              const ownerId = ownerObj ? ownerObj._id : (typeof b.owner === 'string' ? b.owner : undefined);
                              return !ownerId || String(mId) !== String(ownerId);
                            })
                            .slice(0, 4)
                            .map((m, i) => {
                              const memberObj = (typeof m === 'string' ? { _id: m } : m || {}) as { _id?: string; avatarUrl?: string; photoUrl?: string; displayName?: string; username?: string };
                              const key = (memberObj && (memberObj._id)) || `m-${i}`;
                              const avatarUrl = memberObj.avatarUrl || memberObj.photoUrl || null;
                              const name = memberObj.displayName || memberObj.username || '';
                              const initials = name ? name.split(' ').map((p: string) => p[0]).slice(0,2).join('') : (memberObj._id ? String(memberObj._id).slice(0,2) : 'U');
                              return (
                                <div key={String(key)} title={name || String(key)} className="w-7 h-7 rounded-full ring-2 ring-white overflow-hidden border-2 border-white bg-[hsl(var(--muted))] flex items-center justify-center text-xs font-bold text-white">
                                  {avatarUrl ? (
                                    <img src={avatarUrl} alt={name || 'Member'} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[10px]">{String(initials).toUpperCase()}</span>
                                  )}
                                </div>
                              );
                            })}
                        </div>

                      <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(b.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Gradient Bar */}
                  <div className="h-1 bg-gradient-chat opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Create Board Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <form onSubmit={onCreate} className="relative w-full max-w-lg glass-strong p-8 rounded-2xl shadow-glow border border-[hsl(var(--border))] z-60 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-chat flex items-center justify-center">
                <Plus className="w-5 h-5 text-[hsl(var(--primary-foreground))]" />
              </div>
              Tạo bảng mới
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-[hsl(var(--foreground))] block mb-2">Tiêu đề</label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Ví dụ: Roadmap Q4" 
                  className="glass border-[hsl(var(--border))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 h-12 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[hsl(var(--foreground))] block mb-2">Mô tả (tùy chọn)</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full p-4 glass border border-[hsl(var(--border))] rounded-xl focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:outline-none text-[hsl(var(--foreground))]" 
                  rows={4}
                  placeholder="Mô tả chi tiết về bảng..."
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowCreate(false)} 
                type="button"
                className="hover:bg-[hsl(var(--muted))] rounded-xl px-6"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-chat text-[hsl(var(--primary-foreground))] shadow-glow hover:shadow-[0_0_60px_hsl(200_100%_70%/0.4)] px-8 rounded-xl"
              >
                Tạo bảng
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateWorkspace && (
        <div className="fixed inset-0 z-60 flex items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateWorkspace(false)} />
          <form onSubmit={onCreateWorkspace} className="relative w-full max-w-md glass-strong p-8 rounded-2xl shadow-glow border border-[hsl(var(--border))] z-60 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-chat flex items-center justify-center">
                <Plus className="w-5 h-5 text-[hsl(var(--primary-foreground))]" />
              </div>
              Tạo không gian làm việc
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-[hsl(var(--foreground))] block mb-2">Tên không gian</label>
                <Input 
                  value={newWorkspaceName} 
                  onChange={(e) => setNewWorkspaceName(e.target.value)} 
                  placeholder="Ví dụ: Công việc" 
                  className="glass border-[hsl(var(--border))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowCreateWorkspace(false)} 
                type="button"
                className="hover:bg-[hsl(var(--muted))] rounded-xl px-6"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-chat text-[hsl(var(--primary-foreground))] shadow-glow hover:shadow-[0_0_60px_hsl(200_100%_70%/0.4)] px-8 rounded-xl"
              >
                Tạo không gian
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Board Modal */}
      {showEdit && editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEdit(false)} />
          <form onSubmit={onEditSubmit} className="relative w-full max-w-lg glass-strong p-8 rounded-2xl shadow-glow border border-[hsl(var(--border))] z-60 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-chat flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-[hsl(var(--primary-foreground))]" />
              </div>
              Chỉnh sửa bảng
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-[hsl(var(--foreground))] block mb-2">Tiêu đề</label>
                <Input 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)} 
                  placeholder="Tiêu đề bảng" 
                  className="glass border-[hsl(var(--border))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 h-12 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[hsl(var(--foreground))] block mb-2">Mô tả (tùy chọn)</label>
                <textarea 
                  value={editDescription} 
                  onChange={(e) => setEditDescription(e.target.value)} 
                  className="w-full p-4 glass border border-[hsl(var(--border))] rounded-xl focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:outline-none text-[hsl(var(--foreground))]" 
                  rows={4}
                  placeholder="Mô tả chi tiết về bảng..."
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowEdit(false)} 
                type="button"
                className="hover:bg-[hsl(var(--muted))] rounded-xl px-6"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-chat text-[hsl(var(--primary-foreground))] shadow-glow hover:shadow-[0_0_60px_hsl(200_100%_70%/0.4)] px-8 rounded-xl"
              >
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Workspace Modal */}
      {showEditWorkspace && editWorkspaceId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditWorkspace(false)} />
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              if (editingWorkspaceRef.current) return;
              if (!editWorkspaceName.trim() || editWorkspaceName.trim().length < 2) {
                alert('Tên không gian phải có ít nhất 2 ký tự');
                return;
              }
              try {
                editingWorkspaceRef.current = true;
                await api.put(`/workspaces/${editWorkspaceId}`, { name: editWorkspaceName.trim() });
                setWorkspaces((cur) => cur.map((w) => w._id === editWorkspaceId ? { ...w, name: editWorkspaceName.trim() } : w));
                setShowEditWorkspace(false);
                setEditWorkspaceId(null);
              } catch (err) {
                console.error('edit workspace error', err);
                alert('Cập nhật không thành công');
              } finally {
                editingWorkspaceRef.current = false;
              }
            }}
            className="relative w-full max-w-md glass-strong p-8 rounded-2xl shadow-glow border border-[hsl(var(--border))] z-60 animate-in zoom-in-95 duration-300"
          >
            <h3 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-chat flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-[hsl(var(--primary-foreground))]" />
              </div>
              Chỉnh sửa không gian
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-[hsl(var(--foreground))] block mb-2">Tên không gian</label>
                <Input 
                  value={editWorkspaceName} 
                  onChange={(e) => setEditWorkspaceName(e.target.value)} 
                  placeholder="Tên không gian" 
                  className="glass border-[hsl(var(--border))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowEditWorkspace(false)} 
                type="button"
                className="hover:bg-[hsl(var(--muted))] rounded-xl px-6"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-chat text-[hsl(var(--primary-foreground))] shadow-glow hover:shadow-[0_0_60px_hsl(200_100%_70%/0.4)] px-8 rounded-xl"
              >
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </div>
  );
};

export default DashBoardPage;