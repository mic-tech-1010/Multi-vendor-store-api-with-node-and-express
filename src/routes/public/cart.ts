import express from 'express';
import CartService from '#services/cartService.js';

export function createCartRouter(cartService: CartService) {
    const router = express.Router();

    router.get('/', (req, res) => {
        res.json({ message: 'Cart route is working!' });
    });

    router.post('/items', async (req, res) => {
        try {
            const result = await cartService.addItem({
                req,
                guestToken: req.cookies.cartToken,
                productId: req.body.productId,
                productSkuId: req.body.productSkuId,
                quantity: req.body.quantity,
            });

            res.json(result);
        } catch (error) {
            console.error('Error adding item to cart:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    return router;
}