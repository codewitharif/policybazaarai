const express = require('express');
const router = express.Router();
const claimController = require('../controllers/ClaimsControllers');
const multer = require('multer');
const { storage } = require('../utils/cloudinary');
const upload = multer({ storage });

router.get('/', claimController.getAllClaims);
router.post('/ghost-write', claimController.ghostWriteClaim);
router.get('/:id', claimController.getClaimById);
router.post('/', upload.single('attachment'), claimController.createClaim);
router.put('/:id', claimController.updateClaim);
router.delete('/:id', claimController.deleteClaim);

module.exports = router;
