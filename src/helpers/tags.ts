import { BACKEND_URL } from "./constants";
import getAuthToken from "./getAuthToken";
import * as fs from "fs";

const addTags = async (tag: { value: string }, access_token: string) => {
	try {
		const requestOptions = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${access_token}`,
			},
			body: JSON.stringify({
				value: tag.value.toString(),
				metadata: {},
			}),
		};

		const res = await fetch(
			`${BACKEND_URL}/admin/product-tags`,
			requestOptions
		);
		const json = await res.json();
		return json;
	} catch (error) {
		console.error("addTags", tag.value, error);
	}
};

export const createTags = async () => {
	try {
		const access_token = await getAuthToken();
		const tags = fs.readFileSync("./data/output/tags.json", "utf8");

		const tagsArray = JSON.parse(tags);
		for (const tag of tagsArray) {
			await addTags(tag, access_token);
		}
	} catch (error) {
		console.error("createTags", error);
	}
};

createTags();
