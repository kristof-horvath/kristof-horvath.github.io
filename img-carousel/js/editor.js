// Global Constants and Initial Setup
const fullWidth = 1080;
const fullHeightPortrait = 1350; // Instagram Portrait full size
const fullHeightSquare = 1080; // Square full size
const previewWidthModifier = 0.6; // 60% of screen width

let previewWidth = Math.min(window.innerWidth * previewWidthModifier, 340); // Capped at 340px
let previewHeightPortrait = (previewWidth / fullWidth) * fullHeightPortrait; // Maintain Portrait aspect ratio
let previewHeightSquare = (previewWidth / fullWidth) * fullHeightSquare; // Maintain Square aspect ratio

const canvas = new fabric.Canvas('canvas', {
  width: previewWidth,
  height: previewHeightPortrait, // Default to Instagram Portrait
  backgroundColor: '#f0f0f0',
});

const uploadInput = document.getElementById('upload');
const moveToBackButton = document.getElementById('moveToBackButton');
const downloadButton = document.getElementById('downloadButton');
const instagramPortraitButton = document.getElementById('instagramPortraitButton');
const squareButton = document.getElementById('squareButton');
const expandWidthButton = document.getElementById('expandWidthButton');
const reduceWidthButton = document.getElementById('reduceWidthButton');
//const fillHeightButton = document.getElementById('fillHeightButton');
const backgroundColorPicker = document.getElementById('backgroundColorPicker');

let currentExpansion = 1; // Track the current number of expansions

/*
// Utility Functions/
function resizeCanvas(width, height) {
  const scaleX = width / canvas.width;
  const scaleY = height / canvas.height;

  canvas.getObjects().forEach((obj) => {
    obj.scaleX *= scaleX;
    obj.scaleY *= scaleY;
    obj.left *= scaleX;
    obj.top *= scaleY;
    obj.setCoords();
  });

  canvas.setWidth(width);
  canvas.setHeight(height);
  canvas.renderAll();
}*/

// Utility Functions
function resizeCanvas(isPortrait) {
    canvas.setHeight(isPortrait ? previewHeightPortrait : previewHeightSquare);
  
    // Re-render the canvas
    canvas.renderAll();
  }

function addIndicatorLines(expansions) {
  canvas.getObjects('line').forEach((line) => canvas.remove(line));

  if (expansions > 1) {
    for (let i = 1; i < expansions; i++) {
      const x = i * previewWidth;
      const line = new fabric.Line([x, 0, x, canvas.height], {
        stroke: 'black',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }
  }

  addPlaceholderIcons(expansions);

  canvas.renderAll();
}
/*
function updatePreviewDimensions() {
  previewWidth = Math.min(window.innerWidth * previewWidthModifier, 540);
  const currentHeight =
    canvas.height === previewHeightSquare
      ? (previewWidth / fullWidth) * fullHeightSquare
      : (previewWidth / fullWidth) * fullHeightPortrait;

  resizeCanvas(previewWidth * currentExpansion, currentHeight);
}*/

// Canvas Actions
function expandCanvasWidth() {
  if (currentExpansion >= 12) {
    alert('Maximum width reached. Cannot expand further.');
    return;
  }

  currentExpansion++;
  canvas.setWidth(canvas.width + previewWidth);
  addIndicatorLines(currentExpansion);
  canvas.renderAll();
}

function reduceCanvasWidth() {
  if (currentExpansion <= 1) {
    alert('Minimum width reached. Cannot reduce further.');
    return;
  }

  currentExpansion--;
  canvas.setWidth(canvas.width - previewWidth);
  addIndicatorLines(currentExpansion);
  canvas.renderAll();
}

function splitAndDownloadCanvas() {
  const totalSections = currentExpansion;
  const sectionWidth = fullWidth;
  const originalWidth = canvas.width;
  const originalHeight = canvas.height;

  canvas.discardActiveObject();

  canvas.setWidth(fullWidth * currentExpansion);
  canvas.setHeight(canvas.height === previewHeightPortrait ? fullHeightPortrait : fullHeightSquare);

  const scaleX = canvas.width / originalWidth;
  const scaleY = canvas.height / originalHeight;

  const lines = [];
  canvas.getObjects().forEach((obj) => {
    if (obj.type === 'line') {
      lines.push(obj);
      canvas.remove(obj);
    } else {
      obj.scaleX *= scaleX;
      obj.scaleY *= scaleY;
      obj.left *= scaleX;
      obj.top *= scaleY;
      obj.setCoords();
    }
  });

  removePlaceholderIcons();

  canvas.renderAll();

  for (let i = 0; i < totalSections; i++) {
    const clonedCanvas = new fabric.Canvas(null, {
      width: sectionWidth,
      height: canvas.height,
    });

    canvas.getObjects().forEach((obj) => {
      const clonedObj = fabric.util.object.clone(obj);
      clonedObj.left -= i * sectionWidth;
      clonedCanvas.add(clonedObj);
    });

    clonedCanvas.renderAll();

    const dataURL = clonedCanvas.toDataURL({
      format: 'png',
      quality: 1,
    });

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `canvas_section_${i + 1}.png`;
    link.click();

    clonedCanvas.dispose();
  }

  canvas.setWidth(originalWidth);
  canvas.setHeight(originalHeight);

  canvas.getObjects().forEach((obj) => {
    if (!lines.includes(obj)) {
      obj.scaleX /= scaleX;
      obj.scaleY /= scaleY;
      obj.left /= scaleX;
      obj.top /= scaleY;
      obj.setCoords();
    }
  });

  lines.forEach((line) => canvas.add(line));
  canvas.renderAll();
}

// Event Listeners
//window.addEventListener('resize', updatePreviewDimensions);

uploadInput.addEventListener('change', (event) => {
  const files = event.target.files;

  Array.from(files).forEach((file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const imageUrl = e.target.result;

      fabric.Image.fromURL(imageUrl, (img) => {
        img.scaleToWidth(previewWidth / 2);
        img.left = Math.random() * (canvas.width - img.width * img.scaleX);
        img.top = Math.random() * (canvas.height - img.height * img.scaleY);

        img.lockScalingFlip = true;
        img.lockRotation = true;

        canvas.add(img);
        canvas.renderAll();
      });
    };

    reader.readAsDataURL(file);
  });
});

moveToBackButton.addEventListener('click', () => {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    alert('Please select an object to move it to the back.');
    return;
  }
  canvas.sendToBack(activeObject);
  canvas.discardActiveObject();
  canvas.renderAll();
});

