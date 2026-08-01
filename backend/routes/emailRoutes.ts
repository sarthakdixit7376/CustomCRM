import { Router } from 'express';
import {
  connectGmail,
  oauthCallback,
  listAccounts,
  setDefaultAccount,
  disconnectAccount,
  listMessages,
  getMessage,
  sendMessage,
} from '../controllers/EmailController.js';

const router = Router();

router.get('/', connectGmail);
router.get('/oauth/callback', oauthCallback);
router.get('/accounts', listAccounts);
router.patch('/accounts/:accountId/default', setDefaultAccount);
router.delete('/accounts/:accountId', disconnectAccount);
router.get('/messages', listMessages);
router.post('/messages/send', sendMessage);
router.get('/messages/:id', getMessage);

export default router;
