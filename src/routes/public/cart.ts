import express from 'express';
import CartService from '#services/cartService.js';
import { userDataMiddleware } from '#middleware/authMiddleware.js';

export function createCartRouter(cartService: CartService) {
    const router = express.Router();

    router.use(userDataMiddleware);

    router.get('/', async (req, res) => {
        try {
            const userId = req.user?.data?.id;
        
            const result = await cartService.getCartSummary({
                userId,
                guestToken: req.cookies.cartToken,
            });

            return res.status(200).json({
                data: result,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    router.post('/items', async (req, res) => {
        try {

            const userId = req.user?.data?.id;

            const result = await cartService.addItem({
                userId,
                guestToken: req.cookies.cartToken,
                productId: req.body.productId,
                skuId: req.body.skuId,
                quantity: req.body.quantity,
                response: res
            });

            return res.status(200).json({
                message: result,
            });

        } catch (error) {
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    router.delete('/items/:itemId', async (req, res) => {
        try {
            const userId = req.user?.data?.id;
            const itemId = parseInt(req.params.itemId, 10);

            const result = await cartService.removeItem({
                userId,
                guestToken: req.cookies.cartToken,
                cartItemId: itemId,
            });

            return res.status(200).json({
                message: result,
            });

        } catch (error) {
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    router.put('/items/:itemId', async (req, res) => {
        try {
            const userId = req.user?.data?.id;
            const itemId = parseInt(req.params.itemId, 10);
            const quantity = req.body.quantity;

            const result = await cartService.updateItem({
                userId,
                guestToken: req.cookies.cartToken,
                cartItemId: itemId,
                quantity,
            });

            return res.status(200).json({
                message: result,
            });

        } catch (error) {
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    return router;
}