instagramPortraitButton.addEventListener('click', () => resizeCanvas(true));
squareButton.addEventListener('click', () => resizeCanvas(false));
expandWidthButton.addEventListener('click', expandCanvasWidth);
reduceWidthButton.addEventListener('click', reduceCanvasWidth);
downloadButton.addEventListener('click', splitAndDownloadCanvas);

/*
fillHeightButton.addEventListener('click', () => {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    alert('Please select an object to resize.');
    return;
  }

  const canvasHeight = canvas.height;
  const scalingFactor = canvasHeight / activeObject.height;

  activeObject.scaleX = scalingFactor;
  activeObject.scaleY = scalingFactor;
  activeObject.left = (canvas.width - activeObject.width * activeObject.scaleX) / 2;
  activeObject.top = 0;

  activeObject.setCoords();
  canvas.renderAll();
});*/


// Initialize Pickr
const pickr = Pickr.create({
  el: '#pickr-container', // Hidden Pickr container
  theme: 'nano', // Minimalist theme
  default: 'rgba(240, 240, 240, 1)', // Default color
  useAsButton: true,
  components: {
    preview: true,
    opacity: true,
    hue: true,
    interaction: {
      rgba: true,
      input: true,
      save: true,
    },
  },
});

/** 
// Open Pickr when clicking the button
pickrButton.addEventListener('click', () => {
  pickr.show();
});*/

// Update the button and color preview when a color is selected
pickr.on('save', (color) => {
  const rgbaColor = color.toRGBA().toString();

  // Update canvas background
  canvas.backgroundColor = rgbaColor;
  canvas.renderAll();

  // Update the color preview
  colorPreview.style.backgroundColor = rgbaColor;

  pickr.hide(); // Close the picker
});


// Select the new button
const fitImageButton = document.getElementById('fitImageButton');

// Add event listener to the button
fitImageButton.addEventListener('click', () => {
  const activeObject = canvas.getActiveObject(); // Get the selected object

  if (!activeObject || activeObject.type !== 'image') {
    alert('Please select an image to fit.');
    return;
  }

  // Determine the image orientation
  const isHorizontal = activeObject.width > activeObject.height;

  if (isHorizontal) {
    // Fit the image to two widths
    const targetWidth = 2 * previewWidth; // Two widths
    activeObject.scaleToWidth(targetWidth);
  } else {
    // Fit the image to one width
    const targetWidth = previewWidth; // One width
    activeObject.scaleToWidth(targetWidth);
  }

  /*
  // Re-center the image after resizing
  activeObject.left = (canvas.width - activeObject.width * activeObject.scaleX) / 2;
  activeObject.top = (canvas.height - activeObject.height * activeObject.scaleY) / 2;
  */

  // Update the canvas
  activeObject.setCoords(); // Update object coordinates
  canvas.renderAll(); // Re-render the canvas

  alignToBoxButton.click();
  alignUpButton.click();
});


