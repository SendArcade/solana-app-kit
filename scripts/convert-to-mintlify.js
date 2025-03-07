const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const sourceDir = 'docs/references'; // Directory with TypeDoc MD files
const mintJsonPath = 'mint.json'; // Path to mint.json file

// Function to convert a single file in place
function convertFileInPlace(filePath) {
  // Read the source file
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract the title from the content (usually the first heading)
  let title = path.basename(filePath, '.md');
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

  // Create the new file path with .mdx extension
  const mdxFilePath = filePath.replace(/\.md$/, '.mdx');

  // Write the converted content to the new file
  fs.writeFileSync(mdxFilePath, finalContent);
  
  // Remove the original .md file
  fs.unlinkSync(filePath);

  console.log(`Converted: ${filePath} -> ${mdxFilePath}`);
}

// Find all Markdown files in the source directory
glob(`${sourceDir}/**/*.md`, (err, files) => {
  if (err) {
    console.error('Error finding files:', err);
    return;
  }

  console.log(`Found ${files.length} files to convert`);

  // Convert each file in place
  files.forEach(convertFileInPlace);

  // Update mint.json with the new file extensions
  updateMintJson();

  console.log('Conversion complete!');
});

// Function to update mint.json with the converted files
function updateMintJson() {
  try {
    // Read the mint.json file
    const mintJsonContent = fs.readFileSync(mintJsonPath, 'utf8');
    let mintJson;
    
    try {
      mintJson = JSON.parse(mintJsonContent);
    } catch (parseError) {
      console.error('Error parsing mint.json:', parseError);
      return;
    }

    // Find all .mdx files in the docs/references directory
    const mdxFiles = glob.sync('docs/references/**/*.mdx');
    console.log(`Found ${mdxFiles.length} .mdx files to add to mint.json`);

    // Find the Reference group
    const referenceGroup = mintJson.navigation.find(item => item.group === "Reference");

    if (referenceGroup) {
      console.log('Found Reference group in mint.json');
      
      // Create a new pages array with the main references entry
      const newPages = ['docs/references'];
      
      // Add all the .mdx files to the pages array
      mdxFiles.forEach(file => {
        // Remove the .mdx extension for the navigation
        const navPath = file.replace(/\.mdx$/, '');
        if (!newPages.includes(navPath)) {
          newPages.push(navPath);
        }
      });
      
      console.log('Original pages:', referenceGroup.pages);
      console.log('New pages:', newPages);
      
      // Update the pages array
      referenceGroup.pages = newPages;
    } else {
      console.log('Reference group not found in mint.json');
    }

    // Write the updated mint.json back to file
    fs.writeFileSync(mintJsonPath, JSON.stringify(mintJson, null, 2));
    console.log(`Updated mint.json with all nested folders and files`);
    
  } catch (error) {
    console.error('Error updating mint.json:', error);
  }
}
