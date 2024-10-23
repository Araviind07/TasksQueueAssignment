const cluster = require('cluster');
const fs = require('fs');
const express = require('express');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const Bull = require('bull');
const dotenv = require('dotenv');

dotenv.config();
console.log(process.env);

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisPassword = process.env.REDIS_PASSWORD;

const taskQueue = new Bull('taskQueue', {
    redis: {
      password: redisPassword,
      port: redisPort,
      host: redisHost,
    },
  });
  

const app = express();
app.use(bodyParser.json());


const logTaskCompletion = (userId) => {
    const logMessage = `${userId} - task completed at ${new Date().toISOString()}\n`;
    fs.appendFile('task_log.txt', logMessage, (err) => {
      if (err) throw err;
    });
  }; 
const processTask = async (userId) => {
   await logTaskCompletion(userId);
  }; 

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    for (let i = 0; i < 2; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        console.log('Starting a new worker');
        cluster.fork(); 
    });
    
} else {
    const perSecondLimiter = rateLimit({
    windowMs: 1000, 
    max: 1, 
    keyGenerator: (req, res) => req.body.user_id, 
    message: 'You can only make 1 request per second. Please wait.',
  });
  
 
  const perMinuteLimiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 20,
    keyGenerator: (req, res) => req.body.user_id, 
    message: 'You have exceeded the 20 requests per minute limit. Please wait a while and try again.',
  });
  
  
 
  app.use('/api', perSecondLimiter);
  app.use('/api', perMinuteLimiter);
  

   
    app.post('/api/v1/task', async (req, res) => {
      const userId = req.body.user_id || 'unknownUser';
      await taskQueue.add({ userId });
      res.send(`Task for User ID: ${userId} has been queued. Worker: ${process.pid}`);
       
    });

    
    app.get('/kill', (req, res) => {
        res.send(`Worker ${process.pid} will exit now`);
        process.exit();  
    });

    const PORT = 8000;

   
    app.listen(PORT, () => {
        console.log(`Worker ${process.pid} started, listening on port ${PORT}`);
    });
    }  

taskQueue.process(async (job) => {
      try {
        const { userId } = job.data;
        console.log(`Processing task for User ID: ${userId}`);
        await processTask(userId);
      } catch (error) {
        console.error(`Error processing task for User ID: ${userId}`, error);
        throw error; 
      }
});

  
    
