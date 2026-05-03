const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const multer = require('multer');
const { storage } = require('../utils/cloudinary');
const upload = multer({ storage });

router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.post('/enroll', customerController.enrollPolicy);

router.post('/verify-biometrics/:id', upload.fields([
  { name: 'selfie', maxCount: 1 },
  { name: 'idCard', maxCount: 1 }
]), customerController.verifyBiometrics);

module.exports = router;
