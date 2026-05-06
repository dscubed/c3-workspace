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
    const body = normalizeProductName(verification.textBody);
    const normalizedItems = verification.itemNames.map((itemName) => ({
      itemName,
      normalized: normalizeProductName(itemName),
    }));

    const matches: ProductMatch[] = [];
    for (const product of products) {
      const normalizedProductName = normalizeProductName(
        product.product_name,
      );

      const itemMatch = normalizedItems.find(
        (item) => item.normalized === normalizedProductName,
      );
      if (itemMatch) {
        matches.push({
          clubId: product.club_id,
          productName: product.product_name,
          matchedItemName: itemMatch.itemName,
        });
        continue;
      }

      if (body.includes(normalizedProductName)) {
        matches.push({
          clubId: product.club_id,
          productName: product.product_name,
          matchedItemName: product.product_name,
        });
      }
    }

    return matches;
  }
}
