const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// 1. Data Migration
async function migrateData() {
  require('dotenv').config();
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI missing');
    return;
  }
  
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const { Store } = require('./data/db');
  
  // Read local data.json
  const localDataPath = path.join(__dirname, 'data.json');
  if (fs.existsSync(localDataPath)) {
    const localData = JSON.parse(fs.readFileSync(localDataPath, 'utf8'));
    await Store.findOneAndUpdate({ docId: 'main' }, { state: localData }, { upsert: true });
    console.log('Successfully migrated data.json to MongoDB!');
  } else {
    console.log('No local data.json found.');
  }

  await mongoose.disconnect();
}

// 2. Refactor Code
function refactorRoutes() {
  const routesDir = path.join(__dirname, 'routes');
  const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  
  for (const file of files) {
    const filePath = path.join(routesDir, file);
    let code = fs.readFileSync(filePath, 'utf8');

    // Remove local readData and writeData
    code = code.replace(/const readData = \(\) => \{[\s\S]*?\};\n\n/g, '');
    code = code.replace(/const writeData = \(data\) => \{[\s\S]*?\};\n\n/g, '');
    
    // Add import for readData and writeData at the top (after require('fs'))
    if (!code.includes('const { readData, writeData } = require(')) {
      code = code.replace(/(const .*? = require\(.*?\);\n)+/, match => {
        return match + "const { readData, writeData } = require('../data/db');\n\n";
      });
    }

    // Convert route handlers to async
    code = code.replace(/router\.(get|post|put|delete)\('(.*?)', ?(express\.json\(\), )?\(req, res\) => \{/g, "router.$1('$2', $3async (req, res) => {");

    // Add await to readData and writeData
    code = code.replace(/const data = readData\(\);/g, 'const data = await readData();');
    code = code.replace(/writeData\(data\);/g, 'await writeData(data);');

    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`Refactored ${file}`);
  }
}

async function run() {
  await migrateData();
  refactorRoutes();
  console.log('All done!');
}

run();
