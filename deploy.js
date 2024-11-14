const { exec } = require('child_process');
const path = require('path');

// Build client
console.log('Building client...');
exec('cd client && npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Client build error: ${error}`);
    return;
  }
  console.log('Client build complete');
  
  // Move build to server
  exec('mv client/build server/public', (error, stdout, stderr) => {
    if (error) {
      console.error(`Move error: ${error}`);
      return;
    }
    console.log('Build moved to server/public');
  });
}); 