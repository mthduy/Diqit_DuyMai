import api from '@/lib/axios';
import type { Board, ListItem, CardItem } from '@/types/board';

export const boardService = {
  list: async (workspace?: string): Promise<Board[]> => {
    const url = workspace ? `/boards?workspace=${workspace}` : '/boards';
    console.debug('boardService.list url ->', url);
    const debugId = `dbg-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const res = await api.get(url, { withCredentials: true, headers: { 'x-debug-id': debugId } });
    console.debug('boardService.list', { url, debugId, data: res.data });
    // server responds { boards: Board[] }
    return res.data.boards as Board[];
  },

  create: async (payload: { title: string; description?: string; members?: string[]; workspace?: string }): Promise<Board> => {
    const res = await api.post('/boards', payload, { withCredentials: true });
    return res.data.board as Board;
  },

  get: async (id: string): Promise<{ board: Board; lists: ListItem[]; cards: CardItem[] }> => {
    const res = await api.get(`/boards/${id}`, { withCredentials: true });
    return res.data as { board: Board; lists: ListItem[]; cards: CardItem[] };
  },

  update: async (id: string, payload: { title?: string; description?: string; members?: string[] }): Promise<Board> => {
    const res = await api.put(`/boards/${id}`, payload, { withCredentials: true });
    return res.data.board as Board;
  },

  remove: async (id: string): Promise<boolean> => {
    const res = await api.delete(`/boards/${id}`, { withCredentials: true });
    // server sends 204 on success
    return res.status === 204 || res.status === 200;
  },
};

export default boardService;
