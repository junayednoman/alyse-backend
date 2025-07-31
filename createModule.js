import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ============================================  HOW TO USE  ===================================== //

// write the following command to generate a new module: node createModule.js moduleName

// ============================================  HOW TO USE  ===================================== //

// Define __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const moduleName = process.argv[2];

if (!moduleName) {
  console.log("Please provide a module name!");
  process.exit(1);
}

const moduleDir = path.join(__dirname, "src", "app", "modules", moduleName);
const files = [
  `${moduleName}.controller.ts`,
  `${moduleName}.interface.ts`,
  `${moduleName}.model.ts`,
  `${moduleName}.routes.ts`,
  `${moduleName}.service.ts`,
  `${moduleName}.validation.ts`,
];

if (!fs.existsSync(moduleDir)) {
  fs.mkdirSync(moduleDir, { recursive: true });
}

files.forEach((file) => {
  const filePath = path.join(moduleDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, ``);
    console.log(`Created: ${filePath}`);
  } else {
    console.log(`File already exists: ${filePath}`);
  }
});

console.log(`Module ${moduleName} created successfully!`);
