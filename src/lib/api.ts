/** One thin typed function per endpoint. No React in this file. */
import { http, uploadFile } from './http';
import type {
  AdminOrderDetailDTO,
  AdminOrderSummaryDTO,
  AdminProductDetailDTO,
  AdminProductSummaryDTO,
  AdminStatsDTO,
  CartItemInput,
  CartValidateResponse,
  CategoryDTO,
  CreateCheckoutSessionResponse,
  ImageDTO,
  OrderConfirmationResponse,
  OrderUpdateInput,
  ProductDetailDTO,
  ProductListQuery,
  ProductListResponse,
  ProductSummaryDTO,
  ProductUpsertInput,
  StockUpdateInput,
  StoreSettingsDTO,
  VariantUpsertInput,
  AdminCategoryDTO,
  CustomerOrderDetailDTO,
  CustomerOrderSummaryDTO,
  CustomerProfile,
  MessagesResponse,
  ProfilePatch,
  RegisterBody,
  ShippingInput,
} from '@contracts/index';

/* ---------- public catalog ---------- */

export const getCategories = () =>
  http<{ categories: CategoryDTO[] }>('/categories').then((r) => r.categories);

export const getProducts = (q: ProductListQuery = {}) => {
  const params = new URLSearchParams();
  if (q.category) params.set('category', q.category);
  if (q.featured) params.set('featured', 'true');
  if (q.q) params.set('q', q.q);
  if (q.sort) params.set('sort', q.sort);
  if (q.limit) params.set('limit', String(q.limit));
  if (q.offset) params.set('offset', String(q.offset));
  const qs = params.toString();
  return http<ProductListResponse>(`/products${qs ? `?${qs}` : ''}`);
};

export const getProduct = (slug: string) =>
  http<{ product: ProductDetailDTO }>(`/products/${slug}`).then((r) => r.product);

export const getRelatedProducts = (slug: string, limit = 4) =>
  http<{ products: ProductSummaryDTO[] }>(`/products/${slug}/related?limit=${limit}`).then(
    (r) => r.products,
  );

export const getSettings = () => http<StoreSettingsDTO>('/settings');

/* ---------- cart / checkout ---------- */

export const validateCart = (items: CartItemInput[]) =>
  http<CartValidateResponse>('/cart/validate', { method: 'POST', body: { items } });

export const createCheckoutSession = (
  items: CartItemInput[],
  shipping: ShippingInput,
  saveAsDefault = false,
) =>
  http<CreateCheckoutSessionResponse>('/checkout/session', {
    method: 'POST',
    body: { items, shipping, saveAsDefault },
  });

/* ---------- customer auth + account ---------- */

export const customerRegister = (body: RegisterBody) =>
  http<{ customer: CustomerProfile }>('/auth/register', { method: 'POST', body }).then(
    (r) => r.customer,
  );

export const customerLogin = (email: string, password: string) =>
  http<{ customer: CustomerProfile }>('/auth/login', {
    method: 'POST',
    body: { email, password },
  }).then((r) => r.customer);

export const customerLogout = () => http<{ ok: boolean }>('/auth/logout', { method: 'POST' });

export const customerMe = () =>
  http<{ customer: CustomerProfile }>('/auth/me').then((r) => r.customer);

export const customerUpdateProfile = (patch: ProfilePatch) =>
  http<{ customer: CustomerProfile }>('/auth/profile', { method: 'PATCH', body: patch }).then(
    (r) => r.customer,
  );

export const accountOrders = () =>
  http<{ orders: CustomerOrderSummaryDTO[] }>('/account/orders').then((r) => r.orders);

export const accountOrder = (id: string) =>
  http<{ order: CustomerOrderDetailDTO }>(`/account/orders/${id}`).then((r) => r.order);

export const confirmDelivery = (orderId: string) =>
  http<{ ok: boolean }>(`/account/orders/${orderId}/confirm-delivery`, { method: 'POST' });

export const accountMessages = () => http<MessagesResponse>('/account/messages');

export const markMessagesRead = () =>
  http<{ ok: boolean }>('/account/messages/read', { method: 'POST' });

export const adminUpdateStage = (orderId: string, stage: string, note?: string) =>
  http<{ ok: boolean }>(`/admin/orders/${orderId}/stage`, {
    method: 'PATCH',
    body: note ? { stage, note } : { stage },
  });

