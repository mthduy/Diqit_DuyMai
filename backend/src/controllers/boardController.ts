import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Board } from '../models/Board.js';
import { List } from '../models/List.js';
import { Card } from '../models/Card.js';

export const createBoard = async (req: Request, res: Response) => {
  try {
    const { title, description, members, workspace } = req.body;
    const ownerId = (req as any).user?._id;

    // Normalize members: accept array or JSON-stringified array
    let membersList: string[] = [];
    if (Array.isArray(members)) {
      membersList = members;
    } else if (typeof members === 'string' && members.trim().length) {
      try {
        const parsed = JSON.parse(members);
        if (Array.isArray(parsed)) membersList = parsed;
      } catch (e) {
        // fallback: try comma-separated ids
        membersList = members.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    // Normalize workspace input: accept string id, JSON-stringified id, or object with _id
    let ws: any = workspace;
    if (typeof ws === 'string') {
      // try parse if it's a JSON-stringified value
      const trimmed = ws.trim();
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'string' || (parsed && parsed._id)) ws = parsed;
      } catch (e) {
        // not JSON, keep trimmed string
        ws = trimmed;
      }
    }

    if (typeof ws === 'object' && ws?._id) ws = String(ws._id);

    if (!ws || !mongoose.isValidObjectId(String(ws))) {
      return res.status(400).json({ message: 'workspace is required and must be a valid workspace id' });
    }

    const payload: any = {
      title,
      description,
      owner: ownerId,
      members: membersList,
      workspace: new mongoose.Types.ObjectId(String(ws)),
    };

    console.debug('createBoard payload ->', payload);
    const doc = await Board.create(payload);

    return res.status(201).json({ board: doc });
  } catch (error) {
    console.error('createBoard error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const listBoards = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { workspace } = req.query;

    const baseFilter: any = {
      $or: [{ owner: userId }, { members: userId }],
    };

    
    // ✅ Ép kiểu workspace sang ObjectId nếu hợp lệ
    if (workspace && typeof workspace === 'string' && mongoose.isValidObjectId(workspace)) {
      baseFilter.workspace = new mongoose.Types.ObjectId(workspace);
    }

  console.debug('listBoards filter ->', baseFilter, 'debugId=', (req.headers['x-debug-id'] || 'none'));
    // populate workspace and members so client knows the workspace details and member profiles for each board
    const boards = await Board.find(baseFilter)
      .sort({ updatedAt: -1 })
      .populate('workspace', 'name')
      // populate owner and members so client can show avatars and names
      .populate('owner', 'displayName username avatarUrl')
      .populate('members', 'displayName username avatarUrl');
    console.debug('listBoards result count ->', boards.length, 'debugId=', (req.headers['x-debug-id'] || 'none'));

    return res.status(200).json({ boards });
  } catch (error) {
    console.error('listBoards error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getBoard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const board = await Board.findById(id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const userId = (req as any).user?._id?.toString();
    const isMemberOrOwner = board.owner?.toString() === userId || (board.members || []).map(String).includes(userId);
    if (!isMemberOrOwner) return res.status(403).json({ message: 'Forbidden' });

    const lists = await List.find({ boardId: id }).sort({ position: 1 });
    const cards = await Card.find({ boardId: id }).sort({ position: 1 });

    return res.status(200).json({ board, lists, cards });
  } catch (error) {
    console.error('getBoard error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateBoard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const board = await Board.findById(id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const userId = (req as any).user?._id?.toString();
    if (board.owner?.toString() !== userId) return res.status(403).json({ message: 'Only owner can update board' });

    const allowed: Record<string, any> = {};
    const { title, description, members } = req.body;
    if (typeof title === 'string') allowed.title = title;
    if (typeof description === 'string') allowed.description = description;

    // accept members as array or JSON-string or CSV string
    if (Array.isArray(members)) {
      allowed.members = members;
    } else if (typeof members === 'string' && members.trim().length) {
      let parsedMembers: string[] = [];
      try {
        const parsed = JSON.parse(members);
        if (Array.isArray(parsed)) parsedMembers = parsed;
      } catch (e) {
        parsedMembers = members.split(',').map((s) => s.trim()).filter(Boolean);
      }

      const cleaned: string[] = [];
      for (let m of parsedMembers) {
        if (typeof m !== 'string') continue;
        let c = m.trim();
        c = c.replace(/^['"]|['"]$/g, '');
        if (c.startsWith('<') && c.endsWith('>')) c = c.slice(1, -1).trim();
        c = c.trim();
        if (!mongoose.isValidObjectId(String(c))) {
          return res.status(400).json({ message: 'Invalid member id', fields: { members: `Invalid id: ${m}` } });
        }
        cleaned.push(c);
      }

      allowed.members = cleaned;
    }

    const updated = await Board.findByIdAndUpdate(id, { $set: allowed }, { new: true });
    return res.status(200).json({ board: updated });
  } catch (error) {
    console.error('updateBoard error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteBoard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const board = await Board.findById(id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const userId = (req as any).user?._id?.toString();
    if (board.owner?.toString() !== userId) return res.status(403).json({ message: 'Only owner can delete board' });

    // delete lists and cards belonging to this board
    await Promise.all([
      List.deleteMany({ boardId: id }),
      Card.deleteMany({ boardId: id }),
      Board.findByIdAndDelete(id),
    ]);

    return res.status(204).send();
  } catch (error) {
    console.error('deleteBoard error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export default {
  createBoard,
  listBoards,
  getBoard,
  updateBoard,
  deleteBoard,
};
