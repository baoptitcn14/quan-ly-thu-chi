import * as tf from '@tensorflow/tfjs';

async function trainModel() {
  // Tạo model đơn giản để phân tích văn bản
  const model = tf.sequential();
  
  model.add(tf.layers.embedding({
    inputDim: 5000, // Vocabulary size
    outputDim: 32,
    inputLength: 100
  }));
  
  model.add(tf.layers.lstm({
    units: 64,
    returnSequences: false
  }));
  
  model.add(tf.layers.dense({
    units: 3, // Số lượng loại câu hỏi
    activation: 'softmax'
  }));

  model.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  // Lưu model
  await model.save('file://src/assets/models/spending_analysis');
}

trainModel(); 