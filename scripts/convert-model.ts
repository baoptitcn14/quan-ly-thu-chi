import * as tf from '@tensorflow/tfjs';

async function convertModel() {
  // Load model từ checkpoint
  const model = await tf.loadLayersModel('path/to/checkpoint');
  
  // Convert và save
  await model.save('file://./src/assets/models');
}

convertModel(); 