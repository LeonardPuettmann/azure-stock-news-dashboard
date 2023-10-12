const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

const { BlobServiceClient } = require('@azure/storage-blob');

// Add your connection string and container name
const AZURE_STORAGE_CONNECTION_STRING = 'your-azure-storage-connection-string';
const containerName = 'your-container-name';

app.get('/fetch-file/:date', async (req, res) => {
  const blobName = req.params.date + '.txt'; // assuming the blobs are named as 'date.txt'
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const fileContent = (await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)).toString();
    res.send(fileContent);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

// Add your Key Vault url
const vaultUrl = 'https://your-key-vault-name.vault.azure.net/';

let credential = new DefaultAzureCredential();
let client = new SecretClient(vaultUrl, credential);

app.get('/fetch-file/:date', async (req, res) => {
  const blobName = req.params.date + '.txt'; // assuming the blobs are named as 'date.txt'
  
  // Retrieve the connection string from Azure Key Vault
  const secret = await client.getSecret('your-secret-name');
  const AZURE_STORAGE_CONNECTION_STRING = secret.value;

  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const fileContent = (await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)).toString();
    res.send(fileContent);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
