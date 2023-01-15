/* eslint-disable no-console */
const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();
const { DefaultAzureCredential } = require('@azure/identity');
const { v1: uuidv1 } = require('uuid');

async function main() {
  try {
    console.log('Azure Blob storage v12 - JavaScript quickstart sample');
    // Azure access
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) throw Error('Azure Storage accountName not found');
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      new DefaultAzureCredential(),
    );
    const containerName = 'sounds';

    console.log('\nCreating container...');
    console.log('\t', containerName);

    // Get a reference to a container
    const containerClient = blobServiceClient.getContainerClient(containerName);
    // Create the container
    const createContainerResponse = await containerClient.create();
    console.log(
      `Container was created successfully.\n\trequestId:${createContainerResponse.requestId}\n\tURL: ${containerClient.url}`,
    );

  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  if (!accountName) throw Error('Azure Storage accountName not found');
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential(),
  );
  const containerName = 'sounds';
  const containerClient = blobServiceClient.getContainerClient(containerName);
  // Create a unique name for the blob
  const blobName = 'quickstart' + uuidv1() + '.txt';

  // Get a block blob client
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Display blob name and url
  console.log(
    `\nUploading to Azure storage as blob\n\tname: ${blobName}:\n\tURL: ${blockBlobClient.url}`,
  );

  // Upload data to the blob
  const data = 'Hello, World!';
  const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
  console.log(
    `Blob was uploaded successfully. requestId: ${uploadBlobResponse.requestId}`,
  );

  for await (const blob of containerClient.listBlobsFlat()) {
    // Get Blob Client from name, to get the URL
    const tempBlockBlobClient = containerClient.getBlockBlobClient(blob.name);

    // Display blob name and URL
    console.log(
      `\n\tname: ${blob.name}\n\tURL: ${tempBlockBlobClient.url}\n`,
    );
  }
}

main()
  .then(() => console.log('Done'))
  .catch((ex) => console.log(ex.message));
