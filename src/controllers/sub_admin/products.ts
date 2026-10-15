import { Request, Response } from "express";
import {
  products,
  productValues,
  categories,
  brands,
  discounts,
  flashDiscounts,
  taxes,
  warranties,
} from "../../models/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getLocalizedText } from "../../utils/localization";
import { uploadImage, updateImage, deleteImage } from "../../services/imageService";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";
import { randomUUID } from "crypto";

// 1. Get All Products with Localized Relations & Variants (Paginated)
export async function getAllProducts(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(products);
  const total = Number(countResult?.total || 0);

  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      category_id: products.category_id,
      category_name: categories.name,
      sub_category_id: products.sub_category_id,
      brand_id: products.brand_id,
      brand_name: brands.name,
      discount_id: products.discount_id,
      discount_name: discounts.name,
      flash_discount_id: products.flash_discount_id,
      flash_discount_name: flashDiscounts.name,
      tax_id: products.tax_id,
      tax_name: taxes.name,
      warrantly_id: products.warrantly_id,
      warranty_text: warranties.text,
      warrantly_note: products.warrantly_note,
      today_deal: products.today_deal,
      free_shipping: products.free_shipping,
      shipping_days: products.shipping_days,
      image: products.image,
      gallery: products.gallery,
      published: products.published,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .leftJoin(brands, eq(products.brand_id, brands.id))
    .leftJoin(discounts, eq(products.discount_id, discounts.id))
    .leftJoin(flashDiscounts, eq(products.flash_discount_id, flashDiscounts.id))
    .leftJoin(taxes, eq(products.tax_id, taxes.id))
    .leftJoin(warranties, eq(products.warrantly_id, warranties.id))
    .limit(limit)
    .offset(offset);

  // Fetch all variants for these products
  const productIds = allProducts.map((p) => p.id);
  const allVariants =
    productIds.length > 0
      ? await db.select().from(productValues).where(inArray(productValues.product_id, productIds))
      : [];

  const formatted = allProducts.map((p) => {
    const variants = allVariants.filter((v) => v.product_id === p.id);
    return {
      id: p.id,
      name: getLocalizedText(p.name, lang),
      names: p.name,
      description: getLocalizedText(p.description, lang),
      descriptions: p.description,
      category: p.category_id
        ? { id: p.category_id, name: getLocalizedText(p.category_name, lang) }
        : null,
      sub_category: p.sub_category_id ? { id: p.sub_category_id } : null,
      brand: p.brand_id ? { id: p.brand_id, name: p.brand_name || "" } : null,
      discount: p.discount_id
        ? { id: p.discount_id, name: getLocalizedText(p.discount_name, lang) }
        : null,
      flash_discount: p.flash_discount_id
        ? { id: p.flash_discount_id, name: getLocalizedText(p.flash_discount_name, lang) }
        : null,
      tax: p.tax_id ? { id: p.tax_id, name: getLocalizedText(p.tax_name, lang) } : null,
      warranty: p.warrantly_id
        ? { id: p.warrantly_id, name: getLocalizedText(p.warranty_text, lang) }
        : null,
      warrantly_note: p.warrantly_note,
      today_deal: p.today_deal,
      free_shipping: p.free_shipping,
      shipping_days: p.shipping_days,
      image: p.image,
      gallery: p.gallery || [],
      published: p.published,
      variants,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });

  return SuccessResponse(
    res,
    {
      products: formatted,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

// 2. Relational Lists Endpoint for Creating / Editing Products
export async function getProductLists(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;

  // Categories
  const categoriesRaw = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories);
  const categoriesList = categoriesRaw.map((c) => ({
    id: c.id,
    name: getLocalizedText(c.name, lang),
  }));

  // Brands
  const brandsList = await db
    .select({ id: brands.id, name: brands.name })
    .from(brands);

  // Discounts
  const discountsRaw = await db
    .select({ id: discounts.id, name: discounts.name })
    .from(discounts)
    .where(eq(discounts.status, true));
  const discountsList = discountsRaw.map((d) => ({
    id: d.id,
    name: getLocalizedText(d.name, lang),
  }));

  // Flash Discounts
  const flashDiscountsRaw = await db
    .select({ id: flashDiscounts.id, name: flashDiscounts.name })
    .from(flashDiscounts)
    .where(eq(flashDiscounts.status, true));
  const flashDiscountsList = flashDiscountsRaw.map((fd) => ({
    id: fd.id,
    name: getLocalizedText(fd.name, lang),
  }));

  // Taxes
  const taxesRaw = await db
    .select({ id: taxes.id, name: taxes.name })
    .from(taxes)
    .where(eq(taxes.status, true));
  const taxesList = taxesRaw.map((t) => ({
    id: t.id,
    name: getLocalizedText(t.name, lang),
  }));

  // Warranties
  const warrantiesRaw = await db
    .select({ id: warranties.id, text: warranties.text })
    .from(warranties);
  const warrantiesList = warrantiesRaw.map((w) => ({
    id: w.id,
    name: getLocalizedText(w.text, lang),
  }));

  return SuccessResponse(
    res,
    {
      categories: categoriesList,
      brands: brandsList,
      discounts: discountsList,
      flash_discounts: flashDiscountsList,
      taxes: taxesList,
      warranties: warrantiesList,
    },
    200
  );
}

// 2.1 Selection List Endpoint for Products themselves
export async function getProductsSelection(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;

  const list = await db
    .select({
      id: products.id,
      name: products.name,
    })
    .from(products)
    .where(eq(products.published, true));

  const formatted = list.map((p) => ({
    id: p.id,
    name: getLocalizedText(p.name, lang),
  }));

  return SuccessResponse(res, { products: formatted }, 200);
}

// 3. Get Product By ID
export async function getProductById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const lang = req.query.lang as string | undefined;

  const row = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      category_id: products.category_id,
      category_name: categories.name,
      sub_category_id: products.sub_category_id,
      brand_id: products.brand_id,
      brand_name: brands.name,
      discount_id: products.discount_id,
      discount_name: discounts.name,
      flash_discount_id: products.flash_discount_id,
      flash_discount_name: flashDiscounts.name,
      tax_id: products.tax_id,
      tax_name: taxes.name,
      warrantly_id: products.warrantly_id,
      warranty_text: warranties.text,
      warrantly_note: products.warrantly_note,
      today_deal: products.today_deal,
      free_shipping: products.free_shipping,
      shipping_days: products.shipping_days,
      image: products.image,
      gallery: products.gallery,
      published: products.published,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .leftJoin(brands, eq(products.brand_id, brands.id))
    .leftJoin(discounts, eq(products.discount_id, discounts.id))
    .leftJoin(flashDiscounts, eq(products.flash_discount_id, flashDiscounts.id))
    .leftJoin(taxes, eq(products.tax_id, taxes.id))
    .leftJoin(warranties, eq(products.warrantly_id, warranties.id))
    .where(eq(products.id, id))
    .limit(1);

  if (!row[0]) throw new NotFound("Product not found");

  const variants = await db
    .select()
    .from(productValues)
    .where(eq(productValues.product_id, id));

  const p = row[0];
  const product = {
    id: p.id,
    name: getLocalizedText(p.name, lang),
    names: p.name,
    description: getLocalizedText(p.description, lang),
    descriptions: p.description,
    category: p.category_id
      ? { id: p.category_id, name: getLocalizedText(p.category_name, lang) }
      : null,
    sub_category: p.sub_category_id ? { id: p.sub_category_id } : null,
    brand: p.brand_id ? { id: p.brand_id, name: p.brand_name || "" } : null,
    discount: p.discount_id
      ? { id: p.discount_id, name: getLocalizedText(p.discount_name, lang) }
      : null,
    flash_discount: p.flash_discount_id
      ? { id: p.flash_discount_id, name: getLocalizedText(p.flash_discount_name, lang) }
      : null,
    tax: p.tax_id ? { id: p.tax_id, name: getLocalizedText(p.tax_name, lang) } : null,
    warranty: p.warrantly_id
      ? { id: p.warrantly_id, name: getLocalizedText(p.warranty_text, lang) }
      : null,
    warrantly_note: p.warrantly_note,
    today_deal: p.today_deal,
    free_shipping: p.free_shipping,
    shipping_days: p.shipping_days,
    image: p.image,
    gallery: p.gallery || [],
    published: p.published,
    variants,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };

  return SuccessResponse(res, { product }, 200);
}

// 4. Create Product with Images, Gallery, and Variants
export async function createProduct(req: Request, res: Response) {
  const db = req.db;
  const {
    name,
    description,
    category_id,
    sub_category_id,
    brand_id,
    discount_id,
    flash_discount_id,
    tax_id,
    warrantly_id,
    warrantly_note,
    today_deal,
    free_shipping,
    shipping_days,
    published,
    image,
    gallery,
    product_values,
  } = req.body;

  // Validate Category
  const catExists = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, category_id)).limit(1);
  if (!catExists[0]) throw new NotFound("Category not found");

  // 1. Upload Main Image
  const mainImageUrl = await uploadImage(req, image, "uploads");

  // 2. Upload Gallery Images
  let galleryUrls: string[] = [];
  if (Array.isArray(gallery) && gallery.length > 0) {
    galleryUrls = await Promise.all(
      gallery.map(async (img: string) => {
        if (img.startsWith("http")) return img;
        return await uploadImage(req, img, "uploads");
      })
    );
  }

  const productId = randomUUID();

  // 3. Insert Product
  await db.insert(products).values({
    id: productId,
    name,
    description: description ?? null,
    category_id,
    sub_category_id: sub_category_id ?? null,
    brand_id: brand_id ?? null,
    discount_id: discount_id ?? null,
    flash_discount_id: flash_discount_id ?? null,
    tax_id: tax_id ?? null,
    warrantly_id: warrantly_id ?? null,
    warrantly_note: warrantly_note ?? null,
    today_deal: today_deal ?? false,
    free_shipping: free_shipping ?? false,
    shipping_days: shipping_days ?? 0,
    published: published ?? true,
    image: mainImageUrl,
    gallery: galleryUrls,
  });

  // 4. Insert Variants (productValues)
  if (Array.isArray(product_values) && product_values.length > 0) {
    for (const v of product_values) {
      let variantImageUrl: string | null = null;
      if (v.image) {
        variantImageUrl = v.image.startsWith("http")
          ? v.image
          : await uploadImage(req, v.image, "uploads");
      }

      await db.insert(productValues).values({
        product_id: productId,
        value_ids: v.value_ids,
        sku: v.sku ?? null,
        quantity: v.quantity !== undefined ? Number(v.quantity) : 1,
        price: v.price !== undefined ? String(v.price) : "0.00",
        image: variantImageUrl,
      });
    }
  }

  return SuccessResponse(res, { message: "Product created successfully", id: productId }, 201);
}

