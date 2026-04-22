import { prisma } from "./db/prisma";

async function main() {
  console.log("🌱 Seeding started...");

  // =========================
  // USERS
  // =========================
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      id: "user_admin",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
    },
  });

  const vendor = await prisma.user.upsert({
    where: { email: "vendor@example.com" },
    update: {},
    create: {
      id: "user_vendor",
      name: "Vendor User",
      email: "vendor@example.com",
      role: "vendor",
    },
  });

  // =========================
  // DEPARTMENTS
  // =========================
  const departmentsData = [
    { name: "Electronics", slug: "electronics" },
    { name: "Clothing", slug: "clothing" },
    { name: "Home & Garden", slug: "home-garden" },
  ];

  const departmentsMap = new Map();

  for (const dept of departmentsData) {
    const created = await prisma.department.upsert({
      where: { slug: dept.slug },
      update: {},
      create: {
        ...dept,
        metaTitle: `${dept.name} Department`,
        metaDescription: `Browse ${dept.name}`,
      },
    });

    departmentsMap.set(dept.slug, created);
  }

  // =========================
  // CATEGORIES
  // =========================
  const categoriesData = [
    // Electronics
    { name: "Smartphones", dept: "electronics" },
    { name: "Laptops", dept: "electronics" },
    { name: "TVs", dept: "electronics" },

    // Clothing
    { name: "Shirts", dept: "clothing" },
    { name: "Pants", dept: "clothing" },

    // Home
    { name: "Furniture", dept: "home-garden" },
    { name: "Appliances", dept: "home-garden" },
  ];

  const categoriesMap = new Map();

  for (const cat of categoriesData) {
    const dept = departmentsMap.get(cat.dept);

    if (!dept) {
      throw new Error(`Department not found for ${cat.name}`);
    }

    const created = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.name.toLowerCase().replace(/\s+/g, "-"), // ✅ FIX
        departmentId: dept.id,
      },
    });

    categoriesMap.set(cat.name, created);
  }

  // =========================
  // PRODUCTS
  // =========================
  const productsData = [
    {
      name: "iPhone 15",
      slug: "iphone-15",
      category: "Smartphones",
      price: 999.99,
    },
    {
      name: "Samsung Galaxy S24",
      slug: "galaxy-s24",
      category: "Smartphones",
      price: 899.99,
    },
    {
      name: "MacBook Pro 16",
      slug: "macbook-pro-16",
      category: "Laptops",
      price: 2499.99,
    },
    {
      name: "Dell XPS 13",
      slug: "dell-xps-13",
      category: "Laptops",
      price: 1299.99,
    },
    {
      name: "Cotton T-Shirt",
      slug: "cotton-tshirt",
      category: "Shirts",
      price: 19.99,
    },
  ];

  for (const prod of productsData) {
    const category = categoriesMap.get(prod.category);
    if (!category) {
      throw new Error(`Category not found for ${prod.name}`);
    }

    const createdProduct = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: {
        name: prod.name,
        slug: prod.slug,
        description: `${prod.name} description`,
        departmentId: category.departmentId,
        categoryId: category.id,
        status: "active",
        price: prod.price,
        quantity: 10,
        createdBy: vendor.id,
        updatedBy: vendor.id,
      },
    });

    // =========================
    // PRODUCT IMAGES
    // =========================
    await prisma.productImage.create({
      data: {
        productId: createdProduct.id,
        imageUrl: `https://via.placeholder.com/300?text=${encodeURIComponent(prod.name)}`,
        imageCldPubId: `seed_${prod.slug}`,
        imageAltText: `${prod.name} image`,
        isPrimary: true,
      },
    });

    console.log("✅ Product created:", createdProduct.name);
  }

  console.log("🌱 Seeding completed!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });