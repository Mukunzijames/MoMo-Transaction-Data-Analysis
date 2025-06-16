const fs = require('fs');
const path = require('path');

// Ensure public directory exists
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// Copy index.html from root to public directory
try {
  const sourceFile = path.join(__dirname, 'index.html');
  const destFile = path.join(__dirname, 'public', 'index.html');
  
  if (fs.existsSync(sourceFile)) {
    const content = fs.readFileSync(sourceFile, 'utf8');
    fs.writeFileSync(destFile, content);
    console.log('Successfully copied index.html to public directory');
  } else {
    console.error('Source index.html not found');
  }
} catch (error) {
  console.error('Error copying index.html:', error);
} 