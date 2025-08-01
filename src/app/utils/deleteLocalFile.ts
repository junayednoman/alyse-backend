import fs from 'fs';
const deleteLocalFile = async (filePath: string) => {
  try {
    fs.unlinkSync(`uploads/${filePath}`);
  } catch (error: any) {
    console.error(`Error deleting file: ${error.message}`);
  }
}

export default deleteLocalFile;