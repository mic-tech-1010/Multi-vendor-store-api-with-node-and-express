import { prisma } from "./db/prisma";

async function main() {
  // Create a sample user first (required for product createdBy/updatedBy)
  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Vendor User",
      email: "vendor@example.com",
    },
  });
  console.log("User:", user);

  // Create departments
  const departmentsData = [
    {
      name: "Clothing",
      slug: "clothing",
      metaTitle: "Clothing Department",
      metaDescription: "Fashion and apparel",
      active: true,
    },
    {
      name: "Home & Garden",
      slug: "home-garden",
      metaTitle: "Home & Garden Department",
      metaDescription: "Home improvement and gardening supplies",
      active: true,
    },
  ];

  const departments = [];
  for (const deptData of departmentsData) {
    const dept = await prisma.department.upsert({
      where: { slug: deptData.slug },
      update: {},
      create: deptData,
    });
    departments.push(dept);
    console.log("Created department:", dept.name);
  }

  // Create categories
  const categoriesData = [
    { name: "Laptops", departmentSlug: "electronics" },
    { name: "TVs", departmentSlug: "electronics" },
    { name: "Headphones", departmentSlug: "electronics" },
    { name: "Cameras", departmentSlug: "electronics" },
    { name: "Shirts", departmentSlug: "clothing" },
    { name: "Pants", departmentSlug: "clothing" },
    { name: "Furniture", departmentSlug: "home-garden" },
    { name: "Appliances", departmentSlug: "home-garden" },
    { name: "Gardening Tools", departmentSlug: "home-garden" },
  ];

  const categories = [];
  for (const catData of categoriesData) {
    const dept = departments.find(d => d.slug === catData.departmentSlug);
    if (!dept) continue;
    let cat = await prisma.category.findFirst({
      where: { name: catData.name, departmentId: dept.id },
    });
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          name: catData.name,
          departmentId: dept.id,
          active: true,
        },
      });
    }
    categories.push(cat);
    console.log("Category:", cat.name);
  }

  // Create products
  const productsData = [
    {
      name: "iPhone 15",
      slug: "iphone-15",
      description: "Latest iPhone model with advanced features",
      categoryName: "Smartphones",
      price: 999.99,
      quantity: 50,
    },
    {
      name: "Samsung Galaxy S24",
      slug: "samsung-galaxy-s24",
      description: "High-end Android smartphone",
      categoryName: "Smartphones",
      price: 899.99,
      quantity: 30,
    },
    {
      name: "MacBook Pro 16\"",
      slug: "macbook-pro-16",
      description: "Powerful laptop for professionals",
      categoryName: "Laptops",
      price: 2499.99,
      quantity: 20,
    },
    {
      name: "Dell XPS 13",
      slug: "dell-xps-13",
      description: "Ultra-portable laptop",
      categoryName: "Laptops",
      price: 1299.99,
      quantity: 25,
    },
    {
      name: "Sony 65\" OLED TV",
      slug: "sony-65-oled-tv",
      description: "Stunning 4K OLED television",
      categoryName: "TVs",
      price: 1999.99,
      quantity: 15,
    },
    {
      name: "LG 55\" LED TV",
      slug: "lg-55-led-tv",
      description: "Affordable 4K LED TV",
      categoryName: "TVs",
      price: 699.99,
      quantity: 40,
    },
    {
      name: "Sony WH-1000XM5",
      slug: "sony-wh-1000xm5",
      description: "Noise-cancelling wireless headphones",
      categoryName: "Headphones",
      price: 349.99,
      quantity: 60,
    },
    {
      name: "AirPods Pro",
      slug: "airpods-pro",
      description: "Apple's premium wireless earbuds",
      categoryName: "Headphones",
      price: 249.99,
      quantity: 80,
    },
    {
      name: "Canon EOS R5",
      slug: "canon-eos-r5",
      description: "Professional mirrorless camera",
      categoryName: "Cameras",
      price: 3899.99,
      quantity: 10,
    },
    {
      name: "Nikon Z6 II",
      slug: "nikon-z6-ii",
      description: "Versatile full-frame camera",
      categoryName: "Cameras",
      price: 1999.99,
      quantity: 12,
    },
    {
      name: "Cotton T-Shirt",
      slug: "cotton-t-shirt",
      description: "Comfortable cotton t-shirt",
      categoryName: "Shirts",
      price: 19.99,
      quantity: 100,
    },
  ];

  for (const prodData of productsData) {
    const cat = categories.find(c => c.name === prodData.categoryName);
    if (!cat) continue;
    const dept = departments.find(d => d.id === cat.departmentId);
    if (!dept) continue;
    let product = await prisma.product.findFirst({
      where: { slug: prodData.slug },
    });
    if (!product) {
      product = await prisma.product.create({
        data: {
          name: prodData.name,
          slug: prodData.slug,
          description: prodData.description,
          departmentId: dept.id,
          categoryId: cat.id,
          status: "active",
          price: prodData.price,
          quantity: prodData.quantity,
          metaTitle: `Buy ${prodData.name}`,
          metaDescription: `Get the ${prodData.name} now`,
          hasVariations: false,
          createdBy: user.id,
          updatedBy: user.id,
        },
      });
    }
    console.log("Product:", product.name);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });