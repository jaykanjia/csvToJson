import path from "path";
import * as fs from "fs";
import { convertCsvToJson } from "./utils/csv-to-json";
import { ProductCSV, ProductJSON } from "./types";
import { convertJsonToCsv } from "./utils/jsontocsv";
import { generateSlug } from "./utils/generateSlug";
import {
	inputFileName,
	outputDirPath,
	inputDirPath,
	encoding,
} from "./utils/constants";
import getProductCategoryHandles from "./utils/getProductCategoryHandles";

const outputFileName: string[] = [];

const errors: string[] = [];
const success: string[] = [];

const defaults = {
	sales_channel: "sc_01JN33PVTPSKHE8SDH67NC1C53",
	originCountry: "BR",
	status: "published",
};

const csvToJson = (fileName: string) => {
	try {
		// read csv file
		const csvData = fs.readFileSync(
			path.join(inputDirPath, fileName),
			encoding
		);
		// convert csv to json
		const csvProducts = convertCsvToJson(csvData);
		// write json file
		fs.writeFileSync(
			path.join(outputDirPath, fileName.replace(".csv", ".json")),
			JSON.stringify(csvProducts, null, 2)
		);

		console.log("CSV successfully converted to JSON!");

		success.push(`Successfully converted CSV to JSON: ${fileName}`);

		outputFileName.push(fileName.replace(".csv", ".json"));
	} catch (error) {
		console.error("Error converting CSV to JSON:", error);
		errors.push(`Error converting CSV to JSON: ${fileName}`);
	}
};

