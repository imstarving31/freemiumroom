const express = require('express');
const router = express.Router();
const roomPostController = require('../controllers/roomPost.controller');
const uploadCloud = require('../middlewares/uploadCloud');
const verifyToken = require('../middlewares/verifyToken');

router.post('/', verifyToken, uploadCloud.array('images', 10), roomPostController.createPost);
router.get('/', roomPostController.getAllPosts);
router.get('/me', verifyToken, roomPostController.getMyPosts);
router.get('/:id', roomPostController.getPostById);
router.patch('/:id/availability', verifyToken, roomPostController.toggleAvailability);
router.delete('/:id', verifyToken, roomPostController.deletePost);

module.exports = router;
