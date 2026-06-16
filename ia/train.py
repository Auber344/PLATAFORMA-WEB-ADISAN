import json
import nltk
import numpy as np
import pickle
import random
import os

from nltk.stem.snowball import SnowballStemmer

BASE = os.path.dirname(os.path.abspath(__file__))

nltk.download('punkt')
nltk.download('punkt_tab')

stemmer = SnowballStemmer('spanish')

with open(os.path.join(BASE, 'intents.json'), encoding='utf-8') as f:
    intents = json.load(f)

words = []
classes = []
documents = []
ignore_chars = ['?', '!', '.', ',', '¿', '¡']

for intent in intents['intents']:
    for pattern in intent['patterns']:
        tokens = nltk.word_tokenize(pattern.lower())
        words.extend(tokens)
        documents.append((tokens, intent['tag']))
        if intent['tag'] not in classes:
            classes.append(intent['tag'])

words = [stemmer.stem(w.lower()) for w in words if w not in ignore_chars]
words = sorted(set(words))
classes = sorted(set(classes))

training = []
output_empty = [0] * len(classes)

for doc in documents:
    bag = []
    pattern_words = [stemmer.stem(w.lower()) for w in doc[0] if w not in ignore_chars]
    for w in words:
        bag.append(1 if w in pattern_words else 0)
    output_row = list(output_empty)
    output_row[classes.index(doc[1])] = 1
    training.append((bag, output_row))

random.shuffle(training)

train_x = np.array([t[0] for t in training])
train_y = np.array([t[1] for t in training])

input_size = len(train_x[0])
output_size = len(train_y[0])
hidden1 = 128
hidden2 = 64

np.random.seed(42)
w1 = np.random.randn(input_size, hidden1) * 0.1
b1 = np.zeros(hidden1)
w2 = np.random.randn(hidden1, hidden2) * 0.1
b2 = np.zeros(hidden2)
w3 = np.random.randn(hidden2, output_size) * 0.1
b3 = np.zeros(output_size)

def relu(x):
    return np.maximum(0, x)

def softmax(x):
    e_x = np.exp(x - np.max(x, axis=1, keepdims=True))
    return e_x / np.sum(e_x, axis=1, keepdims=True)

def forward(x):
    z1 = np.dot(x, w1) + b1
    a1 = relu(z1)
    z2 = np.dot(a1, w2) + b2
    a2 = relu(z2)
    z3 = np.dot(a2, w3) + b3
    a3 = softmax(z3)
    return a1, a2, a3

def train_step(x, y, lr=0.01):
    global w1, b1, w2, b2, w3, b3
    a1, a2, a3 = forward(x)
    m = x.shape[0]
    dz3 = a3 - y
    dw3 = np.dot(a2.T, dz3) / m
    db3 = np.sum(dz3, axis=0) / m
    da2 = np.dot(dz3, w3.T)
    dz2 = da2 * (a2 > 0)
    dw2 = np.dot(a1.T, dz2) / m
    db2 = np.sum(dz2, axis=0) / m
    da1 = np.dot(dz2, w2.T)
    dz1 = da1 * (a1 > 0)
    dw1 = np.dot(x.T, dz1) / m
    db1 = np.sum(dz1, axis=0) / m
    w1 -= lr * dw1
    b1 -= lr * db1
    w2 -= lr * dw2
    b2 -= lr * db2
    w3 -= lr * dw3
    b3 -= lr * db3
    loss = -np.mean(np.sum(y * np.log(a3 + 1e-8), axis=1))
    return loss

epochs = 800
batch_size = 8
for epoch in range(epochs):
    idx = np.random.permutation(len(train_x))
    x_shuffled = train_x[idx]
    y_shuffled = train_y[idx]
    total_loss = 0
    n_batches = 0
    for i in range(0, len(train_x), batch_size):
        x_batch = x_shuffled[i:i+batch_size]
        y_batch = y_shuffled[i:i+batch_size]
        loss = train_step(x_batch, y_batch)
        total_loss += loss
        n_batches += 1
    if (epoch + 1) % 50 == 0:
        print(f"Epoch {epoch+1}/{epochs}, Loss: {total_loss/n_batches:.4f}")

predictions = forward(train_x)[2]
accuracy = np.mean(np.argmax(predictions, axis=1) == np.argmax(train_y, axis=1))
print(f"Entrenamiento completado. Precisión: {accuracy:.2%}")

model_data = {
    'w1': w1, 'b1': b1,
    'w2': w2, 'b2': b2,
    'w3': w3, 'b3': b3
}

with open(os.path.join(BASE, 'model.pkl'), 'wb') as f:
    pickle.dump(model_data, f)
with open(os.path.join(BASE, 'words.pkl'), 'wb') as f:
    pickle.dump(words, f)
with open(os.path.join(BASE, 'classes.pkl'), 'wb') as f:
    pickle.dump(classes, f)

print("Modelo guardado en model.pkl")
