import { normalizeProductName } from "@/lib/memberships/normalizers";
import type {
  DkimReceiptVerification,
  MembershipProductConfig,
  ProductMatch,
} from "@/lib/memberships/types";

export class MembershipProductMatcher {
  match(
    verification: DkimReceiptVerification,
    products: MembershipProductConfig[],
  ): ProductMatch[] {
    const normalizedItems = verification.itemNames.map((itemName) => ({
      itemName,
      normalized: normalizeProductName(itemName),
    }));

    const matches: ProductMatch[] = [];
    for (const product of products) {
      const normalizedProductName = normalizeProductName(
        product.product_name,
      );

      if (!normalizedProductName) continue;
      const itemMatch = normalizedItems.find(
        (item) => item.normalized === normalizedProductName,
      );
      if (itemMatch) {
        matches.push({
          clubId: product.club_id,
          productId: product.id,
        });
      }
    }

    return matches;
  }
}
