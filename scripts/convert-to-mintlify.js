const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const sourceDir = 'docs-reference'; // Source directory with TypeDoc MD files
const targetDir = 'docs/docs-reference'; // Target directory for Mintlify MDX files
const mintJsonPath = 'mint.json'; // Path to mint.json file

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, {recursive: true});
}

// Function to convert a single file
function convertFile(sourcePath) {
  // Read the source file
  const content = fs.readFileSync(sourcePath, 'utf8');

  // Get the relative path from the source directory
  const relativePath = path.relative(sourceDir, sourcePath);

  // Create the target path with .mdx extension
  const targetPath = path.join(
    targetDir,
    relativePath.replace(/\.md$/, '.mdx'),
  );

  // Create the directory structure if it doesn't exist
  const targetFileDir = path.dirname(targetPath);
  if (!fs.existsSync(targetFileDir)) {
    fs.mkdirSync(targetFileDir, {recursive: true});
  }

  // Extract the title from the content (usually the first heading)
  let title = path.basename(sourcePath, '.md');
  const titleMatch = content.match(/^# (.+)$/m);
  if (titleMatch) {
    title = titleMatch[1];
  }

  // Generate a description based on the content
  let description = '';
  const descriptionMatch = content.match(/^# .+\n\n(.+)$/m);
  if (descriptionMatch) {
    description = descriptionMatch[1];
  } else {
    description = `Documentation for ${title}`;
  }

  // Add frontmatter to the content
  const frontmatter = `---
title: "${title}"
description: "${description}"
---

`;

  // Update all internal links to point to .mdx files instead of .md files
  let updatedContent = content.replace(/\]\(([^)]+)\.md\)/g, ']($1.mdx)');

  // Combine frontmatter and updated content
  const finalContent = frontmatter + updatedContent;

  // Write the converted content to the target file
  fs.writeFileSync(targetPath, finalContent);

  console.log(`Converted: ${sourcePath} -> ${targetPath}`);
}

// Find all Markdown files in the source directory
glob(`${sourceDir}/**/*.md`, (err, files) => {
  if (err) {
    console.error('Error finding files:', err);
    return;
  }

  console.log(`Found ${files.length} files to convert`);

  // Convert each file
  files.forEach(convertFile);

  // Update mint.json with the new files
  updateMintJson(files);

  console.log('Conversion complete!');
});

// Function to update mint.json with the converted files
function updateMintJson(files) {
  // Read the mint.json file
  const mintJsonContent = fs.readFileSync(mintJsonPath, 'utf8');
  const mintJson = JSON.parse(mintJsonContent);

  // Find the Reference group
  const referenceGroup = mintJson.navigation.find(
    item => item.group === 'Reference',
  );

  if (referenceGroup) {
    // Get the existing pages array
    const existingPages = referenceGroup.pages || [];

    // Generate paths for the navigation, preserving the exact structure
    files.forEach(file => {
      const relativePath = path.relative(sourceDir, file);
      // Convert to the target path format and change extension from .md to .mdx
      const targetPath = `docs/docs-reference/${relativePath.replace(
        /\.md$/,
        '',
      )}`;

      // Only add if it doesn't already exist
      if (!existingPages.includes(targetPath)) {
        existingPages.push(targetPath);
      }
    });

    // Update the pages array
    referenceGroup.pages = existingPages;
  }

  // Write the updated mint.json back to file
  fs.writeFileSync(mintJsonPath, JSON.stringify(mintJson, null, 2));

  console.log(`Updated mint.json Reference group with new pages`);
}