export const getOrderConfirmation = (sessionId: string) =>
  http<OrderConfirmationResponse>(`/checkout/session/${sessionId}`);

export const mockPay = (sessionId: string, name?: string, email?: string) =>
  http<{ ok: boolean }>('/checkout/mock-pay', {
    method: 'POST',
    body: { sessionId, ...(name ? { name } : {}), ...(email ? { email } : {}) },
  });

/* ---------- admin ----------
 * No separate admin login: admins sign in at /auth/login like everyone else,
 * and these endpoints require the session's role to be 'admin'. */

export const adminStats = () => http<AdminStatsDTO>('/admin/stats');

export const adminListCategories = () =>
  http<{ categories: AdminCategoryDTO[] }>('/admin/categories').then((r) => r.categories);

export const adminListProducts = (q: { status?: string; q?: string } = {}) => {
  const params = new URLSearchParams();
  if (q.status) params.set('status', q.status);
  if (q.q) params.set('q', q.q);
  const qs = params.toString();
  return http<{ products: AdminProductSummaryDTO[]; total: number }>(
    `/admin/products${qs ? `?${qs}` : ''}`,
  );
};

export const adminGetProduct = (id: string) =>
  http<{ product: AdminProductDetailDTO }>(`/admin/products/${id}`).then((r) => r.product);

export const adminCreateProduct = (input: ProductUpsertInput) =>
  http<{ product: AdminProductDetailDTO }>('/admin/products', {
    method: 'POST',
    body: input,
  }).then((r) => r.product);

export const adminUpdateProduct = (id: string, patch: Partial<ProductUpsertInput>) =>
  http<{ product: AdminProductDetailDTO }>(`/admin/products/${id}`, {
    method: 'PATCH',
    body: patch,
  }).then((r) => r.product);

export const adminArchiveProduct = (id: string) =>
  http<void>(`/admin/products/${id}`, { method: 'DELETE' });

export const adminCreateVariant = (productId: string, input: VariantUpsertInput) =>
  http<{ product: AdminProductDetailDTO }>(`/admin/products/${productId}/variants`, {
    method: 'POST',
    body: input,
  }).then((r) => r.product);

export const adminUpdateVariant = (variantId: string, patch: Partial<VariantUpsertInput>) =>
  http<{ ok: boolean }>(`/admin/variants/${variantId}`, { method: 'PATCH', body: patch });

export const adminUpdateStock = (variantId: string, input: StockUpdateInput) =>
  http<{ ok: boolean }>(`/admin/variants/${variantId}/stock`, {
    method: 'PATCH',
    body: input,
  });

export const adminDeleteVariant = (variantId: string) =>
  http<void>(`/admin/variants/${variantId}`, { method: 'DELETE' });

export const adminUploadImage = (
  productId: string,
  file: File,
  opts: { altText?: string; variantId?: string; isPrimary?: boolean } = {},
  onProgress?: (fraction: number) => void,
) => {
  const form = new FormData();
  form.append('file', file);
  if (opts.altText) form.append('altText', opts.altText);
  if (opts.variantId) form.append('variantId', opts.variantId);
  if (opts.isPrimary) form.append('isPrimary', 'true');
  return uploadFile<{ image: ImageDTO }>(`/admin/products/${productId}/images`, form, onProgress)
    .then((r) => r.image);
};

export const adminPatchImage = (
  imageId: string,
  patch: { altText?: string | null; isPrimary?: boolean; variantId?: string | null; displayOrder?: number },
) => http<{ image: ImageDTO }>(`/admin/images/${imageId}`, { method: 'PATCH', body: patch });

export const adminDeleteImage = (imageId: string) =>
  http<void>(`/admin/images/${imageId}`, { method: 'DELETE' });

export const adminListOrders = (q: { status?: string; q?: string } = {}) => {
  const params = new URLSearchParams();
  if (q.status) params.set('status', q.status);
  if (q.q) params.set('q', q.q);
  const qs = params.toString();
  return http<{ orders: AdminOrderSummaryDTO[]; total: number }>(
    `/admin/orders${qs ? `?${qs}` : ''}`,
  );
};

export const adminGetOrder = (id: string) =>
  http<{ order: AdminOrderDetailDTO }>(`/admin/orders/${id}`).then((r) => r.order);

export const adminUpdateOrder = (id: string, patch: OrderUpdateInput) =>
  http<{ ok: boolean }>(`/admin/orders/${id}`, { method: 'PATCH', body: patch });
