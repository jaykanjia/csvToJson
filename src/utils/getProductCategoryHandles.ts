import { generateSlug } from "./generateSlug";

const getProductCategoryHandles = (categories: string) => {
	const category = categories
		.split(",")
		.map((x) =>
			x
				.trim()
				.split(">")
				.map((x) =>
					x
						.trim()
						.split(">")
						.map((x) => x.trim())
				)
		)
		.flatMap((x) => x);
	return [...new Set(category.flat())].map((x) => generateSlug(x)).join(",");
};

export default getProductCategoryHandles;
