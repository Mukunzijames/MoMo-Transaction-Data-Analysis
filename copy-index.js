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

// Function to copy directory recursively
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Read all files/folders from source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDir(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy frontend directory to public/frontend
try {
  const frontendSrc = path.join(__dirname, 'frontend');
  const frontendDest = path.join(__dirname, 'public', 'frontend');
  
  if (fs.existsSync(frontendSrc)) {
    copyDir(frontendSrc, frontendDest);
    console.log('Successfully copied frontend directory to public/frontend');
  } else {
    console.error('Source frontend directory not found');
  }
} catch (error) {
  console.error('Error copying frontend directory:', error);
} 