// 5. Update Product with Images, Gallery, and Variants
export async function updateProduct(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const {
    name,
    description,
    category_id,
    sub_category_id,
    brand_id,
    discount_id,
    flash_discount_id,
    tax_id,
    warrantly_id,
    warrantly_note,
    today_deal,
    free_shipping,
    shipping_days,
    published,
    image,
    gallery,
    product_values,
  } = req.body;

  const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Product not found");

  const updateData: Partial<typeof products.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (category_id !== undefined) updateData.category_id = category_id;
  if (sub_category_id !== undefined) updateData.sub_category_id = sub_category_id;
  if (brand_id !== undefined) updateData.brand_id = brand_id;
  if (discount_id !== undefined) updateData.discount_id = discount_id;
  if (flash_discount_id !== undefined) updateData.flash_discount_id = flash_discount_id;
  if (tax_id !== undefined) updateData.tax_id = tax_id;
  if (warrantly_id !== undefined) updateData.warrantly_id = warrantly_id;
  if (warrantly_note !== undefined) updateData.warrantly_note = warrantly_note;
  if (today_deal !== undefined) updateData.today_deal = today_deal;
  if (free_shipping !== undefined) updateData.free_shipping = free_shipping;
  if (shipping_days !== undefined) updateData.shipping_days = shipping_days;
  if (published !== undefined) updateData.published = published;

  // 1. Update Main Image if provided
  if (image !== undefined && image !== existing[0].image) {
    if (image.startsWith("http")) {
      updateData.image = image;
    } else {
      updateData.image = await updateImage(req, image, "uploads", existing[0].image);
    }
  }

  // 2. Update Gallery if provided
  if (gallery !== undefined) {
    const oldGallery: string[] = (existing[0].gallery as string[]) || [];
    const newGalleryList = Array.isArray(gallery) ? gallery : [];

    // Delete photos removed from old gallery
    for (const oldUrl of oldGallery) {
      if (!newGalleryList.includes(oldUrl)) {
        await deleteImage(oldUrl);
      }
    }

    // Upload any new base64 photos in new gallery
    const resolvedGalleryUrls = await Promise.all(
      newGalleryList.map(async (img: string) => {
        if (img.startsWith("http")) return img;
        return await uploadImage(req, img, "uploads");
      })
    );

    updateData.gallery = resolvedGalleryUrls;
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(products).set(updateData).where(eq(products.id, id));
  }

  // 3. Update Variants if provided
  if (Array.isArray(product_values)) {
    const oldVariants = await db
      .select()
      .from(productValues)
      .where(eq(productValues.product_id, id));

    // Delete old variant images that are not retained
    const keepImageUrls = product_values
      .map((v) => v.image)
      .filter((img) => img && img.startsWith("http"));

    for (const oldV of oldVariants) {
      if (oldV.image && !keepImageUrls.includes(oldV.image)) {
        await deleteImage(oldV.image);
      }
    }

    // Clear existing variants and insert updated list
    await db.delete(productValues).where(eq(productValues.product_id, id));

    for (const v of product_values) {
      let variantImageUrl: string | null = null;
      if (v.image) {
        variantImageUrl = v.image.startsWith("http")
          ? v.image
          : await uploadImage(req, v.image, "uploads");
      }

      await db.insert(productValues).values({
        product_id: id,
        value_ids: v.value_ids,
        sku: v.sku ?? null,
        quantity: v.quantity !== undefined ? Number(v.quantity) : 1,
        price: v.price !== undefined ? String(v.price) : "0.00",
        image: variantImageUrl,
      });
    }
  }

  return SuccessResponse(res, { message: "Product updated successfully" }, 200);
}

