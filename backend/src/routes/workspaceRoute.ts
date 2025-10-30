import express from 'express';
import validateBody from '../middlewares/validateBody.js';
import { createWorkspaceSchema } from '../middlewares/workspace.validation.js';
import { createWorkspace, getWorkspaceById, listWorkspaces, migrateFixBoards } from '../controllers/workspaceController.js';


const router = express.Router();

router.post('/', validateBody(createWorkspaceSchema), createWorkspace);
router.get('/', listWorkspaces);
router.get('/:id', getWorkspaceById); // 👈 thêm dòng này
router.post('/migrate-fix', migrateFixBoards); // dev-only migration endpoint



export default router;
