/* eslint-disable no-restricted-syntax */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Worker, isMainThread } = require('worker_threads');
const numCPUs = require('os').cpus().length;
const { payloads } = require('./payloads.json');

let payload = {};

const app = express();
app.use(bodyParser);
app.use(cors());

/* Variáveis para Workers Threads */
const final = [];
const LEADING_ZEROES = 5;
const THREADS_NUMBER = 1;
let finishedWorkers = 0;


const workerOnce = async (worker) => {
  const startTime = process.hrtime();
  try {
    await worker.once('message', (message) => {
      final.push(message);
      finishedWorkers += 1;
      if (finishedWorkers === payloads.length) {
        console.log(final);
        const time = process.hrtime(startTime);
        console.log(`-------------------Usando ${THREADS_NUMBER} workers--------------------`);
        console.info('Tempo de execução: %d s', (time[0] + (time[1] / 10e9)));
        console.log('-------------------------------------------------------');
      }
    });
  } catch (err) {
    worker.on('error', console.error);
  }
};


const setUpWorker = async (payload) => {
  try {
    const worker = new Worker('./app/worker.js', { env: { LEADING_ZEROES } });
    await workerOnce(worker);
    return worker;
  } catch (err) {
    console.log(err);
  }
};

const executa = async () => {
  if (isMainThread) {
    for (payload of payloads) {
      const worker = setUpWorker(payload);
      console.log(`Iniciando worker de ID ${worker.threadId} e enviando o payload: ${payload}`);
      worker.postMessage(payload);
    }
  }
};

executa();

app.listen(3000, () => {
  console.log('Subiu na porta 3000');
});