// Select the remove button
const removeImageButton = document.getElementById('removeImageButton');

// Add event listener to the button
removeImageButton.addEventListener('click', () => {
  const activeObject = canvas.getActiveObject(); // Get the selected object

  if (!activeObject || activeObject.type !== 'image') {
    alert('Please select an image to remove.');
    return;
  }

  // Remove the selected object from the canvas
  canvas.remove(activeObject);

  // Update the canvas
  canvas.renderAll(); // Re-render the canvas to reflect changes
});


// Select the reset image button
const resetImageButton = document.getElementById('resetImageButton');

// Add event listener for resetting the selected image
resetImageButton.addEventListener('click', () => {
  const activeObject = canvas.getActiveObject(); // Get the selected object

  if (!activeObject || activeObject.type !== 'image') {
    alert('Please select an image to reset.');
    return;
  }

  // Reset the image to its original size and position
  activeObject.scaleX = 1; // Reset horizontal scaling
  activeObject.scaleY = 1; // Reset vertical scaling
  activeObject.left = (canvas.width - activeObject.width) / 2; // Center horizontally
  activeObject.top = (canvas.height - activeObject.height) / 2; // Center vertically

  // Update the canvas
  activeObject.setCoords(); // Update object coordinates
  canvas.renderAll(); // Re-render the canvas

  console.log('Selected image has been reset.');
});


// Select the Align to Box button
const alignToBoxButton = document.getElementById('alignToBoxButton');

// Add event listener for aligning to the nearest box
alignToBoxButton.addEventListener('click', () => {
  const activeObject = canvas.getActiveObject(); // Get the selected object

  if (!activeObject || activeObject.type !== 'image') {
    alert('Please select an image to align.');
    return;
  }

  // Get the current position of the image
  const currentX = activeObject.left;

  // Calculate all the box boundaries based on the current canvas expansion
  const boundaries = [];
  for (let i = 0; i <= currentExpansion; i++) {
    boundaries.push(i * previewWidth); // Add boundaries for each width
  }

  // Find the nearest boundary
  const nearestBoundary = boundaries.reduce((prev, curr) => 
    Math.abs(curr - currentX) < Math.abs(prev - currentX) ? curr : prev
  );

  // Align the image to the nearest boundary
  activeObject.left = nearestBoundary;
  activeObject.setCoords(); // Update object coordinates

  // Re-render the canvas
  canvas.renderAll();
  console.log(`Aligned image to nearest box at X: ${nearestBoundary}`);
});

// Align selected object(s) to the top
alignUpButton.addEventListener('click', () => {
    const activeObject = canvas.getActiveObject();
  
    if (activeObject) {
      if (activeObject.type === 'activeSelection') {
        // Handle multiple objects if grouped
        activeObject.forEachObject((obj) => {
          obj.top = 0; // Align to top edge
          obj.setCoords();
        });
      } else {
        // Single object alignment
        activeObject.top = 0; // Align to top edge
        activeObject.setCoords();
      }
  
      canvas.renderAll(); // Re-render the canvas
      console.log('Object(s) aligned to the top.');
    } else {
      alert('Please select an object to align.');
    }
  });


// Select Instagram Preview button and modal elements
//const instagramPreviewButton = document.getElementById('instagramPreviewButton');
const previewModal = document.getElementById('previewModal');
const previewImage = document.getElementById('previewImage');
const closePreviewModal = document.getElementById('closePreviewModal');

/*
// Show Instagram post preview
instagramPreviewButton.addEventListener('click', () => {
  // Deselect all objects on the canvas
  canvas.discardActiveObject();
  canvas.renderAll();

  // Generate a data URL for the Instagram post preview
  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1,
  });

  // Display the data URL in the preview image
  previewImage.src = dataURL;

  // Show the preview modal
  previewModal.classList.remove('hidden');
});

// Close the preview modal
closePreviewModal.addEventListener('click', () => {
  previewModal.classList.add('hidden');
});
*/

// Select Swipeable Preview button and modal elements
const swipeablePreviewButton = document.getElementById('swipeablePreviewButton');
const swipeableModal = document.getElementById('swipeableModal');
const carouselContainer = document.querySelector('.swiper-wrapper');
const closeSwipeableModal = document.getElementById('closeSwipeableModal');

