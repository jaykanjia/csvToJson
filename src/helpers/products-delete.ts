import fs from "fs";
import { outputDirPath } from "../utils/constants";
import path from "path";
import { BACKEND_URL } from "./constants";
import getAuthToken from "./getAuthToken";
import { generateSlug } from "../utils/generateSlug";

let access_token = "";

const defaultProducts = [
	"prod_01JGXEE8J5WTM95H13HYEBRYQS",
	"prod_01JGXEE8J60AMM626J25WN310D",
	"prod_01JGXEE8J6C5P99TPND4FXDCFY",
	"prod_01JGXEE8J6Y4Q42N540VG7Z7D2",
	"prod_01JKFCW2NXHFG8DP6P8E2T0A6V",
	"prod_01JKFFVQQ1XG8NJGWBJJ15W8D5",
	"prod_01JMC4X9C7NYRRXMAVTBK7M5G7",
	"prod_01JKWRSRPWZN2HFFPT9WGVD7M1",
];

const deleteProduct = async (id: string) => {
	try {
		const res = await fetch(`${BACKEND_URL}/admin/products/${id}`, {
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

const getProducts = async () => {
	try {
		const res = await fetch(`${BACKEND_URL}/admin/products?limit=1000`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${access_token}`,
			},
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

		const { products, ...rest } = await getProducts();

		console.log({ rest });

		console.log(
			products
				.map((p: any) => p.id)
				.filter((x: string) => (defaultProducts.includes(x) ? false : true))
		);

		const res = await Promise.all(
			products
				.map((p: any) => p.id)
				.filter((x: string) => (defaultProducts.includes(x) ? false : true))
				.map((x: string) => deleteProduct(x))
		);
	} catch (error) {
		console.error("error", error);
	}
};

main();
