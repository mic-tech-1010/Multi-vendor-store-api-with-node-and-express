import { prisma } from "../db/prisma";

export async function generateProductSkus(
  productId: number
) {
  /*
  |--------------------------------------------------------------------------
  | STEP 0 — LOAD PRODUCT
  |--------------------------------------------------------------------------
  */

  const product =
    await prisma.product.findUnique({
      where: {
        id: productId,
      },

      include: {
        attributes: {
          include: {
            values: true,
          },
        },

        skus: {
          include: {
            attributeValues: {
              include: {
                productAttributeValue: true,
              },
            },
          },
        },
      },
    });

  if (!product) {
    throw new Error("Product not found");
  }

  /*
  |--------------------------------------------------------------------------
  | STEP 1 — DOMAIN GUARDS
  |--------------------------------------------------------------------------
  */

  // Product changed to simple
  if (!product.hasVariations) {
    await prisma.productSku.deleteMany({
      where: {
        productId,
      },
    });

    return;
  }

  // No attributes
  if (product.attributes.length === 0) {
    await prisma.productSku.deleteMany({
      where: {
        productId,
      },
    });

    return;
  }

  /*
  |--------------------------------------------------------------------------
  | STEP 2 — BUILD ATTRIBUTE MATRIX
  |--------------------------------------------------------------------------
  */

  const attributeValueSets =
    product.attributes.map((attribute) => {
      if (attribute.values.length === 0) {
        throw new Error(
          `Attribute "${attribute.name}" has no values`
        );
      }

      return attribute.values.map(
        (value) => value.id
      );
    });


  /*
  |--------------------------------------------------------------------------
  | STEP 3 — CARTESIAN PRODUCT
  |--------------------------------------------------------------------------
  */

  const combinations =
    cartesianProduct(attributeValueSets);


  // normalize combinations
  const desiredCombinations =
    combinations.map((combo) =>
      [...combo].sort((a, b) => a - b)
    );

  /*
  |--------------------------------------------------------------------------
  | STEP 4 — SYNC SKUS
  |--------------------------------------------------------------------------
  */

  await prisma.$transaction(
    async (tx) => {
      const attributeCount =
        product.attributes.length;

      /*
      |--------------------------------------------------------------------------
      | 4A — DELETE INVALID SKUS
      |--------------------------------------------------------------------------
      */

      for (const sku of product.skus) {
        const skuValueIds =
          sku.attributeValues.map(
            (item) =>
              item.productAttributeValueId
          );

        // wrong number of attributes
        if (
          skuValueIds.length !==
          attributeCount
        ) {
          await tx.productSku.delete({
            where: {
              id: sku.id,
            },
          });

          continue;
        }

        // invalid combination
        const normalized =
          [...skuValueIds].sort(
            (a, b) => a - b
          );

        const exists =
          desiredCombinations.some(
            (combo) =>
              arraysEqual(
                combo,
                normalized
              )
          );

        if (!exists) {
          await tx.productSku.delete({
            where: {
              id: sku.id,
            },
          });
        }
      }

      /*
      |--------------------------------------------------------------------------
      | 4B — REFETCH SKUS
      |--------------------------------------------------------------------------
      */

      const existingSkus =
        await tx.productSku.findMany({
          where: {
            productId,
          },

          include: {
            attributeValues: true,
          },
        });

      const existingCombinations =
        existingSkus.map((sku) =>
          sku.attributeValues
            .map(
              (v) =>
                v.productAttributeValueId
            )
            .sort((a, b) => a - b)
        );

      /*
      |--------------------------------------------------------------------------
      | 4C — CREATE MISSING SKUS
      |--------------------------------------------------------------------------
      */

      for (const combination of desiredCombinations) {
        const exists =
          existingCombinations.some(
            (existing) =>
              arraysEqual(
                existing,
                combination
              )
          );

        if (exists) {
          continue;
        }

        const sku =
          await tx.productSku.create({
            data: {
              productId,

              sku: await generateSkuCode(
                product.id,
                combination
              ),

              price: product.price,

              quantity: 0,
            },
          });

        const junctureTableData = combination.map(
          (
            productAttributeValueId
          ) => ({
            productSkuId: sku.id,

            productAttributeValueId,
          })
        );



        await tx.productSkuAttributeValue.createMany(
          {
            data: junctureTableData,
          }
        );
      }
    }
  );
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cartesianProduct(
  sets: number[][]
): number[][] {
  if (sets.length === 0) {
    return [];
  }

  return sets.reduce<number[][]>(
    (acc, set) => {
      const result: number[][] = [];

      for (const accItem of acc) {
        for (const value of set) {
          result.push([
            ...accItem,
            value,
          ]);
        }
      }

      return result;
    },
    [[]]
  );
}

function arraysEqual(
  a: number[],
  b: number[]
) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every(
    (value, index) =>
      value === b[index]
  );
}

async function generateSkuCode(
  productId: number,
  attributeValueIds: number[]
) {
  /*
  |--------------------------------------------------------------------------
  | LOAD PRODUCT + ATTRIBUTE VALUES
  |--------------------------------------------------------------------------
  */

  const product =
    await prisma.product.findUnique({
      where: {
        id: productId,
      },

      select: {
        name: true,
      },
    });

  const attributeValues =
    await prisma.productAttributeValue.findMany({
      where: {
        id: {
          in: attributeValueIds,
        },
      },

      select: {
        value: true,
      },
    });

  /*
  |--------------------------------------------------------------------------
  | BUILD HUMAN READABLE SKU
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | T Shirt
  | Red
  | Small
  |
  | =>
  |
  | tshirt-red-small
  |
  |--------------------------------------------------------------------------
  */

  const productSlug =
    product?.name
      ?.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-");

  const valueSlug =
    attributeValues
      .map((value) =>
        value.value
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, "-")
      )
      .join("-");

  return `${productSlug}-${valueSlug}`;
}