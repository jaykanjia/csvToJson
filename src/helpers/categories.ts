import fs from "fs";
import { outputDirPath } from "../utils/constants";
import path from "path";
import { BACKEND_URL } from "./constants";
import getAuthToken from "./getAuthToken";
import { generateSlug } from "../utils/generateSlug";

let access_token = "";

const addCategory = async (value: string, parent_category_id?: string) => {
	try {
		const res = await fetch(`${BACKEND_URL}/admin/product-categories`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${access_token}`,
			},
			body: JSON.stringify({
				name: value,
				handle: generateSlug(value),
				is_active: true,
				parent_category_id,
				metadata: {},
			}),
		});

		const json = await res.json();
		return json;
	} catch (error) {
		throw new Error("error addCategory");
	}
};

const main = async () => {
	try {
		access_token = await getAuthToken();
		const categoryData: {
			[key: string]: { [key: string]: { [key: string]: {} } };
		} = JSON.parse(
			fs.readFileSync(path.join(outputDirPath, "categories.json"), "utf8")
		);

		for (const [key, value] of Object.entries(categoryData)) {
			const { product_category: parentCategory } = await addCategory(key);

			if (Object.keys(value).length > 0) {
				for (const [c_key, cv] of Object.entries(value)) {
					console.log("c_key", c_key);
					const { product_category: childCategory } = await addCategory(
						c_key,
						parentCategory?.id
					);

					if (Object.keys(cv).length > 0) {
						for (const [c_c_key, ccv] of Object.entries(cv)) {
							console.log("c_c_key", c_c_key);
							const { product_category: childChildCategory } =
								await addCategory(c_c_key, childCategory?.id);
						}
					}
				}
			}
		}
	} catch (error) {
		console.error("error", error);
	}
};

main();