const jsonToCsv = (fileName: string) => {
	// initialize variables
	// for storing product map to combine variants into the same parent product
	// storing the indexes of the products
	// for storing medusa products data for final csv
	const medusaProducts: ProductCSV[] = [];

	const productMap: {
		[key: string]: {
			handle: string[];
			parent: any[];
			children: any[];
		};
	} = {};

	try {
		// read json file
		const wcProductData: ProductJSON[] = JSON.parse(
			fs.readFileSync(path.join(outputDirPath, fileName), encoding)
		);

		for (let i = 0; i < wcProductData.length; i++) {
			const wcProduct = wcProductData[i];

			// convertedProducts.push({
			// 	"Product Handle": wcProduct["Meta: product_title_in_category_page"],
			// 	"Product Title": wcProduct["Name"],
			// 	"Product Subtitle": wcProduct["Short description"],
			// 	"Product Description": wcProduct["Description"],
			// 	"Product Status": "published",
			// 	"Product Thumbnail": "",
			// 	"Product Weight": (wcProduct["Weight (kg)"] * 100).toString(),
			// 	"Product Length": (wcProduct["Length (cm)"] * 100).toString(),
			// 	"Product Width": (wcProduct["Width (cm)"] * 100).toString(),
			// 	"Product Height": (wcProduct["Height (cm)"] * 100).toString(),
			// 	"Product Discountable": true,
			// 	"Product Sales Channel 1": "",
			// 	"Variant SKU": wcProduct["SKU"],
			// 	"Variant Title": wcProduct["Name"],
			// });

			const parentUniqueId =
				wcProduct["Parent"] && wcProduct["Parent"] !== ""
					? wcProduct["Parent"].toString().replace("id:", "").trim()
					: wcProduct["SKU"] && wcProduct["SKU"] !== ""
					? wcProduct["SKU"]
					: wcProduct["ID"];

			const data = {
				handle: wcProduct["Meta: rank_math_permalink"],
				sku:
					wcProduct["SKU"] && wcProduct["SKU"] !== ""
						? wcProduct["SKU"]
						: wcProduct["ID"],
				parent:
					wcProduct["Parent"] && wcProduct["Parent"] !== "" ? false : true,
				index: i,
			};

			console.log(data.parent, "\t", data.sku, "\t", parentUniqueId);

			if (data.parent)
				console.log(data.parent, data.sku, wcProduct["Parent"] ?? "null");

			productMap[parentUniqueId] = {
				handle: [
					...new Set([
						...(productMap?.[parentUniqueId]?.handle
							? productMap[parentUniqueId].handle
							: []),
						...(data.handle !== "" ? [data.handle] : []),
					]),
				],
				parent: [
					...(productMap?.[parentUniqueId]?.parent
						? productMap?.[parentUniqueId]?.parent
						: []),
					...(data.parent ? [data] : []),
				],
				children: [
					...(productMap?.[parentUniqueId]?.children
						? productMap?.[parentUniqueId]?.children
						: []),
					...(data.parent ? [] : [data]),
				],
			};
		}

		// storing product map data
		fs.writeFileSync(
			path.join(outputDirPath, "product_map.json"),
			JSON.stringify(productMap, undefined, 2)
		);

		for (const [sku, data] of Object.entries(productMap)) {
			const wcProductParent = wcProductData[data.parent[0].index];

			const parentOptions: { [key: string]: any } = {};
			// set parent option values
			for (let i = 0; i < 8; i++) {
				if (
					parentOptions[wcProductParent[`Attribute ${i + 1} name`]] !== "" &&
					wcProductParent[`Attribute ${i + 1} value(s)`] !== ""
				)
					parentOptions[wcProductParent[`Attribute ${i + 1} name`]] =
						wcProductParent[`Attribute ${i + 1} value(s)`];
			}

			if (data.children.length === 0) {
				const variantOptions = {
					"Option 1 Name": "default",
					"Option 1 Value": "default",
				};

				console.log(
					{
						"data.handle?.[0] || generateSlug(wcProductParent[])":
							data.handle?.[0] || generateSlug(wcProductParent["Name"]),
					},
					sku
				);

				const imageUrls = (
					(wcProductParent["Images"] || "").split(",").slice(1) || []
				).map((url: string) => url.trim());

				const imageFields: { [key: string]: string } = {};
				imageUrls.forEach((url, index) => {
					imageFields[`Image ${index + 1} Url`] = url;
				});

				const handle = data.handle?.[0]
					? generateSlug(data.handle?.[0])
					: generateSlug(wcProductParent["Name"]) || null;

				if (handle)
					medusaProducts.push({
						// "Product Id"?: string;
						"Product Handle": `${handle}${
							wcProductParent["Type"] === "simple" ? "-simple" : ""
						}`
							.toString()
							.replace(//g, "-"),
						"Product Title": wcProductParent["Name"]
							.toString()
							.replace(//g, "-"),
						"Product Subtitle": wcProductParent["Short description"]
							.toString()
							.replace(//g, "-"),
						"Product Description": wcProductParent["Description"]
							.toString()
							.replace(//g, "-"),
						"Product Status":
							wcProductParent["Published"].toString() === "1"
								? "published"
								: "draft",
						"Product Thumbnail":
							wcProductParent["Images"]?.split(",")?.[0] || "",
						"Product Weight": (
							wcProductParent["Weight (kg)"] * 1000
						).toString(),
						"Product Length": wcProductParent["Length (cm)"].toString(),
						"Product Width": wcProductParent["Width (cm)"].toString(),
						"Product Height": wcProductParent["Height (cm)"].toString(),
						"Variant Title": wcProductParent["Name"],
						"Variant SKU": data.parent[0].sku,
						"Product Sales Channel 1": defaults.sales_channel,
						"Product Discountable": true,
						"Variant Allow Backorder":
							wcProductParent["Backorders allowed?"].toString() === "1"
								? true
								: false,
						"Variant Manage Inventory": true,
						"Product Origin Country": defaults.originCountry,
						"Price EUR": wcProductParent["Regular price"]
							.toString()
							.replace(",", "."),
						"Price USD": wcProductParent["Regular price"]
							.toString()
							.replace(",", "."),
						"Price BRL": wcProductParent["Regular price"]
							.toString()
							.replace(",", "."),
						"Product Tags": wcProductParent["Tags"]
							.split(",")
							.map((x) => x.trim().toString().replace(//g, "-"))
							.join(","),
						"Product Categories": getProductCategoryHandles(
							wcProductParent["Categories"]
						),
						...variantOptions,
						...imageFields,
						// "Product HS Code"?: string;
						// "Product Origin Country"?: string;
						// "Product MID Code"?: string;
						// "Product Material"?: string;
						// "Product Collection Title"?: string;
						// "Product Collection Handle"?: string;
						// "Product Type"?: string;
						// "Product External Id"?: string;
						// "Product Profile Name"?: string;
						// "Product Profile Type"?: string;
						// "Variant Id"?: string;
						// "Variant Barcode"?: string;
						// "Variant Inventory Quantity"?: number;
						// "Variant Weight"?: number;
						// "Variant Length"?: number;
						// "Variant Width"?: number;
						// "Variant Height"?: number;
						// "Variant HS Code"?: string;
						// "Variant Origin Country"?: string;
						// "Variant MID Code"?: string;
						// "Variant Material"?: string;
						// "Image 1 Url"?: string;
						// "Image 2 Url"?: string;
						// "Image 3 Url"?: string;
						// "Image 4 Url"?: string;
						// "Image 5 Url"?: string;
						// "Image 6 Url"?: string;
						// "Image 7 Url"?: string;
						// "Image 8 Url"?: string;
					});
			}
			for (let i = 0; i < data.children.length; i++) {
				const variant = data.children[i];
				const wcProduct = wcProductData[variant.index];

				const childOptions: any = {};
				// set variant option values
				for (let i = 0; i < 8; i++) {
					if (
						childOptions[wcProduct[`Attribute ${i + 1} name`]] !== "" &&
						wcProduct[`Attribute ${i + 1} value(s)`] !== ""
					)
						childOptions[wcProduct[`Attribute ${i + 1} name`]] =
							wcProduct[`Attribute ${i + 1} value(s)`];
				}

				const mergedOptions = { ...parentOptions };
				for (const [key, value] of Object.entries(childOptions)) {
					if (value) {
						mergedOptions[key] = value;
					}
				}

				let variantOptions: any = {};
				let counter = 1;

				// Transform the object structure
				for (const [key, value] of Object.entries(mergedOptions)) {
					variantOptions[`Option ${counter} Name`] = key;
					variantOptions[`Option ${counter} Value`] = value;
					counter++;
				}

				if (Object.keys(variantOptions).length === 0) {
					variantOptions = {
						"Option 1 Name": "default",
						"Option 1 Value": "default",
					};
				}
				const childImageUrls = [
					...new Set([
						...((wcProduct["Images"] || "").split(",").slice(1) || []).map(
							(url: string) => url.trim()
						),
						...((wcProductParent["Images"] || "").split(",") || []).map(
							(url: string) => url.trim()
						),
					]),
				];

				const variantImageFields: { [key: string]: string } = {};
				childImageUrls.forEach((url, index) => {
					variantImageFields[`Image ${index + 1} Url`] = url;
				});

				const handle = data.handle?.[0]
					? generateSlug(data.handle?.[0])
					: generateSlug(wcProductParent["Name"]) || null;

				if (handle) {
					const shrinkTitle = wcProduct["Name"]
						.toString()
						.replace(wcProductParent["Name"], "")
						.replace(//g, "-")
						.replace("- ", "")
						.trim();
					const variantTitle =
						shrinkTitle && shrinkTitle !== ""
							? shrinkTitle
							: wcProduct["Name"].replace(//g, "-").trim().toString();
					medusaProducts.push({
						// "Product Id"?: string;
						"Product Handle": handle.toString().replace(//g, "-"),
						"Product Title": wcProductParent["Name"]
							.toString()
							.replace(//g, "-"),
						"Product Subtitle": wcProductParent["Short description"]
							.toString()
							.replace(//g, "-"),
						"Product Description": wcProductParent["Description"]
							.toString()
							.replace(//g, "-"),
						"Product Status":
							wcProductParent["Published"].toString() === "1"
								? "published"
								: "draft",
						"Product Thumbnail": wcProduct["Images"]?.split(",")?.[0] || "",
						"Product Weight": (
							wcProductParent["Weight (kg)"] * 1000
						).toString(),
						"Product Length": wcProductParent["Length (cm)"].toString(),
						"Product Width": wcProductParent["Width (cm)"].toString(),
						"Product Height": wcProductParent["Height (cm)"].toString(),
						"Variant Title": variantTitle,
						"Variant SKU": data.children[i].sku,
						"Product Sales Channel 1": defaults.sales_channel,
						"Product Discountable": true,
						"Variant Allow Backorder":
							wcProductParent["Backorders allowed?"].toString() === "1"
								? true
								: false,
						"Variant Manage Inventory": true,
						"Product Origin Country": defaults.originCountry,
						"Price EUR": wcProduct["Regular price"]
							.toString()
							.replace(",", "."),
						"Price USD": wcProduct["Regular price"]
							.toString()
							.replace(",", "."),
						"Price BRL": wcProduct["Regular price"]
							.toString()
							.replace(",", "."),
						"Product Tags": [
							...new Set([
								...wcProductParent["Tags"]
									.split(",")
									.map((x) => x.trim().toString().replace(//g, "-")),
								...wcProduct["Tags"]
									.split(",")
									.map((x) => x.trim().toString().replace(//g, "-")),
							]),
						].join(","),
						"Product Categories": getProductCategoryHandles(
							`${wcProductParent["Categories"]},${wcProduct["Categories"]}`
						),
						...variantOptions,
						...variantImageFields,
						// "Product HS Code"?: string;
						// "Product Origin Country"?: string;
						// "Product MID Code"?: string;
						// "Product Material"?: string;
						// "Product Collection Title"?: string;
						// "Product Collection Handle"?: string;
						// "Product Type"?: string;
						// "Product External Id"?: string;
						// "Product Profile Name"?: string;
						// "Product Profile Type"?: string;
						// "Variant Id"?: string;
						// "Variant Barcode"?: string;
						// "Variant Inventory Quantity"?: number;
						// "Variant Weight"?: number;
						// "Variant Length"?: number;
						// "Variant Width"?: number;
						// "Variant Height"?: number;
						// "Variant HS Code"?: string;
						// "Variant Origin Country"?: string;
						// "Variant MID Code"?: string;
						// "Variant Material"?: string;
						// "Image 1 Url"?: string;
						// "Image 2 Url"?: string;
						// "Image 3 Url"?: string;
						// "Image 4 Url"?: string;
						// "Image 5 Url"?: string;
						// "Image 6 Url"?: string;
						// "Image 7 Url"?: string;
						// "Image 8 Url"?: string;
					});
				}
			}
		}

		const csvData = convertJsonToCsv(medusaProducts);

		fs.writeFileSync(
			path.join(outputDirPath, fileName.replace(".json", ".csv")),
			csvData,
			encoding
		);
	} catch (error) {
		console.error("Error converting JSON to CSV:", error);
	}
};

const generateTags = (fileName: string) => {};

const generateCategories = (fileName: string) => {
	const wcProductData: ProductJSON[] = JSON.parse(
		fs.readFileSync(path.join(outputDirPath, fileName), encoding)
	);

	const categoryMap: { [key: string]: any } = {};

	wcProductData.forEach((data) => {
		if (data["Categories"] && data["Categories"] !== "") {
			const categories = data["Categories"]
				.toString()
				.split(",")
				.map((i) => i.trim());

			categories.forEach((category) => {
				const childCategories = category.split(">").map((i) => i.trim());
				let currentLevel = categoryMap; // Start at the root of the category map

				childCategories.forEach((childCategory) => {
					if (!currentLevel[childCategory]) {
						currentLevel[childCategory] = {}; // Create a new object for the category if it doesn't exist
					}
					currentLevel = currentLevel[childCategory]; // Move down to the next level
				});
			});
		}
	});

	fs.writeFileSync(
		path.join(outputDirPath, "categories.json"),
		JSON.stringify(categoryMap, undefined, 2),
		encoding
	);
};

async function main() {
	const fileName = inputFileName[0];
	csvToJson(fileName);

	const outPutFileName = outputFileName[0];
	// generateTags(outPutFileName);
	generateCategories(outPutFileName);
	jsonToCsv(outPutFileName);

	// for (let i = 0; i < inputFileName.length; i++) {
	// 	const fileName = inputFileName[i];
	// 	// read csv file
	// 	csvToJson(fileName);
	// }
	// for (let i = 0; i < outputFileName.length; i++) {
	// 	const fileName = outputFileName[i];
	// 	// convert json to csv
	// 	generateCategories(fileName);
	// 	// jsonToCsv(fileName);
	// }
}

main();
