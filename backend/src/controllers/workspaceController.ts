import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace.js';
import { Board } from '../models/Board.js';

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const { name, members } = req.body;
    const ownerId = (req as any).user?._id;
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    // Normalize members array and ensure owner is also included as a member
    const membersList: any[] = Array.isArray(members) ? members.slice() : [];
    const ownerIdStr = String(ownerId);
    if (!membersList.map(String).includes(ownerIdStr)) {
      membersList.push(ownerId);
    }

    const doc = await Workspace.create({ name, owner: ownerId, members: membersList });
    return res.status(201).json({ workspace: doc });
  } catch (error) {
    console.error('createWorkspace error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const listWorkspaces = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Also include any workspace that contains a board where the user is owner or member
    // 1) find boards where the user is owner or member and has a workspace
    const boards = await Board.find({ $or: [{ owner: userId }, { members: userId }], workspace: { $exists: true, $ne: null } }).select('workspace').lean();
    const workspaceIdStrings = Array.from(new Set(boards.map((b: any) => String(b.workspace)).filter(Boolean)));
    const workspaceObjectIds = workspaceIdStrings.map((s) => new mongoose.Types.ObjectId(s));

    const workspaces = await Workspace.find({
      $or: [
        { owner: userId },
        { members: userId },
        { _id: { $in: workspaceObjectIds } },
      ],
    }).sort({ updatedAt: -1 });

    return res.status(200).json({ workspaces });
  } catch (error) {
    console.error('listWorkspaces error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getWorkspaceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?._id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid workspace id' });
    }

    // Tìm workspace
    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    //  Kiểm tra quyền truy cập (owner hoặc member)
    const isMemberOrOwner =
      workspace.owner?.toString() === userId?.toString() ||
      (workspace.members || []).map(String).includes(userId?.toString());
    if (!isMemberOrOwner) return res.status(403).json({ message: 'Forbidden' });

    // Lấy toàn bộ boards trong workspace đó
    const boards = await Board.find({ workspace: id }).sort({ updatedAt: -1 });

    return res.status(200).json({ workspace, boards });
  } catch (error) {
    console.error('getWorkspaceById error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Dev-only: migrate/fix boards that miss workspace or members
export const migrateFixBoards = async (req: Request, res: Response) => {
  try {
    // safety: only allow in non-production
    if ((process.env.NODE_ENV || 'development') === 'production') {
      return res.status(403).json({ message: 'Forbidden in production' });
    }

    // find boards missing workspace
    const boardsMissingWorkspace = await Board.find({ $or: [{ workspace: { $exists: false } }, { workspace: null }] });
    if (!boardsMissingWorkspace.length) {
      return res.status(200).json({ message: 'No boards missing workspace', modifiedCount: 0 });
    }

    // group board ids by owner
    const byOwner: Record<string, string[]> = {};
    for (const b of boardsMissingWorkspace) {
      const ownerId = String((b.owner || '').toString());
      if (!byOwner[ownerId]) byOwner[ownerId] = [];
      byOwner[ownerId].push(String(b._id));
    }

    let totalUpdated = 0;
    let totalMembersFixed = 0;

    for (const ownerId of Object.keys(byOwner)) {
      // try find an existing workspace for owner
      let ws = await Workspace.findOne({ owner: ownerId });
      if (!ws) {
        ws = await Workspace.create({ name: `Default workspace for ${ownerId}`, owner: ownerId, members: [ownerId] });
      }

      // update boards for this owner that still lack workspace
      const u = await Board.updateMany(
        { owner: ownerId, $or: [{ workspace: { $exists: false } }, { workspace: null }] },
        { $set: { workspace: ws._id, updatedAt: new Date() } }
      );
      totalUpdated += (u as any).modifiedCount || (u as any).nModified || 0;

      // ensure boards for this owner have members (add owner if members empty)
      const m = await Board.updateMany(
        { owner: ownerId, $or: [{ members: { $exists: false } }, { members: { $size: 0 } }] },
        { $set: { members: [ownerId], updatedAt: new Date() } }
      );
      totalMembersFixed += (m as any).modifiedCount || (m as any).nModified || 0;
    }

    return res.status(200).json({ message: 'Migration finished', boardsAssigned: totalUpdated, membersFixed: totalMembersFixed });
  } catch (error) {
    console.error('migrateFixBoards error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export default {
  createWorkspace,
  listWorkspaces,
  getWorkspaceById,
};
