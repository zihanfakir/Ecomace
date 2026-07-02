const { dbMutex } = require('../data/db');

const dbLock = async (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  
  await dbMutex.acquire();
  let released = false;
  
  const releaseLock = () => {
    if (!released) {
      released = true;
      dbMutex.release();
    }
  };

  res.on('finish', releaseLock);
  res.on('close', releaseLock);
  
  next();
};

module.exports = dbLock;
