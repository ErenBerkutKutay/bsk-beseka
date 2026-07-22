import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { importVehicleTypesFromBuffer } from "../src/lib/vehicles/import-vehicle-types";

async function main() {
  const fileArg = process.argv[2];
  const filePath = resolve(
    process.cwd(),
    fileArg || "data/data.xlsx",
  );

  console.log(`Reading ${filePath}...`);
  const buffer = readFileSync(filePath);
  const result = await importVehicleTypesFromBuffer(buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ), {
    fileName: filePath.split("/").pop(),
    importedBy: "cli",
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
