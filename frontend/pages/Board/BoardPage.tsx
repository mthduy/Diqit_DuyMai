import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal, Search, Bell, Settings, Star, Users, Grid3x3, Calendar, ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { boardService } from '@/services/boardService';
import type { Board, ListItem, CardItem } from '@/types/board';

const BoardPage = () => {
  const { id } = useParams();
  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<ListItem[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [showUserPreview, setShowUserPreview] = useState(false);

  // Local-only create list modal state (client-side only; backend list endpoints not implemented here)
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const creatingRef = useRef(false);

  const createLocalList = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (creatingRef.current) return;
    if (!newListTitle.trim() || (newListTitle.trim().length < 2)) {
      alert('Tiêu đề danh sách phải có ít nhất 2 ký tự');
      return;
    }
    try {
      creatingRef.current = true;
      // create a temporary list locally — not persisted to server
      const id = `temp-${Date.now()}`;
      const boardId = board?._id || String(id);
      const position = lists.length;
      const list: ListItem = { _id: id, title: newListTitle.trim(), boardId, position };
      setLists((s) => [...s, list]);
      setNewListTitle('');
      setShowCreateList(false);
    } catch (err) {
      console.error('create local list error', err);
    } finally {
      creatingRef.current = false;
    }
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const data = await boardService.get(id);
        setBoard(data.board);
        setLists(data.lists || []);
        setCards(data.cards || []);
      } catch (err) {
        console.error('load board error', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-purple">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[hsl(var(--foreground))] font-medium">Đang tải bảng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-purple">
      {/* Modern Header with Glass Effect */}
      <header className="glass-strong px-6 py-3 flex items-center justify-between shadow-soft sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow transform hover:scale-105 transition-transform">
                <Grid3x3 className="w-5 h-5 text-[hsl(var(--primary-foreground))]" />
              </div>
            </div>
            <span className="text-xl font-bold text-[hsl(var(--primary-foreground))]">
              KanbanX
            </span>
          </div>

          {/* Quick Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button onClick={() => setShowCreateList(true)} className="bg-gradient-chat text-[hsl(var(--primary-foreground))] font-medium px-5 py-2 rounded-lg shadow-glow transition-all hover:shadow-[0_0_60px_hsl(200_100%_70%/0.35)] hover:scale-105">
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
            <Button variant="ghost" className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>

          {/* Right Section */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[hsl(var(--destructive))] rounded-full status-online"></span>
          </Button>
          <Button variant="ghost" size="icon" className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
            <Settings className="w-5 h-5" />
          </Button>
          
          {/* User Avatar (from auth store) */}
          <div className="relative">
            <div
              className="flex items-center gap-2 px-3 py-2 bg-gradient-chat rounded-xl shadow-glow hover:shadow-[0_0_60px_hsl(200_100%_70%/0.35)] transition-all cursor-pointer"
              onMouseEnter={() => setShowUserPreview(true)}
              onMouseLeave={() => setShowUserPreview(false)}
              onClick={() => navigate('/profile')}
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[hsl(var(--primary))] font-bold text-sm">{(user?.username?.[0] || 'U').toUpperCase()}</span>
                )}
              </div>
              <span className="text-[hsl(var(--primary-foreground))] font-medium text-sm hidden sm:block">{user?.displayName || user?.username || 'Người dùng'}</span>
            </div>

            {showUserPreview && (
              <div className="absolute right-0 mt-3 z-50 message-bounce">
                <Card className="w-72 glass-strong shadow-glow border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-chat flex items-center justify-center text-white font-bold">{(user?.username?.[0] || 'U').toUpperCase()}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{user?.displayName || user?.username}</h4>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="w-20 text-xs font-medium">Điện thoại:</span>
                        <span className="text-foreground">{user?.phone || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Board Content */}
      <div className="flex-1 overflow-hidden">
        {/* Board Header with Glass Effect */}
        <div className="px-6 py-6 glass backdrop-blur-xl border-b border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
                {board?.title || 'My Board'}
              </h1>
              <Button variant="ghost" size="icon" className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                <Star className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" className="glass-strong border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] rounded-lg">
                <Users className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" className="glass-strong border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] rounded-lg">
                <Calendar className="w-4 h-4 mr-2" />
                Timeline
              </Button>
              <Button variant="ghost" size="icon" className="text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>

            {/* Create List Modal (client-only) */}
            {showCreateList && createPortal(
          <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreateList(false)} />
            <form onSubmit={createLocalList} className="relative w-full max-w-lg p-6 bg-white rounded-2xl shadow-xl z-60">
              <h3 className="text-lg font-semibold mb-4">Tạo danh sách (chỉ local)</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Tiêu đề danh sách</label>
                  <Input value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)} placeholder="Ví dụ: To do" />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowCreateList(false)} type="button">Hủy</Button>
                <Button type="submit" className="bg-[hsl(var(--primary))] text-white">Tạo</Button>
              </div>
            </form>
          </div>,
          document.body
        )}

          {/* Board Stats */}
          <div className="flex items-center gap-6 text-sm text-[hsl(var(--muted-foreground))]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full status-online"></div>
              <span>{lists.length} danh sách</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[hsl(var(--online))] rounded-full status-online"></div>
              <span>{cards.length} thẻ</span>
            </div>
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="px-6 py-6 flex gap-5 overflow-x-auto h-[calc(100vh-220px)] pb-8">
          {lists.length === 0 ? (
            <div className="flex items-center justify-center w-full">
              <div className="text-center">
                <div className="w-20 h-20 bg-[hsl(var(--muted))] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Grid3x3 className="w-10 h-10 text-[hsl(var(--muted-foreground))]" />
                </div>
                <p className="text-[hsl(var(--foreground))] font-medium mb-2">Chưa có danh sách nào</p>
                <p className="text-[hsl(var(--muted-foreground))] text-sm">Tạo danh sách đầu tiên để bắt đầu</p>
              </div>
            </div>
            ) : (
            lists.map((list, index) => {
              const listCards = cards.filter((c) => String(c.listId) === String(list._id));
              const gradients = [
                'linear-gradient(135deg, hsl(200, 100%, 75%), hsl(190, 100%, 85%))',
                'linear-gradient(135deg, hsl(280, 80%, 75%), hsl(260, 80%, 85%))',
                'linear-gradient(135deg, hsl(160, 80%, 70%), hsl(140, 80%, 80%))',
                'linear-gradient(135deg, hsl(30, 95%, 70%), hsl(10, 90%, 75%))',
                'linear-gradient(135deg, hsl(190, 100%, 70%), hsl(200, 100%, 85%))'
              ];
              const gradient = gradients[index % gradients.length];
              
                  return (
                <div key={list._id} className="shrink-0 w-80 relative">
                  {/* List Header */}
                  <div className="bg-[hsl(var(--card))] rounded-2xl shadow-soft border border-[hsl(var(--border))] mb-3 overflow-hidden">
                    <div 
                      className="h-1.5"
                      style={{ background: gradient }}
                    ></div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ background: gradient }}
                        ></div>
                        <h2 className="font-bold text-[hsl(var(--card-foreground))] text-base">{list.title}</h2>
                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-1 rounded-full">
                          {listCards.length}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[hsl(var(--muted))] rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Cards Container */}
                  <div className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto pr-1 custom-scrollbar">
                    {listCards.map((task) => (
                      <Card key={task._id} className="group bg-[hsl(var(--card))] hover:shadow-glow cursor-pointer transition-all duration-300 border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] rounded-xl overflow-hidden transform hover:-translate-y-1 message-bounce">
                        <div className="p-4">
                          <p className="text-sm font-medium text-[hsl(var(--card-foreground))] mb-3 leading-relaxed">
                            {task.title}
                          </p>
                          
                          {/* Card Footer */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                <div 
                                  className="w-6 h-6 rounded-full border-2 border-[hsl(var(--card))] flex items-center justify-center text-white text-xs font-bold"
                                  style={{ background: 'linear-gradient(135deg, hsl(200, 100%, 65%), hsl(210, 100%, 75%))' }}
                                >
                                  A
                                </div>
                                <div 
                                  className="w-6 h-6 rounded-full border-2 border-[hsl(var(--card))] flex items-center justify-center text-white text-xs font-bold"
                                  style={{ background: 'linear-gradient(135deg, hsl(280, 80%, 65%), hsl(260, 80%, 75%))' }}
                                >
                                  B
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-xs">Due soon</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Hover Gradient Effect */}
                        <div 
                          className="h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: gradient }}
                        ></div>
                      </Card>
                    ))}

                    {/* Add Card Button (disabled - left for later implementation) */}
                    <Button variant="ghost" disabled className="w-full justify-start text-[hsl(var(--muted-foreground))] opacity-60 cursor-not-allowed rounded-xl py-3 font-medium text-sm border-2 border-dashed border-[hsl(var(--border))] transition-all" title="Chức năng thêm thẻ được để trống - hoàn thiện sau">
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm thẻ (sắp có)
                    </Button>
                  </div>
                </div>
              );
            })
          )}

          {/* Add List Card */}
          <div className="shrink-0 w-80">
            <div className="glass border-2 border-dashed border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))] rounded-2xl p-6 cursor-pointer transition-all duration-300 group">
              <Button variant="ghost" onClick={() => setShowCreateList(true)} className="w-full justify-center text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))] rounded-xl py-3 font-medium flex-col gap-2">
                <div className="w-12 h-12 bg-[hsl(var(--accent))] group-hover:bg-[hsl(var(--primary-glow))] rounded-xl flex items-center justify-center transition-colors">
                  <Plus className="w-6 h-6 text-[hsl(var(--primary))]" />
                </div>
                <span>Thêm danh sách</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

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

export default BoardPage;