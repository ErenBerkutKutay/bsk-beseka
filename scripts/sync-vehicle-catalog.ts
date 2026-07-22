import "dotenv/config";
import { resolve } from "node:path";
import { syncVehicleCatalog } from "../src/lib/vehicles/sync-vehicle-catalog";

async function main() {
  const fileArg = process.argv[2];
  const result = await syncVehicleCatalog({
    filePath: fileArg ? resolve(process.cwd(), fileArg) : undefined,
    importedBy: "cli",
  });

  if (result.skipped) {
    process.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
