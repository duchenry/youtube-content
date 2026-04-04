// Hàm tiện ích dùng chung — textToSlug: chuyển text thành URL-friendly slug
export function textToSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}