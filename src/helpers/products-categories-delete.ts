import { BACKEND_URL } from "./constants";
import getAuthToken from "./getAuthToken";

let access_token = "";

const deleteProductCategories = async (id: string) => {
	try {
		const res = await fetch(`${BACKEND_URL}/admin/product-categories/${id}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${access_token}`,
			},
		});

		const json = await res.json();
		return json;
	} catch (error) {
		console.log(error);

		throw new Error(`error deleteProduct, ${id}`);
	}
};

const getProductCategories = async () => {
	try {
		const res = await fetch(
			`${BACKEND_URL}/admin/product-categories?limit=1000`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${access_token}`,
				},
			}
		);

		const json = await res.json();
		return json;
	} catch (error) {
		throw new Error("error addCategory");
	}
};

const main = async () => {
	try {
		access_token = await getAuthToken();

		const { product_categories, ...rest } = await getProductCategories();

		console.log({ rest });

		console.log(
			product_categories
				.map((p: any) => p.id)
				.filter((x: string) => (product_categories.includes(x) ? false : true))
		);

		const res = await Promise.all(
			product_categories.map((p: any) => deleteProductCategories(p.id))
		);
	} catch (error) {
		console.error("error", error);
	}
};

main();
