import express from 'express';
import CartService from '#services/cartService.js';
import { userDataMiddleware } from '#middleware/authMiddleware.js';

export function createCartRouter(cartService: CartService) {
    const router = express.Router();

    // Apply user data middleware to all routes in this router
    router.use(userDataMiddleware);

    // Get cart summary
    router.get('/', async (req, res) => {
        try {
            const userId = req.user?.data?.id;

            const result = await cartService.getCartSummary({
                response: res,
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

    // Add item to cart
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

    //delete cart item
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

    // Update cart item quantity
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

    // Merge guest cart to user cart
    router.post('/merge', async (req, res) => {
        try {
            const userId = req.user?.data?.id;
            const guestToken = req.cookies.cartToken;

            const result = await cartService.mergeGuestCartToUser({
                userId,
                guestToken,
            });

            // Clear the guest cart cookie only after successful merge
            res.clearCookie('cartToken');

            return res.status(200).json({
                data: result,
                success: true,
            });

        } catch (error) {
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    return router;
}