// IPFS/CheckUploadProjectMetaData.ts
import type { ProjectMetadata } from "../Format/uploadMetadata-Project";

export function validateProjectMetadata(
  data: Partial<ProjectMetadata>
): asserts data is ProjectMetadata {
  if (data.type !== "project") {
    throw new Error("Invalid metadata type");
  }

  if (!data.title || data.title.trim().length < 3) {
    throw new Error("Title must be at least 3 characters long");
  }

  if (data.title.trim().length > 100) {
    throw new Error("Title must be less than 100 characters");
  }

  if (!data.description || data.description.trim().length < 10) {
    throw new Error("Description must be at least 10 characters long");
  }

  if (data.description.trim().length > 1000) {
    throw new Error("Description must be less than 1000 characters");
  }

  if (!Array.isArray(data.tags) || data.tags.length === 0) {
    throw new Error("At least one tag is required");
  }

  if (data.tags.length > 10) {
    throw new Error("Maximum 10 tags allowed");
  }

  // Validate each tag
  data.tags.forEach((tag, index) => {
    if (!tag || tag.trim().length === 0) {
      throw new Error(`Tag ${index + 1} cannot be empty`);
    }
    if (tag.trim().length > 30) {
      throw new Error(`Tag "${tag}" must be less than 30 characters`);
    }
    // Check for special characters
    if (/[<>{}[\]\\]/.test(tag)) {
      throw new Error(`Tag "${tag}" contains invalid characters`);
    }
  });

  // Validate images if present
  if (data.images && data.images.length > 0) {
    // Maximum 5 images
    if (data.images.length > 5) {
      throw new Error("Maximum 5 images allowed");
    }
    
    data.images.forEach((img, index) => {
      if (!img.cid || !img.type) {
        throw new Error(`Image ${index + 1} must have both CID and type`);
      }
      
      if (!['cover', 'gallery'].includes(img.type)) {
        throw new Error(`Image ${index + 1} type must be either "cover" or "gallery"`);
      }
      
      // Validate CID format (basic check)
      if (!img.cid.startsWith('Qm') && !img.cid.startsWith('bafy')) {
        throw new Error(`Image ${index + 1} has invalid CID format`);
      }
    });
  }
}

// Separate function to validate image file before upload
export function validateImageFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      reject(new Error('Only JPG, PNG, WebP, and GIF images are allowed'));
      return;
    }

    // Check file size (1MB = 1024 * 1024 bytes)
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      reject(new Error(`Image size (${sizeInMB}MB) exceeds 1MB limit`));
      return;
    }

    // Check dimensions (optional but good practice)
    const img = new Image();
    img.onload = () => {
      // Optional: Validate dimensions
      const maxWidth = 4000;
      const maxHeight = 4000;
      
      if (img.width > maxWidth || img.height > maxHeight) {
        reject(new Error(`Image dimensions (${img.width}x${img.height}) exceed maximum ${maxWidth}x${maxHeight}`));
        return;
      }

      // Optional: Validate aspect ratio
      const minAspectRatio = 0.5;  // 1:2
      const maxAspectRatio = 2;    // 2:1
      const aspectRatio = img.width / img.height;
      
      if (aspectRatio < minAspectRatio || aspectRatio > maxAspectRatio) {
        reject(new Error(`Image aspect ratio should be between 1:2 and 2:1`));
        return;
      }
      
      resolve();
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for validation'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}