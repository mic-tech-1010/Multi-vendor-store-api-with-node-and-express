export default class CartService {
  constructor(private prisma: any) { }

  // -------------------------
  // CORE RESOLUTION
  // -------------------------
  async getActiveCart(userId?: string, guestToken?: string) {
    throw new Error("not implemented");
  }

  // -------------------------
  // CART OPERATIONS
  // -------------------------
  async addItem(params: {
    req: any;
    guestToken?: string;
    productId: number;
    productSkuId?: number;
    quantity: number;
  }) {
    const { req, guestToken, productId, productSkuId, quantity } = params;

    //AUTH CHECK
    const userId = req.user?.id;

    //FIND OR CREATE CART
    const cart = await this.findOrCreateCart(userId, guestToken);

    // VALIDATE PRODUCT & SKU
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { skus: true },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (productSkuId) {
      const sku = product.skus.find((sku: any) => sku.id === productSkuId);
      if (!sku) {
        throw new Error("Product SKU not found");
      }

      if (sku.quantity < quantity) {
        throw new Error("Insufficient stock for the selected SKU");
      } else {
        // simple product stock check
        if (product.quantity < quantity) {
          throw new Error("Insufficient stock for the selected product");
        }
      }

      // check if item already exists in cart
      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          productSkuId: productSkuId ?? null,
        },
      });

      let cartItem;

      if (existingItem) {
        // update quantity
        cartItem = await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      }
      else {
        cartItem = await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            productSkuId: productSkuId ?? null,
            quantity,

            price: product.price,
          },
        });
      }

      return this.getCartSummary({ userId, guestToken });
    }
  }

  async updateItem(params: {
    userId?: string;
    guestToken?: string;
    cartItemId: number;
    quantity: number;
  }) {
    throw new Error("not implemented");
  }

  async removeItem(params: {
    userId?: string;
    guestToken?: string;
    cartItemId: number;
  }) {
    throw new Error("not implemented");
  }

  async getCartSummary({
    userId = undefined,
    guestToken = undefined,
  }: {
    userId?: string;
    guestToken?: string;
  }) {
    const cart = await this.findOrCreateCart(userId, guestToken);

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: true,
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
  private async findOrCreateCart(userId?: string, guestToken?: string) {
     // AUTH USER CART
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

    // GUEST CART
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

    // if no token exists → create new guest cart
    const newToken = crypto.randomUUID();

    const cart = await this.prisma.cart.create({
      data: {
        guestToken: newToken,
      },
    });

    return cart;
  }

  private async calculateTotals(cartId: number) {
    throw new Error("not implemented");
  }
}