import express from 'express';
import {upload} from '../configs/multer.js';
import authSeller from '../middleware/authSeller.js';
import { addProduct, changeStock, productId, productList } from '../controllers/productController.js';

const productRouter = express.Router();

productRouter.post('/add', upload.array(["images"]), authSeller, addProduct);
productRouter.get('/list', productList)
productRouter.get('/id', productId)
productRouter.post('/stock', authSeller, changeStock)

export default productRouter;