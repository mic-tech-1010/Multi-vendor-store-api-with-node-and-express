
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
    userId: string | undefined;
    guestToken: string | undefined;
    cartItemId: number;
    quantity: number;
  }) {
    if (quantity < 1) {
      throw new Error("Quantity must be at least 1");
    }

    const cart = await this.findOrCreateCart({ userId, guestToken });

    if (!cart) {
      throw new Error("Cart not found");
    }

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
      include: {
        product: {
          include: {
            skus: true,
          },
        },
      },
    });

    if (!item) {
      throw new Error("Cart item not found");
    }

    // SKU / variation item
    if (item.productSkuId) {
      const sku = item.product.skus.find(
        (sku: any) => sku.id === item.productSkuId
      );

      if (!sku) {
        throw new Error("Product SKU not found");
      }

      if (sku.quantity < quantity) {
        throw new Error("Insufficient stock for the selected SKU");
      }
    }

    // Simple product item
    else {
      if ((item.product.quantity ?? 0) < quantity) {
        throw new Error("Insufficient stock for the selected product");
      }
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
    userId?: string;
    guestToken?: string;
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
    response,
    userId,
    guestToken,
  }: {
    response: Response;
    userId?: string;
    guestToken?: string;
  }) {

    const cart = await this.getActiveUserCart(response, userId, guestToken);

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      orderBy: {
        createdAt: 'asc',
      },
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
    const { userId, guestToken } = params;

    return await this.prisma.$transaction(async (tx: any) => {
      const guestCart = await tx.cart.findUnique({
        where: { guestToken },
        include: {
          items: true,
        },
      });

      // No guest cart -> just ensure user has a cart
      if (!guestCart) {
        let userCart = await tx.cart.findUnique({
          where: { userId },
        });

        if (!userCart) {
          userCart = await tx.cart.create({
            data: { userId },
          });
        }

        return userCart;
      }

      const existingUserCart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: true,
        },
      });

      // ---------------------------------------------------
      // CASE 1: User has NO cart yet
      // Claim guest cart for the user
      // ---------------------------------------------------
      if (!existingUserCart) {
        // validate all guest cart items against stock before claiming
        for (const guestItem of guestCart.items) {
          // SKU item
          if (guestItem.productSkuId) {
            const sku = await tx.productSku.findUnique({
              where: { id: guestItem.productSkuId },
              include: {
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            });

            if (!sku) {
              throw new Error("Product SKU not found during cart merge");
            }

            if (guestItem.quantity > sku.quantity) {
              throw new Error(
                `Cannot merge cart: only ${sku.quantity} unit(s) available for SKU ${sku.sku}`
              );
            }
          }

          // Simple product item
          else {
            const product = await tx.product.findUnique({
              where: { id: guestItem.productId },
              select: {
                name: true,
                quantity: true,
              },
            });

            if (!product) {
              throw new Error("Product not found during cart merge");
            }

            if ((product.quantity ?? 0) < guestItem.quantity) {
              throw new Error(
                `Cannot merge cart: only ${product.quantity ?? 0} unit(s) available for ${product.name}`
              );
            }
          }
        }

        const claimedCart = await tx.cart.update({
          where: { id: guestCart.id },
          data: {
            userId,
            guestToken: null,
          },
        });

        return claimedCart;
      }

      // ---------------------------------------------------
      // CASE 2: User already has a cart
      // Merge guest cart items into existing user cart
      // ---------------------------------------------------
      for (const guestItem of guestCart.items) {
        const existingItem = await tx.cartItem.findFirst({
          where: {
            cartId: existingUserCart.id,
            productId: guestItem.productId,
            productSkuId: guestItem.productSkuId ?? null,
          },
        });

        // ============================================
        // SKU ITEM MERGE
        // ============================================
        if (guestItem.productSkuId) {
          const sku = await tx.productSku.findUnique({
            where: { id: guestItem.productSkuId },
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          });

          if (!sku) {
            throw new Error("Product SKU not found during cart merge");
          }

          const mergedQty = existingItem
            ? existingItem.quantity + guestItem.quantity
            : guestItem.quantity;

          if (mergedQty > sku.quantity) {
            throw new Error(
              `Cannot merge cart: only ${sku.quantity} unit(s) available for SKU ${sku.sku}`
            );
          }
        }

        // ============================================
        // SIMPLE PRODUCT MERGE
        // ============================================
        else {
          const product = await tx.product.findUnique({
            where: { id: guestItem.productId },
            select: {
              name: true,
              quantity: true,
            },
          });

          if (!product) {
            throw new Error("Product not found during cart merge");
          }

          const mergedQty = existingItem
            ? existingItem.quantity + guestItem.quantity
            : guestItem.quantity;

          if (mergedQty > (product.quantity ?? 0)) {
            throw new Error(
              `Cannot merge cart: only ${product.quantity ?? 0} unit(s) available for ${product.name}`
            );
          }
        }

        // ============================================
        // AFTER STOCK VALIDATION -> DO THE MERGE
        // ============================================
        if (existingItem) {
          await tx.cartItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: existingItem.quantity + guestItem.quantity,
            },
          });

          await tx.cartItem.delete({
            where: { id: guestItem.id },
          });
        } else {
          await tx.cartItem.update({
            where: { id: guestItem.id },
            data: {
              cartId: existingUserCart.id,
            },
          });
        }
      }

      await tx.cart.delete({
        where: { id: guestCart.id },
      });

      return existingUserCart;
    });
  }

  // -------------------------
  // INTERNAL HELPERS
  // -------------------------

  private async findOrCreateCart(props: { userId: string | undefined; guestToken: string | undefined }) {
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

      const cart = this.findOrCreateCart({ userId, guestToken: undefined });

      return cart;

    }

    // GUEST CART
    if (guestToken) {

      const cart = this.findOrCreateCart({ userId: undefined, guestToken });

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