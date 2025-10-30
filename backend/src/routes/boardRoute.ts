import express from 'express';
import validateBody from '../middlewares/validateBody.js';
import { createBoardSchema, updateBoardSchema } from '../middlewares/board.validation.js';
import boardController from '../controllers/boardController.js';
import { createBoard, listBoards, getBoard, updateBoard, deleteBoard } from '../controllers/boardController.js';


const router = express.Router();

router.post('/', validateBody(createBoardSchema), createBoard);
router.get('/', listBoards);
router.get('/:id',getBoard);
router.put('/:id', validateBody(updateBoardSchema),updateBoard);
router.delete('/:id', deleteBoard);

export default router;