// 6. Delete Product and its Images, Gallery, and Variants
export async function deleteProduct(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Product not found");

  // 1. Delete Main Image
  if (existing[0].image) {
    await deleteImage(existing[0].image);
  }

  // 2. Delete Gallery Images
  const galleryUrls = (existing[0].gallery as string[]) || [];
  for (const url of galleryUrls) {
    await deleteImage(url);
  }

  // 3. Delete Variant Images
  const variants = await db
    .select()
    .from(productValues)
    .where(eq(productValues.product_id, id));

  for (const v of variants) {
    if (v.image) {
      await deleteImage(v.image);
    }
  }

  // 4. Delete Variants and Product Record
  await db.delete(productValues).where(eq(productValues.product_id, id));
  await db.delete(products).where(eq(products.id, id));

  return SuccessResponse(res, { message: "Product deleted successfully" }, 200);
}

export async function bulkDeleteProducts(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(products).where(inArray(products.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching products found", deletedCount: 0 }, 200);
  }

  // 1. Delete all images across all matching products
  for (const item of existing) {
    if (item.image) {
      await deleteImage(item.image);
    }
    const galleryUrls = (item.gallery as string[]) || [];
    for (const url of galleryUrls) {
      await deleteImage(url);
    }
  }

  // 2. Delete all variant images
  const variants = await db
    .select()
    .from(productValues)
    .where(inArray(productValues.product_id, ids));

  for (const v of variants) {
    if (v.image) {
      await deleteImage(v.image);
    }
  }

  // 3. Delete records
  await db.delete(productValues).where(inArray(productValues.product_id, ids));
  await db.delete(products).where(inArray(products.id, ids));

  return SuccessResponse(
    res,
    {
      message: `${existing.length} product(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}
