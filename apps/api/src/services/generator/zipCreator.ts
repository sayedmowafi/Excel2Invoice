import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

/**
 * Create ZIP archive from files
 */
export function createZipArchive(
  files: string[],
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    output.on('close', () => {
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add files to archive
    for (const file of files) {
      const filename = path.basename(file);
      archive.file(file, { name: filename });
    }

    archive.finalize();
  });
}
