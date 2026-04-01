export type CartItem = {
  carpetId: string;
  name: string;
  price: number;
  originalPrice?: number;
  productDiscountPercent?: number;
  image?: string;
  size?: string;
  material?: string;
  quantity: number;
};
