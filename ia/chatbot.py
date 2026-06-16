import json
import nltk
import numpy as np
import pickle
import random
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_cors import CORS
from nltk.stem.snowball import SnowballStemmer

from respuestas import (
    consultar_stock,
    consultar_productos,
    consultar_precio,
    consultar_pedido_estado,
    consultar_pedido_llegada,
    consultar_pedido_enviado,
    consultar_ofertas,
    sugerir_producto,
    mostrar_navegacion,
)

app = Flask(__name__)
CORS(app)

BASE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE, 'words.pkl'), 'rb') as f:
    words = pickle.load(f)
with open(os.path.join(BASE, 'classes.pkl'), 'rb') as f:
    classes = pickle.load(f)
with open(os.path.join(BASE, 'model.pkl'), 'rb') as f:
    model = pickle.load(f)
with open(os.path.join(BASE, 'intents.json'), encoding='utf-8') as f:
    intents = json.load(f)

stemmer = SnowballStemmer('spanish')

w1 = model['w1']
b1 = model['b1']
w2 = model['w2']
b2 = model['b2']
w3 = model['w3']
b3 = model['b3']

def relu(x):
    return np.maximum(0, x)

def softmax(x):
    e_x = np.exp(x - np.max(x, axis=1, keepdims=True))
    return e_x / np.sum(e_x, axis=1, keepdims=True)

def limpiar_texto(texto):
    tokens = nltk.word_tokenize(texto)
    tokens = [stemmer.stem(t.lower()) for t in tokens]
    return tokens

def bag_of_words(texto):
    tokens = limpiar_texto(texto)
    bag = [0] * len(words)
    for t in tokens:
        for i, w in enumerate(words):
            if w == t:
                bag[i] = 1
    return np.array([bag])

def predecir_intent(texto):
    bow = bag_of_words(texto)
    z1 = np.dot(bow, w1) + b1
    a1 = relu(z1)
    z2 = np.dot(a1, w2) + b2
    a2 = relu(z2)
    z3 = np.dot(a2, w3) + b3
    a3 = softmax(z3)
    res = a3[0]
    threshold = 0.15
    results = [[i, r] for i, r in enumerate(res) if r > threshold]
    results.sort(key=lambda x: x[1], reverse=True)
    if not results:
        return None
    return classes[results[0][0]]

def obtener_respuesta(intent_tag, mensaje, cliente_id=None):
    if intent_tag == 'stock':
        return consultar_stock()
    elif intent_tag == 'productos':
        return consultar_productos()
    elif intent_tag == 'precio':
        return consultar_precio()
    elif intent_tag == 'pedido_estado':
        return consultar_pedido_estado(cliente_id)
    elif intent_tag == 'pedido_llegada':
        return consultar_pedido_llegada(cliente_id)
    elif intent_tag == 'pedido_enviado':
        return consultar_pedido_enviado(cliente_id)
    elif intent_tag == 'ofertas':
        return consultar_ofertas()
    elif intent_tag == 'sugerir_producto':
        return sugerir_producto(mensaje)
    elif intent_tag == 'navegacion':
        return mostrar_navegacion(mensaje)
    else:
        for i in intents['intents']:
            if i['tag'] == intent_tag:
                return random.choice(i['responses'])
    return "No entendí tu consulta. Puedes preguntarme por stock, productos, precios, ofertas o el estado de tu pedido."

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    mensaje = data.get('mensaje', '').lower()
    cliente_id = data.get('cliente_id')

    intent_tag = predecir_intent(mensaje)
    if intent_tag is None:
        return jsonify({
            "respuesta": "No entendí tu consulta. Puedes preguntarme por stock, productos, precios, ofertas o el estado de tu pedido."
        })

    respuesta = obtener_respuesta(intent_tag, mensaje, cliente_id)
    return jsonify({"respuesta": respuesta, "intent": intent_tag})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