// Initialize Swiper.js
const swiper = new Swiper('.swiper-container', {
    slidesPerView: 1, // Show one slide at a time
    spaceBetween: 0,  // No spacing between slides
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    centeredSlides: true, // Ensure active slide is centered
  });



  swipeablePreviewButton.addEventListener('click', () => {
  const totalSections = currentExpansion; // Number of sections (pages)
  const sectionWidth = fullWidth; // Full resolution width for each section
  const originalWidth = canvas.width; // Original canvas width
  const originalHeight = canvas.height; // Original canvas height

  // Deselect all objects
  canvas.discardActiveObject();

  // Scale canvas to full resolution
  canvas.setWidth(fullWidth * currentExpansion);
  canvas.setHeight(
    canvas.height === previewHeightPortrait ? fullHeightPortrait : fullHeightSquare
  );

  const scaleX = canvas.width / originalWidth;
  const scaleY = canvas.height / originalHeight;

  const lines = [];
  canvas.getObjects().forEach((obj) => {
    if (obj.type === 'line') {
      lines.push(obj);
      canvas.remove(obj);
    } else {
      obj.scaleX *= scaleX;
      obj.scaleY *= scaleY;
      obj.left *= scaleX;
      obj.top *= scaleY;
      obj.setCoords();
    }
  });

  removePlaceholderIcons();

  canvas.renderAll();

  // Clear previous carousel content
  carouselContainer.innerHTML = '';

  for (let i = 0; i < totalSections; i++) {
    const clonedCanvas = new fabric.Canvas(null, {
      width: sectionWidth,
      height: canvas.height,
    });

    canvas.getObjects().forEach((obj) => {
      const clonedObj = fabric.util.object.clone(obj);
      clonedObj.left -= i * sectionWidth;
      clonedCanvas.add(clonedObj);
    });

    clonedCanvas.renderAll();

    const dataURL = clonedCanvas.toDataURL({
      format: 'png',
      quality: 1,
    });

    // Add the data URL as a slide in the Swiper carousel
    const slide = document.createElement('div');
    slide.classList.add('swiper-slide');
    slide.innerHTML = `<img src="${dataURL}" class="w-full rounded-lg">`;
    carouselContainer.appendChild(slide);

    // Dispose of the cloned canvas to free memory
    clonedCanvas.dispose();
  }

  // Reset canvas to original dimensions
  canvas.setWidth(originalWidth);
  canvas.setHeight(originalHeight);

  canvas.getObjects().forEach((obj) => {
    if (!lines.includes(obj)) {
      obj.scaleX /= scaleX;
      obj.scaleY /= scaleY;
      obj.left /= scaleX;
      obj.top /= scaleX;
      obj.setCoords();
    }
  });

  lines.forEach((line) => canvas.add(line));
  canvas.renderAll();

  // Update Swiper with new slides
  swiper.update();

  // Show the modal
  swipeableModal.classList.remove('hidden');
});

// Close the Swipeable Preview Modal
closeSwipeableModal.addEventListener('click', () => {
  swipeableModal.classList.add('hidden');
});

document.addEventListener('click', (event) => {
    const canvasRect = canvas.upperCanvasEl.getBoundingClientRect(); // Get canvas dimensions and position
  
    const isOutsideCanvas =
      event.clientX < canvasRect.left ||
      event.clientX > canvasRect.right ||
      event.clientY < canvasRect.top ||
      event.clientY > canvasRect.bottom;
  
      if (isOutsideCanvas) {
        // Deselect active object and re-render canvas
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    });


  function addPlaceholderIcons(expansions) {
    const sectionWidth = previewWidth; // Width of each section
    const sectionHeight = canvas.height; // Height of the canvas
  
    // Add placeholder icons for each section
    for (let i = 0; i < expansions; i++) {
      // Load the image for the placeholder icon
      fabric.Image.fromURL('https://img.icons8.com/ios/50/000000/plus-math.png', (img) => {
        img.set({
          left: i * sectionWidth + sectionWidth / 2 - 25, // Center horizontally
          top: sectionHeight / 2 - 25, // Center vertically
          scaleX: 0.5,
          scaleY: 0.5,
          selectable: false, // Prevent user interactions
          evented: false, // Disable events
          placeholder: true, // Custom property to identify as placeholder
        });
        canvas.add(img);
      });
    }
  
    canvas.renderAll();
  }

  function removePlaceholderIcons() {
    // Remove all objects with the placeholder property
    canvas.getObjects('image').forEach((obj) => {
      if (obj.placeholder) {
        canvas.remove(obj);
      }
    });
  
    canvas.renderAll();
  }


expandWidthButton.click();
expandWidthButton.click();
expandWidthButton.click();
expandWidthButton.click();
