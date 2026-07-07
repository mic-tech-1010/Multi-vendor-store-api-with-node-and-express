
import type { Product } from "#type.js";
import { type Response } from "express";

interface AddItemProps {
  userId: string | undefined;
  guestToken?: string;
  productId: number;
  skuId?: number;
  quantity: number;
  response: Response;
}

export default class CartService {
  constructor(private prisma: any) { }

  // -------------------------
  // CART OPERATIONS
  // -------------------------
  async addItem(
    { userId,
      guestToken,
      productId,
      skuId,
      quantity,
      response
    }: AddItemProps) {

    // VALIDATE PRODUCT
    const product: Product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { skus: true },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const sku = product.skus.find((sku: any) => sku.id === skuId);

    //FIND OR CREATE CART
    const cart = await this.getActiveUserCart(response, userId, guestToken);

    // save simple products to cart (no variations)
    if (!skuId) {

      if (product.quantity < quantity) {
        throw new Error(`Insufficient stock for the selected Product`);
      }

      // check if item already exists in cart
      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
        },
      });

      if (existingItem) {
        // update quantity
        const cartItem = await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      }

      else {
        const cartItem = await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,

            price: product.price,
          },
        });
      }

    }

    //save products with variation to cart
    else {

      if (!sku) {
        throw new Error("Product SKU not found");
      }

      if (sku.quantity < quantity) {
        throw new Error("Insufficient stock for the selected SKU");
      }

      // check if item already exists in cart
      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          productSkuId: skuId ?? null,
        },
      });

      if (existingItem) {
        // update quantity
        const cartItem = await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      }
      else {
        const cartItem = await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            productSkuId: skuId ?? null,
            quantity,

            price: sku.price,
          },
        });
      }

    }



    const message = skuId ?
      `${quantity} ${sku?.sku} added to cart successfully` :
      `${quantity} ${product.name} added to cart successfully`;

    return message;

  }

  async updateItem({
    userId,
    guestToken,
    cartItemId,
    quantity,
  }: {
    userId: string;
    guestToken: string;
    cartItemId: number;
    quantity: number;
  }) {
    const cart = await this.findOrCreateCart({ userId, guestToken });

    if (!cart) {
      throw new Error("Cart not found");
    }

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      throw new Error("Cart item not found");
    }

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });

    return "Item quantity updated successfully";
  }

  async removeItem({
    userId,
    guestToken,
    cartItemId,
  }: {
    userId: string;
    guestToken: string;
    cartItemId: number;
  }) {
    const cart = await this.findOrCreateCart({ userId, guestToken });

    if (!cart) {
      throw new Error("Cart not found");
    }

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      throw new Error("Cart item not found");
    }

    await this.prisma.cartItem.delete({
      where: { id: item.id },
    });

    return "Item removed from cart successfully";
  }

  async getCartSummary({
    userId,
    guestToken,
  }: {
    userId: string;
    guestToken: string;
  }) {
    const cart = await this.findOrCreateCart({ userId, guestToken });

    if (!cart) {
      throw new Error("Cart not found");
    }

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            status: true,
            quantity: true,

            images: {
              where: {
                isPrimary: true,
              },
              take: 1,
              select: {
                imageUrl: true,
              },
            },

            skus: {
              select: {
                id: true,
                sku: true,
                price: true,
                quantity: true,

                attributeValues: {
                  select: {
                    id: true,
                    value: true,

                    productAttribute: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },

                    images: {
                      orderBy: {
                        order: "asc",
                      },

                      select: {
                        id: true,
                        imageUrl: true,
                        imageAltText: true,
                        isPrimary: true,
                        order: true,
                      },
                    },
                  },
                },
              },
            },


          },
        },
      },
    });

    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + Number(item.price) * item.quantity;
    }, 0);

    return {
      cartId: cart.id,
      items,
      itemCount: items.length,
      subtotal,
    };
  }


  // -------------------------
  // MERGE LOGIC (IMPORTANT)
  // -------------------------
  async mergeGuestCartToUser(params: {
    userId: string;
    guestToken: string;
  }) {
    throw new Error("not implemented");
  }

  // -------------------------
  // INTERNAL HELPERS
  // -------------------------

  private async findOrCreateCart(props: { userId?: string; guestToken?: string }) {
    const { userId, guestToken } = props;

    if (userId) {
      let cart = await this.prisma.cart.findFirst({
        where: { userId },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId },
        });
      }

      return cart;
    }

    if (guestToken) {
      let cart = await this.prisma.cart.findFirst({
        where: { guestToken },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { guestToken },
        });
      }

      return cart;
    }

  }

  private async getActiveUserCart(response?: Response, userId?: string, guestToken?: string) {

    // AUTH USER CART
    if (userId) {

      const cart = this.findOrCreateCart({ userId });

      response?.clearCookie('cartToken')

      return cart;
    }

    // GUEST CART
    if (guestToken) {

      const cart = this.findOrCreateCart({ guestToken });

      return cart;
    }

    // if no token exists → create new guest cart
    const newToken = crypto.randomUUID();

    const cart = await this.prisma.cart.create({
      data: {
        guestToken: newToken,
      },
    });

    const days = 14 * 24 * 60 * 60 * 1000

    response?.cookie('cartToken', newToken, { httpOnly: true, sameSite: 'lax', maxAge: days });

    return cart;
  }

}