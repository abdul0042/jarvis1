const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('http://localhost:5000')) {
    // Template literals
    content = content.replace(/`http:\/\/localhost:5000([^`]*)`/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`");
    // Single quotes
    content = content.replace(/'http:\/\/localhost:5000([^']*)'/g, "(import.meta.env.VITE_API_URL || 'http://localhost:5000') + '$1'");
    // Double quotes
    content = content.replace(/"http:\/\/localhost:5000([^"]*)"/g, "(import.meta.env.VITE_API_URL || 'http://localhost:5000') + \"$1\"");
    // JSX text
    content = content.replace(/>http:\/\/localhost:5000([^<]*)</g, ">{import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1<");
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated: ' + file);
  }
});
