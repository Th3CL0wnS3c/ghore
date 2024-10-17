// Import modules
const fs = require("fs");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const chokidar = require("chokidar");
const path = require("path");
const net = require("net");
const os = require("os");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set to track active files
let activeFiles = new Set();
let port;

// Generate a random port between 5169 and 5200
const getRandomPort = () => {
  return Math.floor(Math.random() * (5200 - 5169 + 1)) + 5169;
};

// Check if port is not used already
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const checkPort = net.createServer();
    checkPort.unref();
    checkPort.on('error', () => resolve(false));
    checkPort.listen(port, () => {
      checkPort.close(() => resolve(true));
    });
  });
};

// Default file path
const defaultFilePath = "README.md";

// Define Temp directory prefix
const tmpDirPrefix = 'ghore-';

// If none /tmp_dir/ghore-xxxx exists, create one, if one exists, it will be used instead of recreating one each time
const checkTmpDir = () => {
  const tmpBaseDir = os.tmpdir();
  const existingDir = fs.readdirSync(tmpBaseDir).find(dir => dir.startsWith(tmpDirPrefix));

  if (existingDir) {
    return path.join(tmpBaseDir, existingDir);
  } else {
    const newTmpDir = fs.mkdtempSync(path.join(tmpBaseDir, tmpDirPrefix));
    return newTmpDir;
  }
};

// Set temp directory based on check done with checkTmpDir
const tmpDir = checkTmpDir();

// Get filename full path to add to ghore_urls.txt
const fullFilePath = path.resolve(
  (process.argv[2] === "start" || process.argv[2] === "preview") 
    ? process.argv[3] 
    : process.argv[2] || defaultFilePath
);

// Create or update the temporary file ghore_urls.txt
const setTempFile = (filePath, fileName, url) => {
  const tempFilePath = path.join(tmpDir, 'ghore_urls.txt');
  const logEntry = `${fullFilePath}; ${fileName}; ${url}\n`;

  if (!fs.existsSync(tempFilePath)) {
    // Define file header only if file is new
    const header = `PATH; FILE; URL\n`;
    fs.writeFileSync(tempFilePath, header + logEntry, "utf-8");
  } else {
    fs.appendFileSync(tempFilePath, logEntry, "utf-8");
  }
  console.log(`Matching filename:url available in: ${tempFilePath}`);
};

// Watch for changes on the specified file path
const watchFile = (filePath) => {
  activeFiles.add(filePath);
  console.log(`Watching file: ${filePath}`);

  const watcher = chokidar.watch(filePath);
  
  watcher.on("change", async () => {
    try {
      const data = await fs.promises.readFile(filePath, "utf8");
      console.log("File has been changed!!! Applying changes....");
      const renderedHTML = await renderMarkdown(data);

      io.emit("update markdown", renderedHTML);
    } catch (err) {
      console.error("file watch error:", err);
    }
  });
};

// Main function to start the server
const startServer = async (portNumber, filePath) => {
  port = portNumber;
  
  // Check if the port is available and start the server
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
    watchFile(filePath); // Start watching the file
    setTempFile(filePath, path.basename(filePath), `http://localhost:${port}/`); // Log the initial entry
  });
};

// Handle server shutdown and remove corresponding entry from ghost_urls.txt
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  
  // Remove entries for actively watched files from the temp file
  const tempFilePath = path.join(tmpDir, 'ghore_urls.txt');
  if (fs.existsSync(tempFilePath)) {
    // Read current contents
    let data = fs.readFileSync(tempFilePath, 'utf-8').split('\n').filter(Boolean); // Filter out empty lines
    
    // Filter out lines for active files
    const updatedData = data.filter(line => {
      const lineParts = line.split(';');
      if (lineParts.length < 3) return true; // Keep header line or invalid lines
      
      const pathFromLine = lineParts[0].trim(); // Extract path from line
      const fileNameFromLine = lineParts[1].trim(); // Extract filename from line
      const urlFromLine = lineParts[2].trim(); // Extract URL from line
      // Check if the current line's full entry matches any active file entry
      const expectedURL = `http://localhost:${port}/`;
      return !(
        [...activeFiles].some(activeFile => path.resolve(activeFile) === pathFromLine) &&
        fileNameFromLine === path.basename(pathFromLine) &&
        urlFromLine === expectedURL
      ); // Keep lines not matching active files
    });
    
    // Write the updated data back to the temp file
    fs.writeFileSync(tempFilePath, updatedData.join('\n'), 'utf-8');
    console.log(`Updated temp file after server shutdown.`);
  } else {
    console.log(`Temporary file does not exist: ${tempFilePath}`);
  }

  process.exit();
});

// Determine port and file path, then start server
(async () => {
  do {
    port = getRandomPort();
  } while (!(await isPortAvailable(port)));

  const filePath = (process.argv[2] === "start" ? process.argv[3] : process.argv[2]) || "README.md";

  startServer(port, filePath); // Start the server
})();
